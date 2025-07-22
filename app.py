import os
import uuid
from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for
from werkzeug.utils import secure_filename
import pymysql
from config import Config
from datetime import datetime

app = Flask(__name__)
app.config.from_object(Config)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_db():
    return pymysql.connect(
        host=app.config['MYSQL_HOST'],
        user=app.config['MYSQL_USER'],
        password=app.config['MYSQL_PASSWORD'],
        db=app.config['MYSQL_DB'],
        charset=app.config['MYSQL_CHARSET'],
        autocommit=False
    )

@app.route('/')
def home():
    return render_template('k.html')

@app.route('/statistik')
def statistik():
    return render_template('statistik.html')

@app.route('/statistik.html')
def statistik_html_redirect():
    return redirect(url_for('statistik'))

@app.route('/api/statistik/upload', methods=['POST'])
def upload_statistik():
    kategori = request.form.get('kategori')
    file = request.files.get('file')
    if not kategori or not file:
        return jsonify({'error': 'Kategori dan file wajib diisi'}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1]
    uniq_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], uniq_name)
    file.save(save_path)
    rel_path = f'static/uploads/{uniq_name}'
    now = datetime.now()

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "INSERT INTO data_statistik (nama_file, path_file, kategori, diupload_pada) VALUES (%s, %s, %s, %s)",
                (filename, rel_path, kategori, now)
            )
        db.commit()
        return jsonify({'message': 'Sukses upload', 'file_url': '/' + rel_path})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/statistik/list', methods=['GET'])
