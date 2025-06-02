const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/extract', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'กรุณาระบุ url' });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
      await page.waitForSelector('a[attributionsrc]', { timeout: 5000 });
    } catch { }

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[attributionsrc]'));
      const seen = new Set();
      const uniqueLinks = [];

      for (const a of anchors) {
        const href = a.href;

        if (!href.startsWith('https://l.facebook.com/l.php')) continue;

        const baseHref = href.split('?')[0];

        if (!seen.has(baseHref)) {
          seen.add(baseHref);
          uniqueLinks.push({
            href,
            attributionsrc: a.getAttribute('attributionsrc'),
          });
        }
      }
      return uniqueLinks;
    });

    await browser.close();

    res.json({ links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/extract-post-links', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'กรุณาระบุ url' });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
      await page.waitForSelector('div[dir="auto"]', { timeout: 5000 });
    } catch { }

    const links = await page.evaluate(() => {
      const allPosts = Array.from(document.querySelectorAll('div[dir="auto"]'));
      const results = [];
      const seen = new Set();

      for (const post of allPosts) {
        const text = post.innerText?.trim();
        const linkEl = post.querySelector('a[href^="https://"]');
        const href = linkEl?.href;

        if (text && href) {
          try {
            const urlObj = new URL(href);
            if (urlObj.hostname === 'www.facebook.com' && urlObj.pathname.startsWith('/hashtag/')) {
              continue; 
            }

            const baseHref = href.split('?')[0];
            if (!seen.has(baseHref)) {
              seen.add(baseHref);
              results.push({ text, href });
            }
          } catch { }
        }
      }

      return results;
    });

    await browser.close();

    res.json({ links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
