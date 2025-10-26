# -*- coding: utf-8 -*-
"""
Batch: PDF -> PNG (named by Excel col3 rows 2-26) + Single merged PDF output
Owner: Huu Tu
"""

import re
from pathlib import Path
from datetime import datetime

import pandas as pd
from pdf2image import convert_from_path
from PIL import Image

# ========= Config =========
OBJECT_FILENAME = "ThuMoi"
PDF_PATH        = Path(r"C:/Users/nobit/Desktop/Thu Moi/3_Danh sach thu moi.pdf")
EXCEL_PATH      = Path(r"C:/Users/nobit/Desktop/Thu Moi/4_Ds khach moi.xlsx")  
FIRST_PAGE      = 1
LAST_PAGE       = 25                    # map 1-24 tương ứng hàng 2-25
EXCEL_COL_IDX   = 2                     # cột 3 (0-based index = 2)
EXCEL_START     = 2                     # hàng 2 (1-based)
EXCEL_END       = 26                    # hàng 25 (1-based)
DPI             = 300                   # chất lượng ảnh
OUTPUT_IMG      = Path("./images")
OUTPUT_PDFDIR   = Path("./pdf")
MERGED_PDF      = OUTPUT_PDFDIR / f"{OBJECT_FILENAME}_merged_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
# ==========================

def sanitize_filename(name: str) -> str:
    """Chuẩn hóa tên file: loại ký tự cấm, normalize khoảng trắng, limit độ dài."""
    name = name.strip()
    name = re.sub(r'[\\/:*?"<>|\r\n\t]+', ' ', name)
    name = re.sub(r'\s{2,}', ' ', name).strip()
    name = name.replace(' ', '_')

    return name[:120] if name else "untitled"

def main():
    OUTPUT_IMG.mkdir(parents=True, exist_ok=True)
    OUTPUT_PDFDIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_excel(EXCEL_PATH, header=None)

    raw_names = df.iloc[EXCEL_START-1:EXCEL_END, EXCEL_COL_IDX].astype(str).tolist()
    names = [sanitize_filename(x) or f"page_{i+FIRST_PAGE}" for i, x in enumerate(raw_names)]

    images = convert_from_path(
        str(PDF_PATH),
        first_page=FIRST_PAGE,
        last_page=LAST_PAGE,
        dpi=DPI
    )

    n = min(len(images), len(names))
    images = images[:n]
    names  = names[:n]

    for idx, (img, fname) in enumerate(zip(images, names), start=FIRST_PAGE):
        out_file = OUTPUT_IMG / f"{idx}_{fname}.png"
        img.save(out_file, "PNG")
        print(f"[OK] Saved PNG p{idx}: {idx}_{out_file}")

    rgb_pages = [im.convert("RGB") for im in images]
    
    # if not rgb_pages:
    #     raise RuntimeError("Không có trang nào để gộp PDF.")
    # first, rest = rgb_pages[0], rgb_pages[1:]
    # first.save(MERGED_PDF, save_all=True, append_images=rest)
    # print(f"[OK] Merged single PDF: {MERGED_PDF}")

    # Optional:
    for idx, (im, fname) in enumerate(zip(rgb_pages, names), start=FIRST_PAGE):
        single_pdf = OUTPUT_PDFDIR / f"{idx}_{fname}.pdf"
        im.save(single_pdf, "PDF", resolution=DPI)
        print(f"[OK] Saved single-page PDF p{idx}: {single_pdf}")
    

if __name__ == "__main__":
    main()
