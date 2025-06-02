const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 9000;

app.use(express.static('public')); // โฟลเดอร์ public เก็บไฟล์ html ด้านบน

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
        .filter(el => !el.querySelector('a') && !el.querySelector('span'));

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

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
