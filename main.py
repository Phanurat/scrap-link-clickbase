from facebook_scraper import get_posts
import re

def extract_links(text):
    url_pattern = r'(https?://[^\s]+|www\.[^\s]+)'
    return re.findall(url_pattern, text)

for post in get_posts(post_urls=[
    'https://www.facebook.com/codecraft.codekrub/posts/122135761502635687'
]):
    print("Raw post data:", post)  # ดูว่า key อะไรมีบ้าง

    if 'text' in post:
        print("โพสต์ข้อความ:", post['text'])
        links = extract_links(post['text'])
        print("ลิงก์ที่เจอในโพสต์:", links)
    else:
        print("❌ ไม่พบเนื้อหาโพสต์ (post['text'])")
