const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 9000;

function process(){
    const input_user = "https://www.facebook.com/codecraft.codekrub/posts/122135761502635687";
    const link_in_post = "https://www.thairath.co.th/entertain/news/2860927";
    return link_in_post
}

function test() {
    const pull_link_post_facebook = process();
    return pull_link_post_facebook ;
}

app.get('/extract-full', async (req, res) => {
    //   const url = req.query.url;
    const url = test();
    if (!url) return res.status(400).json({ error: 'กรุณาระบุ url' });

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('p, div', { timeout: 10000 });

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
