import os
import uuid
import shutil
import pymysql
import pandas as pd
from datetime import datetime
from config import Config

# --------- SETUP ---------
source_root = r"D:\KULIAAAAAH UNER\pkl\test\statistik"
upload_folder = Config.UPLOAD_FOLDER
allowed_ext = ['.csv', '.xlsx', '.xls']
desc_file = r"D:\KULIAAAAAH UNER\pkl\test\Deskripsi_Variasi.xlsx"

# --------- BACA DESKRIPSI: buat map (nama_file, subfolder) => deskripsi ---------
desc_map = {}
if os.path.exists(desc_file):
    df_desc = pd.read_excel(desc_file)
    for _, row in df_desc.iterrows():
        nama = str(row.get('Nama File', '')).strip()
        subfolder = str(row.get('Subfolder', '')).strip()
        deskripsi = str(row.get('Deskripsi', '')).strip()
        if nama and subfolder:
            # tanpa ekstensi + lower semua
            nama_noext = os.path.splitext(nama)[0].lower()
            key = (nama_noext, subfolder.lower())
            desc_map[key] = deskripsi

# --------- AMBIL SEMUA FILE (dari seluruh subfolder) ---------
def get_all_files():
    files = []
    for root, dirs, filenames in os.walk(source_root):
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            if ext in allowed_ext:
                full_path = os.path.join(root, filename)
                rel_folder = os.path.relpath(root, source_root)
                kategori = rel_folder.replace("\\", "/") if rel_folder not in [".", ""] else ""
                files.append((full_path, filename, kategori))
    return files

def find_deskripsi(filename, kategori):
    nama_noext = os.path.splitext(filename)[0].lower()
    subfolder = (kategori or "").lower()
    key = (nama_noext, subfolder)
    return desc_map.get(key, f"Deskripsi belum tersedia untuk file {filename} (subfolder: {kategori})")

# --------- MAIN ---------
def main():
    os.makedirs(upload_folder, exist_ok=True)
    filelist = get_all_files()
    print(f"Total file ditemukan: {len(filelist)}")

    db = pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        db=Config.MYSQL_DB,
        charset=Config.MYSQL_CHARSET,
        autocommit=False
    )

    try:
        for filepath, filename, kategori in filelist:
            print(f"\n[PROSES] {filename} (Subfolder: {kategori})")
            ext = os.path.splitext(filename)[1]
            uniq_name = f"{uuid.uuid4().hex}{ext}"
            save_path = os.path.join(upload_folder, uniq_name)
            rel_path = f'static/uploads/{uniq_name}'
            now = datetime.now()

            # Copy file ke uploads (skip jika sudah ada)
            if not os.path.exists(save_path):
                shutil.copy(filepath, save_path)

            # Nama tabel & deskripsi tabel
            nama_tabel = filename
            deskripsi_tabel = find_deskripsi(filename, kategori)

            # Insert ke database (nama_tabel & deskripsi_tabel ikut masuk)
            with db.cursor() as cur:
                cur.execute("""
                    INSERT INTO data_statistik
                    (nama_file, path_file, kategori, diupload_pada, nama_tabel, deskripsi_tabel)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (filename, rel_path, kategori, now, nama_tabel, deskripsi_tabel))
            print(f"[SUKSES] {filename} ({kategori}) diunggah ke database.")

        db.commit()
        print("\n==== SEMUA FILE SUKSES DIUPLOAD KE DATABASE! ====")
    except Exception as e:
        db.rollback()
        print("Gagal:", e)
    finally:
        db.close()

if __name__ == '__main__':
    main()
