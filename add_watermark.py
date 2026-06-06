import os
import glob
from PIL import Image, ImageOps
from concurrent.futures import ProcessPoolExecutor
import time
import multiprocessing

from pillow_heif import register_heif_opener
register_heif_opener()

SCALE_PERCENT_VER = 0.18 
SCALE_PERCENT_HOR = 0.10
SPACE_PERCENT = 0.02

def process_single_image(args):
    img_path, logo_path, output_folder, logo_ratio = args
    try:
        img = Image.open(img_path)
        
        # Thêm dòng này để xoay ảnh lại cho đúng theo dữ liệu EXIF
        img = ImageOps.exif_transpose(img) 
        
        logo = Image.open(logo_path).convert("RGBA")
        
        W_img, H_img = img.size    
        
        if H_img > W_img:
            scale_percent = SCALE_PERCENT_VER
        elif H_img < W_img:
            scale_percent = SCALE_PERCENT_HOR
        else:  # H_img == W_img
            scale_percent = 0.15

        W_new = int(W_img * scale_percent)
        H_new = int(W_new * logo_ratio)
        
        logo_resized = logo.resize((W_new, H_new), Image.Resampling.LANCZOS)
        
        pos_x = int((W_img - W_new) / 2)
        pos_y = int(H_img * SPACE_PERCENT)
        
        # Đảm bảo ảnh gốc là hệ màu RGB trước khi lưu JPEG để tránh lỗi
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        img.paste(logo_resized, (pos_x, pos_y), logo_resized)
        
        filename = os.path.basename(img_path)
        
        # Đổi đuôi HEIC thành JPG khi lưu (nếu có) để tránh lỗi format
        if filename.upper().endswith('.HEIC'):
            filename = filename[:-5] + '.jpg'
            
        output_path = os.path.join(output_folder, filename)
        
        img.save(output_path, quality=95)

        return True, filename
    except Exception as e:
        return False, f"Lỗi ảnh {os.path.basename(img_path)}: {str(e)}"

def batch_process_images(input_folder, output_folder, logo_path):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    image_paths = glob.glob(os.path.join(input_folder, "*.jpg")) + glob.glob(os.path.join(input_folder, "*.png")) + glob.glob(os.path.join(input_folder, "*.jpeg"))  + glob.glob(os.path.join(input_folder, "*.HEIC"))

    total_images = len(image_paths)
    
    if total_images == 0:
        print("Không tìm thấy ảnh nào trong thư mục!")
        return

    print(f"{total_images} ảnh cần xử lý.")
    
    with Image.open(logo_path) as temp_logo:
        W_logo, H_logo = temp_logo.size
        logo_ratio = H_logo / W_logo
    
    tasks = [(path, logo_path, output_folder, logo_ratio) for path in image_paths]
    
    cores = multiprocessing.cpu_count()
    chunk_size = max(1, total_images // (cores * 4))
    
    start_time = time.time()
    
    success_count = 0
    with ProcessPoolExecutor() as executor:
        results = executor.map(process_single_image, tasks, chunksize=chunk_size)
        
        for success, message in results:
            if success:
                success_count += 1
                if success_count % 50 == 0 or success_count == total_images:
                    print(f"{success_count}/{total_images} ảnh đã hoàn thành...")
            else:
                print(message)
                
    end_time = time.time()
    print(f"\nHoàn thành xử lý!")
    print(f"Tổng số ảnh xử lý thành công: {success_count}/{total_images}")
    print(f"Tổng thời gian chạy: {end_time - start_time:.2f} giây")

    if total_images > 0:
        print(f"Tốc độ trung bình: {(end_time - start_time) / total_images:.2f} giây/ảnh")

if __name__ == "__main__":
    batch_process_images(
        input_folder= r"<INPUT_FOLDER>", 
        output_folder= r"<OUTPUT_FOLDER>", 
        logo_path= r"<LOGO_PATH>")