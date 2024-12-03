/* eslint-disable no-new-func */
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PuppeteerCrawler, RequestList } from 'crawlee';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import { isCodeSafe, wrapCode } from './js-code-validator';
import { getContentPath, getTypeAndFileName, js4print, saveContentToDb } from './storage-lib';

// First, we tell puppeteer-extra to use the plugin (or plugins) we want.
// Certain plugins might have options you can pass in - read up on their documentation!
puppeteerExtra.use(stealthPlugin());

// --- VVR ----
const getSnippet1 = () => {
  let code = fs.readFileSync(path.join(__dirname, 'snippet1.js'), { encoding: 'utf8' });
  code = code.split(/\/\/ *-+ *code *-+[\n\r]+/i)[1];
  return code;
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
    // Настройки браузера
    launchContext: {
      launchOptions: { headless: true },
      // !!! You need to specify this option to tell Crawlee to use puppeteer-extra as the launcher !!!
      launcher: puppeteerExtra,
    },
    // Stop crawling after several pages
    // maxRequestsPerCrawl: 50,

    // Обработчик запросов
    // This function will be called for each URL to crawl.
    // Here you can write the Puppeteer scripts you are familiar with,
    // with the exception that browsers and pages are automatically managed by Crawlee.
    // The function accepts a single parameter, which is an object with the following fields:
    // - request: an instance of the Request class with information such as URL and HTTP method
    // - page: Puppeteer's Page object (see https://pptr.dev/#show=api-class-page)
    async requestHandler ({ request, page, response, log }) {
      const { url } = request;
      const { link } = request.userData as { link: ICoreDlinkRecord };
      let { type, fileName } = link;
      const { linkId = 0 } = link;
      log.info(`Обработка ${url}`);

      ({ type, fileName } = await getTypeAndFileName(link, response));
      if (!type || !fileName) {
        return;
      }

      // =================== PDF, DOCX, XLSX ==========

      if (['pdf', 'docx', 'xlsx'].includes(type || '')) {
        // Скачиваем и сохраняем PDF или DOCX файл
        try {
          const resp = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
          await saveContentToDb(linkId, fileName, type, resp.data);
        } catch (error: any) {
          log.error(`Error downloading file: ${error.message}`);
        }
        return;
      }

      // =================== HTML ==========

      if (type === 'html') {
        let html = '';
        const codeFragment = link.js || getSnippet1();
        // Выполняем заданный фрагмент кода JavaScript
        if (codeFragment) {
          if (!isCodeSafe(wrapCode(codeFragment))) {
            // Предупреждение: выполнение произвольного кода может быть небезопасно.
            // Убедитесь, что codeFragment исходит из доверенного источника.
            log.error(`Пользовательский JS код для ссылки ${url} (id: ${link.linkId}) не безопасен:${js4print(codeFragment)}`);
            return;
          }
          try {
            const resultData: any = {};
            const func = new Function('page', 'request', 'resultData', `return (async () => {\n${codeFragment}\n})();`) as (page: any, request: any, resultData: any) => Promise<void>;
            await func(page, request, resultData);
            html = resultData.content;
          } catch (error: any) {
            log.error(`Ошибка при выполнении codeFragment: ${error.message}`);
          }
        }
        const { contentSelector } = link;
        if (contentSelector) {
          let screenshot: Uint8Array | undefined;
          if (contentSelector === 'html') {
            screenshot = await page.screenshot({ fullPage: true, path: getContentPath(fileName, 'jpg') });
          } else {
            // Ожидание появления элемента на странице
            await page.waitForSelector(contentSelector, { timeout: 10_000 });
            // Поиск элемента
            const element = await page.$(contentSelector);
            if (element) {
              // Сохранение скриншота элемента
              screenshot = await element.screenshot({ path: getContentPath(fileName, 'jpg') });
              log.info(`Screenshot of the element saved to ${fileName}`);
            } else {
              log.warning(`Element not found for selector: ${contentSelector}`);
            }
          }
          if (screenshot) {
            console.log(1);
          }
        }

        html = html || await page.content();
        await saveContentToDb(linkId, fileName, type, html);
        return;
      }
      log.warning(`Неподдерживаемый тип содержания источника: ${type}`);
    },
    // This function is called if the page processing failed more than maxRequestRetries+1 times.
    failedRequestHandler ({ request, log }) {
      log.error(`Request ${request.url} failed too many times.`);
    },
  });

  // Запускаем краулер
  await crawler.run();
};
