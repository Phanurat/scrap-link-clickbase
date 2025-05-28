const puppeteer = require('puppeteer');

(async () => {
    const url = 'https://www.facebook.com/codecraft.codekrub/posts/122135542514635687';

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // รอเนื้อหาโพสต์โหลด
    const content = await page.evaluate(() => {
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
                    // กรองไม่เอาลิงก์ hashtag ของ facebook
                    if (urlObj.hostname === 'www.facebook.com' && urlObj.pathname.startsWith('/hashtag/')) {
                        continue; // ข้ามลิงก์นี้
                    }

                    const baseHref = href.split('?')[0];
                    if (!seen.has(baseHref)) {
                        seen.add(baseHref);
                        results.push({ text, href });
                    }
                } catch (e) {
                    // กรณี href ไม่ใช่ URL ที่ parse ได้ ให้ข้าม
                    continue;
                }
            }
        }

        return results;
    });



    console.log("📝 ข้อมูลที่ดึงได้:");
    console.log(content);

    await browser.close();
})();
