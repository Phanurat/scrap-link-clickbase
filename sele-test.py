from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
from urllib.parse import urlparse

# ตั้ง path ให้ตรงกับเครื่องของคุณ
driver_path = "C:/path/to/chromedriver.exe"

options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--disable-gpu")

driver = webdriver.Chrome(service=Service(driver_path), options=options)

# ลิงก์โพสต์ Facebook
url = "https://www.facebook.com/codecraft.codekrub/posts/122135761502635687"
driver.get(url)

time.sleep(5)  # รอให้หน้าโหลด

try:
    # หา <a> tag ทั้งหมดที่มี href
    a_tags = driver.find_elements(By.TAG_NAME, "a")

    found_links = []
    for a in a_tags:
        href = a.get_attribute("href")
        if href:
            parsed = urlparse(href)
            # กรองลิงก์ที่ไม่ใช่ Facebook
            if parsed.netloc and "facebook.com" not in parsed.netloc:
                found_links.append(href)

    if found_links:
        print("✅ ลิงก์ภายนอกที่พบในโพสต์:")
        for l in set(found_links):
            print("-", l)
    else:
        print("❌ ไม่พบลิงก์ภายนอกในโพสต์")

except Exception as e:
    print("⚠️ เกิดข้อผิดพลาด:", e)

driver.quit()
