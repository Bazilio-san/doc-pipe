/* eslint-disable no-new-func */
import * as fs from 'fs-extra';
import * as path from 'path';
import util from 'util';
import axios from 'axios';
import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PuppeteerCrawler, RequestList } from 'crawlee';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import { getFileNameByUrl, getTypeByContentType } from '../get-link-metadata/get-link-metadata';
import { isCodeSafe } from './js-code-validator';

// First, we tell puppeteer-extra to use the plugin (or plugins) we want.
// Certain plugins might have options you can pass in - read up on their documentation!
puppeteerExtra.use(stealthPlugin());

const getTypeAndFileName = async (link: ICoreDlinkRecord, response: any): Promise<{ type: string | null | undefined, fileName: string | undefined }> => {
  let { type, fileName } = link;
  if (type && fileName) {
    return { type, fileName };
  }
  const contentType = response?.headers()['content-type'];
  type = getTypeByContentType(contentType) || contentType;
  fileName = getFileNameByUrl(link.url);
  return { type, fileName };
};

const BASE_FILE_DIR_NAME = '_files';
const BASE_FILE_DIR = path.resolve(path.join(process.cwd(), BASE_FILE_DIR_NAME));
if (!fs.existsSync(BASE_FILE_DIR)) {
  fs.ensureDirSync(BASE_FILE_DIR);
}

const saveFile = async (fileName: string, type: string, data: ArrayBuffer): Promise<string> => {
  const writeFile = util.promisify(fs.writeFile);
  const filePath = path.normalize(path.join(BASE_FILE_DIR, `${fileName}.${type}`));
  await writeFile(filePath, Buffer.from(data));
  return filePath;
};
const getScreenshotPath = (fileName: string, type: string): string => path.normalize(path.join(BASE_FILE_DIR, `${fileName}.${type}`));

const js4print = (s: string) => `\n\`\`\`jsvaScript\n${s}\n\`\`\``;

// --- VVR ----
const getSnippet1 = () => {
  let code = fs.readFileSync(path.join(__dirname, 'snippet1.js'), { encoding: 'utf8' });
  code = code.split(/\/\/ *-+ *code *-+[\n\r]+/i)[1];
  return code;
};

export const getPagesByRecordset = async (links: ICoreDlinkRecord[]) => {
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
    async requestHandler ({ request, page, response, log, pushData, enqueueLinks }) {
      const { url } = request;
      const { link } = request.userData as { link: ICoreDlinkRecord };
      let { type, fileName } = link;
      log.info(`Обработка ${url}`);

      ({ type, fileName } = await getTypeAndFileName(link, response));
      if (!type) {
        return;
      }

      if (['pdf', 'docx', 'xlsx'].includes(type || '')) {
        // Скачиваем и сохраняем PDF или DOCX файл
        if (!fileName) {
          return;
        }
        try {
          const resp = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
          const filePath = await saveFile(fileName, type, resp.data);
          log.info(`Сохранен файл ${filePath}`);
        } catch (error: any) {
          log.error(`Ошибка при скачивании файла: ${error.message}`);
        }
        return;
      }

      if (type === 'html') {
        const codeFragment = link.js || getSnippet1();
        // Выполняем заданный фрагмент кода JavaScript
        if (codeFragment) {
          if (!isCodeSafe(`const page = {};\nconst request = {};\nconst resultData = {};\n${codeFragment}`)) {
            // Предупреждение: выполнение произвольного кода может быть небезопасно.
            // Убедитесь, что codeFragment исходит из доверенного источника.
            log.error(`Пользовательский JS код для ссылки ${url} (id: ${link.linkId}) не безопасен:${js4print(codeFragment)}`);
            return;
          }
          try {
            const resultData: any = {};
            const func = new Function('page', 'request', 'resultData', codeFragment) as (page: any, request: any, resultData: any) => Promise<void>;
            await func(page, request, resultData);
          } catch (error: any) {
            log.error(`Ошибка при выполнении codeFragment: ${error.message}`);
          }
        }

        const screenshot = await page.screenshot({ fullPage: true, path: getScreenshotPath(fileName || 'foo', 'jpg') });

        // Сохраняем страницу в PDF
        const pdfFileName = `${fileName}.pdf`;
        await page.pdf({ path: pdfFileName });
        log.info(`Сохранен PDF ${pdfFileName}`);
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
// const element = await page.$('selector'); // Replace 'selector' with the actual CSS selector
// if (element) {
//   await element.screenshot({ path: 'element.png' });
// }