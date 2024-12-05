import { PuppeteerCrawler } from 'crawlee';
import fs from 'fs';

const crawler = new PuppeteerCrawler({
  async requestHandler ({ request, page, log }) {
    const selector = 'YOUR_SELECTOR_HERE'; // Replace with your target selector
    await page.waitForSelector(selector);

    const content = await page.$eval(selector, (el) => el.innerHTML);

    const fileName = `output-${Date.now()}.html`;
    fs.writeFileSync(fileName, content);

    log.info(`Content saved to ${fileName}`);
  },
});

// await crawler.run(['https://example.com']); // Replace with your target URL
