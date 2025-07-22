import openpyxl
from PIL import Image
from io import BytesIO
import os

excel_path = "Bahan_Informasi_Profil.xlsx"
output_folder = "cover_gambar"

os.makedirs(output_folder, exist_ok=True)

wb = openpyxl.load_workbook(excel_path)
ws = wb.active

# Ambil nama file dari kolom 'Nama File'
nama_file_list = []
for row in ws.iter_rows(min_row=2, max_col=1):  # Anggap 'Nama File' ada di kolom A
    cell_value = row[0].value
    if cell_value:
        nama_file_list.append(cell_value.strip())
    else:
        nama_file_list.append(f"no_name_{len(nama_file_list)+1}")

# Ekstrak gambar, beri nama sesuai kolom 'Nama File'
for idx, image in enumerate(ws._images):
    img_bytes = image._data()
    img = Image.open(BytesIO(img_bytes))
    # Pastikan tidak index out of range
    if idx < len(nama_file_list):
        filename = f"{nama_file_list[idx]}"
        # Ubah ekstensi ke .png jika belum png
        if not filename.lower().endswith(".png"):
            filename = os.path.splitext(filename)[0] + ".png"
    else:
        filename = f"cover_{idx+1}.png"
    img.save(os.path.join(output_folder, filename))
    print(f"Sukses simpan: {filename}")
