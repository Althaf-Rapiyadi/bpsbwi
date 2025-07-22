import os
import shutil
import pymysql
import pandas as pd
from datetime import datetime
from config import Config

# Lokasi file dan folder
excel_file = "Bahan_Informasi_Profil.xlsx"
pdf_source_folder = r"D:\KULIAAAAAH UNER\pkl\test\file_download"
img_source_folder = r"D:\KULIAAAAAH UNER\pkl\test\cover_gambar"
upload_folder = Config.UPLOAD_FOLDER

os.makedirs(upload_folder, exist_ok=True)
df = pd.read_excel(excel_file)

db = pymysql.connect(
    host=Config.MYSQL_HOST,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    db=Config.MYSQL_DB,
    charset=Config.MYSQL_CHARSET,
    autocommit=False
)

try:
    for idx, row in df.iterrows():
        judul = str(row['Judul']).strip()
        tahun = "2024"
        deskripsi = str(row['Deskripsi']).strip()
        nama_file_pdf = str(row['Nama File Publikasi']).strip()
        nama_file_img = str(row['Nama File']).strip() if pd.notna(row['Nama File']) else None

        kategori = ''  # Jika ingin mengisi kategori, sesuaikan di sini
        now = datetime.now()

        # --- Salin file PDF ke folder upload ---
        pdf_src = os.path.join(pdf_source_folder, nama_file_pdf)
        pdf_dst = os.path.join(upload_folder, nama_file_pdf)
        if not os.path.exists(pdf_src):
            print(f"[SKIP] File PDF tidak ditemukan: {pdf_src}")
            continue  # Tidak ada PDF, skip data ini
        if not os.path.exists(pdf_dst):
            shutil.copy(pdf_src, pdf_dst)

        # --- Salin file gambar (cover) ke folder upload jika ada ---
        nama_cover = None
        if nama_file_img:
            img_src = os.path.join(img_source_folder, nama_file_img)
            img_dst = os.path.join(upload_folder, nama_file_img)
            if os.path.exists(img_src):
                if not os.path.exists(img_dst):
                    shutil.copy(img_src, img_dst)
                nama_cover = nama_file_img  # Nama file, bukan path
            else:
                print(f"[WARNING] Cover tidak ditemukan: {img_src}")

        # --- Insert ke database ---
        with db.cursor() as cur:
            cur.execute("""
                INSERT INTO publikasi (judul, tahun, deskripsi, nama_file, nama_cover, kategori, diupload_pada)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (judul, tahun, deskripsi, nama_file_pdf, nama_cover, kategori, now))
        print(f"[SUKSES] Insert: {nama_file_pdf} | Cover: {nama_cover}")

    db.commit()
    print("Semua data sukses diupload!")
except Exception as e:
    db.rollback()
    print("Gagal:", e)
finally:
    db.close()