def list_statistik():
    kategori = request.args.get('kategori', '')
    db = get_db()
    result = []
    try:
        with db.cursor() as cur:
            if kategori:
                cur.execute(
                    "SELECT id, nama_file, path_file, kategori, diupload_pada, nama_tabel, deskripsi_tabel FROM data_statistik WHERE kategori=%s ORDER BY diupload_pada DESC",
                    (kategori,)
                )
            else:
                cur.execute(
                    "SELECT id, nama_file, path_file, kategori, diupload_pada, nama_tabel, deskripsi_tabel FROM data_statistik ORDER BY diupload_pada DESC"
                )
            for row in cur.fetchall():
                path_file = row[2].replace("\\", "/")
                result.append({
                    'id': row[0],
                    'nama': row[1],
                    'url': '/' + path_file,
                    'kategori': row[3],
                    'updated': row[4].strftime('%d/%m/%Y, %H.%M.%S') if row[4] else "",
                    'nama_tabel': row[5] or "",
                    'deskripsi_tabel': row[6] or ""
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/statistik/delete/<int:file_id>', methods=['DELETE'])
def delete_statistik(file_id):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT path_file FROM data_statistik WHERE id=%s", (file_id,))
            row = cur.fetchone()
            if row and row[0] and os.path.exists(row[0].replace("/", os.sep)):
                os.remove(row[0].replace("/", os.sep))
            cur.execute("DELETE FROM data_statistik WHERE id=%s", (file_id,))
        db.commit()
        return jsonify({'message': 'Data dihapus'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/statistik/desc/<int:file_id>', methods=['POST'])
def update_nama_deskripsi(file_id):
    data = request.get_json()
    nama_tabel = data.get('nama_tabel', '').strip()
    deskripsi_tabel = data.get('deskripsi_tabel', '').strip()
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "UPDATE data_statistik SET nama_tabel=%s, deskripsi_tabel=%s WHERE id=%s",
                (nama_tabel, deskripsi_tabel, file_id)
            )
        db.commit()
        return jsonify({'message': 'Berhasil simpan nama/deskripsi tabel'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ========== PUBLIKASI ================
@app.route('/publikasi')
def publikasi():
    return render_template('publikasi.html')

@app.route('/publikasi.html')
def publikasi_redirect():
    return redirect(url_for('publikasi'))

@app.route('/api/publikasi/upload', methods=['POST'])
def upload_publikasi():
    judul = request.form.get('judul')
    tanggal_str = request.form.get('tanggal')
    tahun = request.form.get('tahun')
    deskripsi = request.form.get('deskripsi')
    kategori = request.form.get('kategori') or ''
    file_cover = request.files.get('file_cover')
    file_dokumen = request.files.get('file_dokumen')

    if not all([judul, tanggal_str, tahun, file_dokumen]):
        return jsonify({'error': 'Judul, tanggal, tahun dan dokumen wajib diisi'}), 400

    try:
        tanggal_publikasi = datetime.strptime(tanggal_str, '%d/%m/%Y').date()
    except ValueError:
        return jsonify({'error': 'Format tanggal salah. Gunakan dd/mm/yyyy'}), 400

    now = datetime.now()
    nama_file = secure_filename(file_dokumen.filename)
    uniq_file = f"{uuid.uuid4().hex}_{nama_file}"
    path_file = os.path.join(app.config['UPLOAD_FOLDER'], uniq_file)
    file_dokumen.save(path_file)

    nama_cover = None
    if file_cover:
        cover_name = secure_filename(file_cover.filename)
        uniq_cover = f"{uuid.uuid4().hex}_{cover_name}"
        path_cover = os.path.join(app.config['UPLOAD_FOLDER'], uniq_cover)
        file_cover.save(path_cover)
        nama_cover = uniq_cover

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                INSERT INTO publikasi (judul, tahun, deskripsi, nama_file, nama_cover, kategori, diupload_pada)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                judul, tahun, deskripsi, uniq_file, nama_cover, kategori, now
            ))
        db.commit()
        return jsonify({'message': 'Publikasi berhasil disimpan'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/publikasi/list', methods=['GET'])
def list_publikasi():
    db = get_db()
    result = []
    try:
        with db.cursor() as cur:
            cur.execute("SELECT id, judul, tahun, deskripsi, nama_file, nama_cover, kategori, diupload_pada FROM publikasi ORDER BY diupload_pada DESC")
            for row in cur.fetchall():
                file_url = url_for('uploaded_file', filename=row[4]) if row[4] else ''
                cover_url = url_for('uploaded_file', filename=row[5]) if row[5] else ''
                result.append({
                    'id': row[0],
                    'title': row[1],
                    'year': row[2],
                    'desc': row[3] or '',
                    'docName': row[4],
                    'docUrl': file_url,
                    'imgUrl': cover_url,
                    'date': row[7].strftime('%Y-%m-%d') if row[7] else ''
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# ========== TAMBAH: UPDATE PUBLIKASI ==========
@app.route('/api/publikasi/update/<int:id>', methods=['POST'])
def update_publikasi(id):
    judul = request.form.get('judul')
    tanggal_str = request.form.get('tanggal')
    tahun = request.form.get('tahun')
    deskripsi = request.form.get('deskripsi')
    kategori = request.form.get('kategori') or ''
    file_cover = request.files.get('file_cover')
    file_dokumen = request.files.get('file_dokumen')

    if not all([judul, tanggal_str, tahun]):
        return jsonify({'error': 'Judul, tanggal, dan tahun wajib diisi'}), 400

    db = get_db()
    try:
        with db.cursor() as cur:
            # Ambil data lama
            cur.execute("SELECT nama_file, nama_cover FROM publikasi WHERE id=%s", (id,))
            old = cur.fetchone()
            old_file, old_cover = (old if old else (None, None))

            # Update dokumen jika ada file baru
            if file_dokumen:
                nama_file = secure_filename(file_dokumen.filename)
                uniq_file = f"{uuid.uuid4().hex}_{nama_file}"
                path_file = os.path.join(app.config['UPLOAD_FOLDER'], uniq_file)
                file_dokumen.save(path_file)
                if old_file:
                    try: os.remove(os.path.join(app.config['UPLOAD_FOLDER'], old_file))
                    except: pass
            else:
                uniq_file = old_file

            # Update cover jika ada file baru
            if file_cover:
                cover_name = secure_filename(file_cover.filename)
                uniq_cover = f"{uuid.uuid4().hex}_{cover_name}"
                path_cover = os.path.join(app.config['UPLOAD_FOLDER'], uniq_cover)
                file_cover.save(path_cover)
                if old_cover:
                    try: os.remove(os.path.join(app.config['UPLOAD_FOLDER'], old_cover))
                    except: pass
            else:
                uniq_cover = old_cover

            cur.execute("""
                UPDATE publikasi SET judul=%s, tahun=%s, deskripsi=%s, nama_file=%s, nama_cover=%s, kategori=%s
                WHERE id=%s
            """, (
                judul, tahun, deskripsi, uniq_file, uniq_cover, kategori, id
            ))
        db.commit()
        return jsonify({'message': 'Publikasi berhasil diupdate'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# ========== TAMBAH: HAPUS PUBLIKASI ==========
@app.route('/api/publikasi/delete/<int:id>', methods=['DELETE'])
def delete_publikasi(id):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT nama_file, nama_cover FROM publikasi WHERE id=%s", (id,))
            row = cur.fetchone()
            if row:
                if row[0]:
                    try: os.remove(os.path.join(app.config['UPLOAD_FOLDER'], row[0]))
                    except: pass
                if row[1]:
                    try: os.remove(os.path.join(app.config['UPLOAD_FOLDER'], row[1]))
                    except: pass
            cur.execute("DELETE FROM publikasi WHERE id=%s", (id,))
        db.commit()
        return jsonify({'message': 'Publikasi berhasil dihapus'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    app.run(debug=True)
