const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 9000;

app.use(express.static('public')); // โฟลเดอร์ public เก็บไฟล์ html ด้านบน

app.get('/extract', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'กรุณาระบุ url' });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // รอ selector แต่ถ้า timeout ก็ผ่านไป
    try {
      await page.waitForSelector('a[attributionsrc]', { timeout: 5000 });
    } catch { }
    const content = await page.$eval('div[data-ad-preview="message"]', el => el.innerText);
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

    res.json({ content, links });
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

    // รอโพสต์โหลด (ไม่จำเป็นต้องจับ error)
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
              continue; // ข้ามลิงก์ hashtag
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

app.get('/extract-full', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'กรุณาระบุ url' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('p, div', { timeout: 10000 });

    // ดึงข้อความจาก <p> และ <div> ที่ไม่มี <a> หรือ <span> ย่อย
    const texts = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p, div'))
        .filter(el => !el.querySelector('a', 'data-v-510c75d3') && !el.querySelector('span'));

      const allTexts = elements
        .map(el => el.innerText.trim())
        .filter(text => text.length > 0);

      return Array.from(new Set(allTexts));
    });

    await browser.close();

    res.json({ results: texts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/content', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // ไปยัง URL ที่รับมา
    await page.goto(url, { waitUntil: 'networkidle2' });

    // รอ selector ที่น่าจะเป็นข้อความโพสต์ Facebook (อาจต้องปรับ selector ตามโครงสร้างปัจจุบัน)
    await page.waitForSelector('div[data-ad-preview="message"]', { timeout: 10000 });

    // ดึงข้อความโพสต์
    const content = await page.$eval('div[data-ad-preview="message"]', el => el.innerText);

    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Something went wrong' });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
