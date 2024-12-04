/* eslint-disable no-new-func */
import axios from 'axios';
import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PuppeteerCrawler, RequestList } from 'crawlee';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import { isCodeSafe, wrapCode } from './js-code-validator';
import { getTypeAndFileName, js4print, saveContentToDb } from './storage-lib';
import { updateLinkCrawlErrorInDb } from './update-link-in-db';

// First, we tell puppeteer-extra to use the plugin (or plugins) we want.
// Certain plugins might have options you can pass in - read up on their documentation!
puppeteerExtra.use(stealthPlugin());

// --- VVR ----
// const getSnippet1 = () => {
//   let code = fs.readFileSync(path.join(__dirname, 'snippet1.js'), { encoding: 'utf8' });
//   code = code.split(/\/\/ *-+ *code *-+[\n\r]+/i)[1];
//   return code;
// };

const pageScrapper = async ({ request, page, response, log }) => {
  const { url } = request;
  const { link } = request.userData as { link: ICoreDlinkRecord };
  let { type, fileName } = link;
  const { linkId = 0 } = link;
  log.info(`Обработка ${url}`);

  ({ type, fileName } = await getTypeAndFileName(link, response));
  if (!type || !fileName) {
    await updateLinkCrawlErrorInDb({ crawlError: 'Не удалось определить имя файла для этой ссылки', where: ` "linkId" = ${linkId} ` });
    log.error('Не удалось определить имя файла для этой ссылки');
    return;
  }

  // =================== PDF, DOCX, XLSX ==========

  if (['pdf', 'docx', 'xlsx'].includes(type || '')) {
    // Скачиваем и сохраняем PDF или DOCX файл
    try {
      const resp = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      await saveContentToDb(linkId, fileName, type, resp.data);
    } catch (error: any) {
      await updateLinkCrawlErrorInDb({ crawlError: `Ошибка скачивания файла: ${error.message}`, where: ` "linkId" = ${linkId} ` });
      log.error(`Ошибка скачивания файла: ${error.message}`);
    }
    return;
  }

  // =================== HTML ==========

  if (type === 'html') {
    let html = '';
    const codeFragment = link.js;
    // Выполняем заданный фрагмент кода JavaScript
    if (codeFragment) {
      if (!isCodeSafe(wrapCode(codeFragment))) {
        // Предупреждение: выполнение произвольного кода может быть небезопасно.
        // Убедитесь, что codeFragment исходит из доверенного источника.
        log.error(`Пользовательский JS код для ссылки ${url} (id: ${link.linkId}) не безопасен:${js4print(codeFragment)}`);
        await updateLinkCrawlErrorInDb({
          crawlError: `Пользовательский JS код для ссылки ${url} (id: ${link.linkId}) не безопасен:${js4print(codeFragment)}`,
          where: ` "linkId" = ${linkId} `,
        });
        return;
      }
      try {
        const resultData: any = {};
        const func = new Function('page', 'request', 'resultData', `return (async () => {\n${codeFragment}\n})();`) as (page: any, request: any, resultData: any) => Promise<void>;
        await func(page, request, resultData);
        html = resultData.content;
      } catch (error: any) {
        log.error(`Ошибка при выполнении codeFragment: ${error.message}`);
        await updateLinkCrawlErrorInDb({ crawlError: `Ошибка при выполнении codeFragment: ${error.message}`, where: ` "linkId" = ${linkId} ` });
        return;
      }
    }

    const { contentSelector, parsePicture } = link;
    if (contentSelector) {
      let content: Uint8Array | undefined;
      if (contentSelector === 'html') {
        if (parsePicture) {
          content = await page.screenshot();
        } else {
          content = await page.content();
        }
      } else {
        // Ожидание появления элемента на странице
        await page.waitForSelector(contentSelector, { timeout: 10_000 });
        // Поиск элемента
        const element = await page.$(contentSelector);
        if (element) {
          if (parsePicture) {
            // Сохранение скриншота элемента
            content = await element.screenshot();
          } else {
            // Сохранение html элемента
            content = await element.content();
          }
        } else {
          log.warning(`Элемент не найден для селектора: ${contentSelector}`);
          await updateLinkCrawlErrorInDb({ crawlError: `Элемент не найден для селектора: ${contentSelector}`, where: ` "linkId" = ${linkId} ` });
          return;
        }
      }
      if (content) await saveContentToDb(linkId, fileName, type, typeof content === 'string' ? content : Buffer.from(content));
      return;
    }

    html = html || await page.content();
    await saveContentToDb(linkId, fileName, type, html);
    return;
  }
  await updateLinkCrawlErrorInDb({ crawlError: `Неподдерживаемый тип содержания источника: ${type}`, where: ` "linkId" = ${linkId} ` });
  log.warning(`Неподдерживаемый тип содержания источника: ${type}`);
};

export const getPagesContentByRecordset = async (links: ICoreDlinkRecord[]) => {
  // Создаем RequestList из списка ссылок
  const requestList = await RequestList.open('start-urls', links.map((link) => ({
    url: link.url,
    userData: { link },
  })));

  // Инициализируем PuppeteerCrawler
  const crawler = new PuppeteerCrawler({
    requestList,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 40,
    sameDomainDelaySecs: 5,
    maxRequestRetries: 1,
    navigationTimeoutSecs: 30,
    // Настройки браузера
    launchContext: {
      launchOptions: { headless: false },
      // !!! You need to specify this option to tell Crawlee to use puppeteer-extra as the launcher !!!
      launcher: puppeteerExtra,
    },
    // ограничение страниц дял кроулинга
    // maxRequestsPerCrawl: 50,
    async errorHandler ({ request, page, response, log }) {
      await pageScrapper({ request, page, response, log });
    },
    async requestHandler ({ request, page, response, log }) {
      await pageScrapper({ request, page, response, log });
    },
    // Неудачное открытие страницы
    async failedRequestHandler ({ request, log }) {
      const { link } = request.userData as { link: ICoreDlinkRecord };
      const { linkId = 0 } = link;
      await updateLinkCrawlErrorInDb({ crawlError: `Запрос ${request.url} потерпел ошибку слишком много раз`, where: ` "linkId" = ${linkId} ` });
      log.error(`Запрос ${request.url} потерпел ошибку слишком много раз`);
    },
  });

  // Запускаем краулер
  await crawler.run();
};
