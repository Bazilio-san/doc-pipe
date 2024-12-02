const fn = async (page, request, resultData) => {
// ----- code --------

  const selector = 'body > .container';
  await page.waitForSelector(selector);
  resultData.content = await page.$eval(selector, (el) => el.innerHTML);

// ----- code --------
};
