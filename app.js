const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://www.facebook.com/thairath/posts/1182920653874276';

  const browser = await puppeteer.launch({ headless: false }); // ตั้งเป็น false เพื่อดูผล
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // รอให้ <a attributionsrc=...> โหลด
  await page.waitForSelector('a[attributionsrc]');

  // ดึง href และ attributionsrc โดยกรองไม่ให้ซ้ำกัน (ตัด query string) 
  // และกรองเฉพาะลิงก์ที่ขึ้นต้นด้วย https://l.facebook.com/l.php เท่านั้น
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[attributionsrc]'));
    const seen = new Set();
    const uniqueLinks = [];

    for (const a of anchors) {
      const href = a.href;

      // เช็คให้เป็นลิงก์ที่ต้องการก่อน
      if (!href.startsWith('https://l.facebook.com/l.php')) continue;

      // ตัด query string ออกเพื่อกรองซ้ำ
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

  if (links.length > 0) {
    console.log("✅ พบลิงก์ที่มี attributionsrc และเป็นลิงก์ l.php (ไม่ซ้ำ):");
    links.forEach(link => {
      console.log('🔗 href:', link.href);
      // console.log('📌 attributionsrc:', link.attributionsrc);
      console.log('---');
    });
  } else {
    console.log("❌ ไม่พบลิงก์ที่มี attributionsrc ที่เป็น l.php");
  }

  await browser.close();
})();
