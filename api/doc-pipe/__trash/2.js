const page = {};
const request = {};
const resultData = {};
// A function to be evaluated by Puppeteer within the browser context.
resultData.data = await page.$$eval('.athing', ($posts) => {
  const scrapedData = [];

  // We're getting the title, rank and URL of each post on Hacker News.
  $posts.forEach(($post) => {
    scrapedData.push({
      title: $post.querySelector('.title a')?.innerText,
      rank: $post.querySelector('.rank')?.innerText,
      href: $post.querySelector('.title a')?.href,
    });
  });

  return scrapedData;
});
