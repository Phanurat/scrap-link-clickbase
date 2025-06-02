const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.thairath.co.th/news/politic/2862093', {
    waitUntil: 'networkidle2',
  });

  await page.waitForSelector('p, div');

  const texts = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('p, div'))
      .filter(el => !el.querySelector('a') && !el.querySelector('span'));

    const allTexts = elements
      .map(el => el.innerText.trim())
      .filter(text => text.length > 0);

    return Array.from(new Set(allTexts));
  });

  console.log(texts);

  await browser.close();
})();
