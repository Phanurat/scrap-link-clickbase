const puppeteer = require('puppeteer');

(async () => {
    const url = 'https://www.facebook.com/codecraft.codekrub/posts/122135542514635687';

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // รอเนื้อหาโพสต์โหลด
    const content = await page.evaluate(() => {
        const results = [];
        const seen = new Set();

        // ดึงลิงก์จาก div[dir="auto"] (โพสต์หลัก)
        const allPosts = Array.from(document.querySelectorAll('div[dir="auto"]'));
        for (const post of allPosts) {
            const text = post.innerText?.trim();
            const linkEl = post.querySelector('a[href^="https://"]');
            const href = linkEl?.href;

            if (text && href) {
                try {
                    const urlObj = new URL(href);
                    // กรองไม่เอาลิงก์ hashtag ของ facebook
                    if (urlObj.hostname === 'www.facebook.com' && urlObj.pathname.startsWith('/hashtag/')) {
                        continue;
                    }

                    const baseHref = href.split('?')[0];
                    if (!seen.has(baseHref)) {
                        seen.add(baseHref);
                        results.push({ text, href });
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // เสริม: ดึงลิงก์จาก <a> ที่มี attribute attributionsrc (มักอยู่ใน comment หรือโพสต์ย่อย)
        const attribLinks = Array.from(document.querySelectorAll('a[attributionsrc]'));
        for (const a of attribLinks) {
            const href = a.href;
            const text = a.innerText?.trim() || '';

            if (!href) continue;

            try {
                const urlObj = new URL(href);
                if (urlObj.hostname === 'www.facebook.com' && urlObj.pathname.startsWith('/hashtag/')) {
                    continue;
                }
            } catch (e) {
                continue;
            }

            // กรองเฉพาะลิงก์ l.facebook.com/l.php (ถ้าต้องการ)
            if (!href.startsWith('https://l.facebook.com/l.php')) continue;

            const baseHref = href.split('?')[0];
            if (!seen.has(baseHref)) {
                seen.add(baseHref);
                results.push({ text, href });
            }
        }

        return results;
    });

    console.log("📝 ข้อมูลที่ดึงได้:");
    console.log(content);

    await browser.close();
})();
