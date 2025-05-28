const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Facebook Link Extractor</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 20px;
          }
          input.link-box {
            width: 80%;
            margin: 5px 0;
            padding: 5px;
          }
          button.copy-btn {
            margin-left: 5px;
            cursor: pointer;
          }
          section {
            margin-bottom: 40px;
          }
        </style>
      </head>
      <body>
        <h1>Facebook Link Extractor</h1>

        <section>
          <h2>ฟีเจอร์ 1: ดึงลิงก์จาก Clickbase</h2>
          <input id="urlInput1" type="text" size="80" value="" />
          <button onclick="extractAttribLinks()">ดึงลิงก์ attributionsrc</button>
          <div id="output1"></div>
        </section>

        <section>
          <h2>ฟีเจอร์ 2: ดึงลิงก์จากโพสต์ พร้อมกรอง hashtag)</h2>
          <h3>ถ้าไม่มีลิ้งบน โพสต์จะหาลิ้งใต้คอมเม้น</h3>
          <input id="urlInput2" type="text" size="80" value="" />
          <button onclick="extractPostLinks()">ดึงลิงก์โพสต์</button>
          <div id="output2"></div>
        </section>

        <script>
          async function extractAttribLinks() {
            const url = document.getElementById('urlInput1').value;
            const output = document.getElementById('output1');
            output.innerHTML = '<p>⏳ กำลังดึงข้อมูล...</p>';

            try {
              const response = await fetch('/extract?url=' + encodeURIComponent(url));
              if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูล');

              const data = await response.json();

              if (data.links.length === 0) {
                output.innerHTML = '<p>❌ ไม่พบลิงก์ที่มี attributionsrc ที่เป็น l.php</p>';
              } else {
                let html = "<p>✅ พบลิงก์ที่มี attributionsrc และเป็นลิงก์ l.php (ไม่ซ้ำ):</p>";
                data.links.forEach((link, index) => {
                  const safeId = 'link_' + index;
                  html += \`
                    <div>
                      <input type="text" id="\${safeId}" class="link-box" value="\${link.href}" readonly />
                      <button class="copy-btn" onclick="copyToClipboard('\${safeId}')">📋 คัดลอก</button>
                    </div>
                  \`;
                });
                output.innerHTML = html;
              }
            } catch (err) {
              output.innerHTML = '<p>❌ ' + err.message + '</p>';
            }
          }

          async function extractPostLinks() {
            const url = document.getElementById('urlInput2').value;
            const output = document.getElementById('output2');
            output.innerHTML = '<p>⏳ กำลังดึงข้อมูล...</p>';

            try {
              const response = await fetch('/extract-post-links?url=' + encodeURIComponent(url));
              if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูล');

              const data = await response.json();

              if (data.links.length === 0) {
                output.innerHTML = '<p>❌ ไม่พบลิงก์ในโพสต์</p>';
              } else {
                let html = "<p>✅ พบลิงก์ในโพสต์ (ไม่ซ้ำ และไม่ใช่ hashtag):</p>";
                data.links.forEach((link, index) => {
                  const safeId = 'postlink_' + index;
                  html += \`
                    <div>
                      <input type="text" id="\${safeId}" class="link-box" value="\${link.href}" readonly />
                      <button class="copy-btn" onclick="copyToClipboard('\${safeId}')">📋 คัดลอก</button>
                    </div>
                  \`;
                });
                output.innerHTML = html;
              }
            } catch (err) {
              output.innerHTML = '<p>❌ ' + err.message + '</p>';
            }
          }

          function copyToClipboard(id) {
            const input = document.getElementById(id);
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
            alert('✅ คัดลอกแล้ว: ' + input.value);
          }
        </script>
      </body>
    </html>
  `);
});

// API 1: ดึงลิงก์จาก a[attributionsrc] ที่เป็น l.facebook.com/l.php
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
    } catch {}

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

// API 2: ดึงลิงก์จากโพสต์ div[dir="auto"], กรอง hashtag และไม่ซ้ำ
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
    } catch {}

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
          } catch {}
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
