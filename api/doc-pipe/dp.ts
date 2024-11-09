import { HttpCrawler, PuppeteerCrawler, Dataset } from 'crawlee';
import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import { echo } from 'af-echo-ts';
import { TABLE } from '../constants';
import { execMAIN, queryRsMAIN } from '../services/db/pg-db';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import ee from '../services/ee';
import { mimeTypeMap } from './mime-types-map';


const SOURCE_REQUEST_TIMEOUT_MILLIS = 8_000;
const crawlerHTTP = new HttpCrawler({
  ignoreSslErrors: true,
  requestHandlerTimeoutSecs: SOURCE_REQUEST_TIMEOUT_MILLIS, // 20 seconds
  // Limit to 10 requests per one crawl
  maxRequestsPerCrawl: 50,
  maxRequestRetries: 2,
  keepAlive: true,
  async requestHandler ({ request, response, body, contentType }) {
    const { headers, statusCode } = response;
    console.log(headers, body);
    // await Dataset.pushData({ url: request.url, html: body });
  },
  async failedRequestHandler ({ request, response }, error) {
    const { headers, statusCode } = response;
    console.log(headers, error);
    // await Dataset.pushData({ url: request.url, html: body });
  },
});


// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PuppeteerCrawler({
  // Use the requestHandler to process each of the crawled pages.
  async requestHandler (result) {
    const { request: req, page, enqueueLinks, log, contentType } = result;
    // console.log(response);
    const title = await page.title();
    log.info(`Title of ${req.loadedUrl} is '${title}'`);

    // Save results as JSON to ./storage/datasets/default
    await Dataset.pushData({ title, url: req.loadedUrl });
    console.log(contentType, req.loadedUrl);
    // Extract links from the current page
    // and add them to the crawling queue.
    // await enqueueLinks();
  },
  // Uncomment this option to see the browser window.
  // headless: false,

  // Let's limit our crawls to make our tests shorter and safer.
  maxRequestsPerCrawl: 50,
});

// Add first URL to the queue and start the crawl.
// crawler.run(['https://www.mql5.com/ru/articles/802']).then((...args) => {
//   console.log(...args);
// });

const getLinkList = async () => {
  const sql = `
    SELECT *
    FROM ${TABLE.DLINK}
    WHERE type is NOT NULL
    --AND url = 'https://www.mql5.com/ru/articles/802'
    LIMIT 1000`;
  const rows = (await queryRsMAIN<ICoreDlinkRecord>(sql)) || [];
  const urls = rows.map((r) => r.url);
  // await crawlerHTTP.run(urls);
  const cResult = await crawler.run(urls);
  console.log(cResult);
  process.exit();
};

getLinkList();
