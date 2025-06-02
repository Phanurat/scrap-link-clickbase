# Facebook Link Extractor API

API สำหรับดึงข้อมูลลิงก์และข้อความจากหน้าเว็บต่าง ๆ โดยใช้ Node.js, Express และ Puppeteer

---

## ติดตั้ง

1. ติดตั้ง [Node.js](https://nodejs.org/) และ [npm](https://www.npmjs.com/)
2. ดาวน์โหลดโปรเจคนี้ และติดตั้ง dependencies

```bash
npm install
npm install puppeteer
ืnpm install express
```
```bash
node server.js
```

```bash
GET /extract?url={post_facebook}
{
  "links": [
    {
      "href": "https://l.facebook.com/l.php?u=...",
      "attributionsrc": "..."
    },
    ...
  ]
}```

```bash
GET /extract-post-links?url={post_facebook}
{
  "links": [
    {
      "text": "ข้อความในโพสต์",
      "href": "https://www.facebook.com/..."
    },
    ...
  ]
}
```

```bash
GET /extract-full?url={url_from_link_post}
{
  "results": [
    "ข้อความย่อหน้า 1",
    "ข้อความย่อหน้า 2",
    ...
  ]
}
```
```bash
curl "http://localhost:9000/extract?url=https://www.facebook.com/yourpage"
curl "http://localhost:9000/extract-post-links?url=https://www.facebook.com/yourpost"
curl "http://localhost:9000/extract-full?url=https://www.thairath.co.th/entertain/news/2860927"
```






