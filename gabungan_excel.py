import os
import pandas as pd

# Path utama folder statistik
source_root = r"D:\KULIAAAAAH UNER\pkl\test\statistik"
allowed_ext = ['.xlsx', '.xls']

data = []

for root, dirs, files in os.walk(source_root):
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in allowed_ext:
            rel_folder = os.path.relpath(root, source_root)
            # Jika file di root, rel_folder bisa ".", ganti jadi "" saja
            data.append({
                "Nama File": file,
                "Subfolder": "" if rel_folder in [".", ""] else rel_folder
            })

# Simpan ke Excel
df = pd.DataFrame(data)
output_file = "Daftar_Nama_File_Excel.xlsx"
df.to_excel(output_file, index=False)
print(f"Berhasil disimpan ke {output_file} ({len(df)} file ditemukan)")
