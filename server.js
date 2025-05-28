// server.js
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

app.use(express.static('public')); // ไว้ serve ไฟล์หน้าเว็บ

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
        </style>
      </head>
      <body>
        <h1>Facebook Link Extractor</h1>
        <input id="urlInput" type="text" size="80" value="https://www.facebook.com/thairath/posts/1182920653874276" />
        <button onclick="extractLinks()">ดึงลิงก์</button>
        <div id="output"></div>

        <script>
          async function extractLinks() {
            const url = document.getElementById('urlInput').value;
            const output = document.getElementById('output');
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

          function copyToClipboard(id) {
            const input = document.getElementById(id);
            input.select();
            input.setSelectionRange(0, 99999); // สำหรับมือถือ
            document.execCommand('copy');
            alert('✅ คัดลอกแล้ว: ' + input.value);
          }
        </script>
      </body>
    </html>
  `);
});


// API สำหรับดึงลิงก์จาก Puppeteer
app.get('/extract', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'กรุณาระบุ url' });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('a[attributionsrc]', { timeout: 5000 });

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
