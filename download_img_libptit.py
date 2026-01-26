import os
import requests
from PIL import Image
from tqdm import tqdm
import urllib3

# Tắt cảnh báo SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
##

BASE_URL = "http://dlib.ptit.edu.vn/flowpaper/services/view.php?doc="
DOC_ID = ""
SUBFOLDER = ""

# Thư mục lưu ảnh tạm thời
img_dir = "downloaded_images"
os.makedirs(img_dir, exist_ok=True)

TOTAL_PAGE = 0
image_list = []

# Tải từng ảnh về
for page in tqdm(range(1, TOTAL_PAGE + 1), desc="📥 Đang tải ảnh"):
    url = f"{BASE_URL}{DOC_ID}&format=jpg&page={page}&subfolder={SUBFOLDER}"
    img_path = os.path.join(img_dir, f"page_{page}.jpg")

    try:
        # Thêm verify=False và timeout
        response = requests.get(url, stream=True, verify=False, timeout=30)
        if response.status_code == 200:
            with open(img_path, "wb") as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            image_list.append(img_path)
        else:
            print(f"Không tải được ảnh trang {page} - Status: {response.status_code}")
    except Exception as e:
        print(f"Lỗi tải trang {page}: {e}")

# Chuyển ảnh thành PDF
pdf_path = "output.pdf"
if image_list:
    images = [Image.open(img).convert("RGB") for img in image_list]
    images[0].save(pdf_path, save_all=True, append_images=images[1:])
    print(f"PDF đã được tạo thành công: {pdf_path}")
else:
    print("⚠ Không có ảnh nào được tải về để tạo PDF.")


# Xóa ảnh sau khi tạo PDF
for img in image_list:
    os.remove(img)

print("Đã xóa ảnh sau khi tạo PDF.")


