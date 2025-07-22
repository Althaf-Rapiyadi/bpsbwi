let tablePreviewState = {};
let deskripsiEditMode = {};

document.addEventListener('DOMContentLoaded', function() {
    // ====== DAFTAR SUB MENU/KATEGORI ======
    const submenus = [
        "Keterangan Umum Wilayah",
        "Kependudukan dan Ketenagakerjaan",
        "Perumahan dan Lingkungan Hidup",
        "Bencana Alam dan Mitigasi Bencana Alam",
        "Pendidikan",
        "Kesehatan",
        "Sosial Budaya",
        "Olahraga dan Hiburan",
        "Angkutan, Komunikasi, dan Informasi",
        "Perekonomian dan Aset Wilayah",
        "Keamanan",
        "Aparatur Pemerintahan",
        "Perlindungan Sosial, Pembangunan, dan Pemberdayaan Masyarakat"
    ];
    let currentSubmenu = submenus[0];
    let fileListCache = [];

    // --- SUB MENU LIST (selalu biru di tombol aktif) ---
    function renderMenuList() {
        let html = "";
        submenus.forEach(sm => {
            html += `<li>
                <button onclick="changeSubmenu('${sm.replace(/'/g,"\\'")}')" 
                    class="block w-full text-left px-2 py-2 rounded font-medium
                    ${currentSubmenu===sm?'bg-blue-500 text-white':'text-gray-800 hover:bg-blue-50'}">
                    ${sm}
                </button>
            </li>`;
        });
        document.getElementById('menuList').innerHTML = html;
    }

    window.changeSubmenu = function(submenu) {
        currentSubmenu = submenu;
        document.getElementById('searchStatistik').value = '';
        renderMenuList();
        renderUploadForm();
        loadFileList();
        document.getElementById('tablePreview').innerHTML = "";
    };

    function renderUploadForm() {
        document.getElementById('uploadFormBox').innerHTML = `
        <form id="uploadStatistikForm" class="flex flex-col md:flex-row gap-2 mb-4" enctype="multipart/form-data">
            <input type="hidden" name="kategori" value="${currentSubmenu}">
            <input type="file" name="file" accept=".csv,.xlsx,.xls" class="border px-2 py-1 rounded bg-white" required>
            <button type="submit" class="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">Upload File</button>
        </form>
        <div id="uploadMsg" class="text-sm text-gray-600"></div>
        `;
        document.getElementById('uploadStatistikForm').onsubmit = uploadFileStatistik;
    }

    async function uploadFileStatistik(e) {
        e.preventDefault();
        let form = e.target;
        let fd = new FormData(form);
        document.getElementById('uploadMsg').textContent = "Uploading...";
        try {
            let resp = await fetch('/api/statistik/upload', {method:'POST', body:fd});
            let data = await resp.json();
            if (resp.ok) {
                document.getElementById('uploadMsg').textContent = "Berhasil upload!";
                form.reset();
                loadFileList();
            } else {
                document.getElementById('uploadMsg').textContent = data.error || "Gagal upload";
            }
        } catch (err) {
            document.getElementById('uploadMsg').textContent = "Error: " + err;
        }
    }

    async function loadFileList() {
        let kategori = currentSubmenu;
        let search = (document.getElementById('searchStatistik').value || "").toLowerCase();
        let fileList = [];
        try {
            let resp = await fetch('/api/statistik/list?kategori='+encodeURIComponent(kategori));
            fileList = await resp.json();
            fileListCache = fileList; // Simpan cache
        } catch(e) {}
        let filtered = fileList.filter(f => !search || (f.nama||"").toLowerCase().includes(search));
        let html = `
        <div class="overflow-x-auto">
            <table class="w-full border rounded bg-white text-sm shadow">
                <thead>
                    <tr class="bg-blue-100 text-blue-700">
                        <th class="py-2 px-3 text-left">Nama File</th>
                        <th class="py-2 px-3 text-left">Terakhir Diperbarui</th>
                        <th class="py-2 px-3 text-left">Aksi</th>
                    </tr>
                </thead>
                <tbody>`;
        if (filtered.length === 0) {
            html += `<tr><td colspan="3" class="py-6 text-center text-gray-500">Belum ada file</td></tr>`;
        } else {
            filtered.forEach((f, i) => {
                let ext = (f.nama||'').split('.').pop().toLowerCase();
                html += `<tr class="border-t">
                    <td class="py-2 px-3 flex items-center gap-2">
                        ${f.nama}
                        <a href="${f.url}" download="${f.nama}" title="Download" class="text-blue-500 hover:text-blue-800 ml-2"><i class="fas fa-download"></i></a>
                        <button onclick="previewTable('${encodeURIComponent(f.url)}', '${encodeURIComponent(f.nama)}', '${ext}', ${f.id});return false;" class="text-blue-500 hover:text-blue-700 ml-1" title="Lihat Tabel"><i class="fas fa-eye"></i></button>
                    </td>
                    <td class="py-2 px-3">${f.updated}</td>
                    <td class="py-2 px-3 text-right">
                        <button onclick="hapusFileStatistik(${f.id});" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            });
        }
        html += `</tbody></table></div>`;
        document.getElementById('fileList').innerHTML = html;
        document.getElementById('tablePreview').innerHTML = '';
    }

    window.hapusFileStatistik = async function(fileId) {
        if (!confirm("Yakin ingin menghapus file ini?")) return;
        let resp = await fetch('/api/statistik/delete/'+fileId, {method:'DELETE'});
        let data = await resp.json();
        if (resp.ok) loadFileList();
        else alert(data.error || 'Gagal hapus file');
    };

    // ==== PREVIEW TABEL CSV/XLSX/XLS ====
    window.previewTable = async function(url, nama, ext, id) {
        url = decodeURIComponent(url);
        nama = decodeURIComponent(nama);
        document.getElementById('tablePreview').innerHTML = "<div class='text-gray-500 text-sm mb-2'>Memuat tabel...</div>";
        let deskripsi = "";
        let nama_tabel_db = "";
        let file = fileListCache.find(x => x.id == id);
        if(file) {
            deskripsi = file.deskripsi_tabel || "";
            nama_tabel_db = file.nama_tabel || "";
        }
        try {
            let arr = [];
            let html = "";
            if (ext === 'csv') {
                let res = await fetch(url);
                let txt = await res.text();
                arr = Papa.parse(txt, {header:false}).data;
                html += arrayToTable(arr, id);
            } else if (['xlsx','xls'].includes(ext)) {
                let res = await fetch(url);
                let buf = await res.arrayBuffer();
                let workbook = XLSX.read(buf, {type:'array'});
                workbook.SheetNames.forEach(sheetName => {
                    let ws = workbook.Sheets[sheetName];
                    let rows = XLSX.utils.sheet_to_json(ws, {header:1});
                    html += `<div class="font-bold mb-2">Sheet: ${sheetName}</div>`;
                    html += arrayToTable(rows, id + '_' + sheetName);
                });
            } else {
                html = "<div class='text-red-500'>Preview hanya untuk file .csv/.xlsx/.xls</div>";
            }

            // Tambahan area deskripsi edit/view
// Tambahan area deskripsi edit/view
        html += `
        <div class="mt-6 flex flex-col gap-2 items-start bg-blue-50 rounded p-4">
            <div class="font-semibold">Nama Tabel:</div>
            <div id="namaTabelBox">
                ${
                    deskripsiEditMode[id]
                    ? `<input type="text" id="namaTabelInput" class="border px-2 py-1 rounded w-full max-w-md mb-2" value="${nama_tabel_db || nama}">`
                    : `<div class="mb-2">${nama_tabel_db || nama}</div>`
                }
            </div>

            <div class="font-semibold">Deskripsi Tabel:</div>
            <div id="descTableBox">
                ${
                    deskripsiEditMode[id]
                    ? `<textarea id="descInput" rows="2" class="border px-2 py-1 rounded w-full max-w-md mb-2" placeholder="Isi deskripsi...">${deskripsi}</textarea>
                        <button onclick="window.saveDeskripsi(${id})" class="bg-blue-600 text-white rounded px-4 py-1 text-sm">Simpan Nama/Deskripsi</button>
                        <button onclick="window.cancelEditDesc(${id})" class="ml-2 bg-gray-300 rounded px-4 py-1 text-sm">Batal</button>
                        <span id="descSaveMsg" class="text-xs text-green-600"></span>`
                    : `<div class="mb-2">${deskripsi ? deskripsi.replace(/\n/g,'<br>') : '<span class="italic text-gray-400">(Belum ada deskripsi)</span>'}</div>
                        <button onclick="window.editDeskripsi(${id})" class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded px-3 py-1 text-xs">Edit</button>
                        <span id="descSaveMsg" class="text-xs text-green-600"></span>`
                }
            </div>
        </div>`;


            document.getElementById('tablePreview').innerHTML = html;
            // Setelah render preview selesai
            document.getElementById('tablePreview').scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            document.getElementById('tablePreview').innerHTML = "<div class='text-red-500'>Gagal preview: "+err+"</div>";
        }
    };


    window.editDeskripsi = function(id) {
        deskripsiEditMode[id] = true;
        // Panggil previewTable ulang supaya masuk mode edit
        let file = fileListCache.find(x => x.id == id);
        if(file) {
            let ext = (file.nama||'').split('.').pop().toLowerCase();
            previewTable(encodeURIComponent(file.url), encodeURIComponent(file.nama), ext, file.id);
        }
    };

    window.cancelEditDesc = function(id) {
        deskripsiEditMode[id] = false;
        // Panggil previewTable ulang supaya kembali ke view mode
        let file = fileListCache.find(x => x.id == id);
        if(file) {
            let ext = (file.nama||'').split('.').pop().toLowerCase();
            previewTable(encodeURIComponent(file.url), encodeURIComponent(file.nama), ext, file.id);
        }
    };

    window.saveDeskripsi = async function(id) {
        let desc = document.getElementById('descInput').value;
        let namaTabel = document.getElementById('namaTabelInput').value;
        try {
            let resp = await fetch(`/api/statistik/desc/${id}`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({nama_tabel: namaTabel, deskripsi_tabel: desc})
            });
            let data = await resp.json();
            if (resp.ok) {
                document.getElementById('descSaveMsg').textContent = "Disimpan!";
                deskripsiEditMode[id] = false;
                // Update cache lalu refresh preview
                let file = fileListCache.find(x => x.id == id);
                if(file) {
                    file.nama_tabel = namaTabel;
                    file.deskripsi_tabel = desc;
                    let ext = (file.nama||'').split('.').pop().toLowerCase();
                    setTimeout(() => {
                        previewTable(encodeURIComponent(file.url), encodeURIComponent(file.nama), ext, file.id);
                    }, 500);
                }
            } else {
                document.getElementById('descSaveMsg').textContent = data.error || "Gagal simpan.";
            }
        } catch (e) {
            document.getElementById('descSaveMsg').textContent = "Error: "+e;
        }
    };


    function arrayToTable(arr, pageId, pageSize=50) {
        if (!arr || arr.length === 0) return "<div class='text-gray-500'>File kosong.</div>";
        if (!tablePreviewState[pageId]) tablePreviewState[pageId] = 1;
        let currentPage = tablePreviewState[pageId];
        let totalRows = arr.length;
        let totalPages = Math.ceil(totalRows / pageSize);
        let start = (currentPage-1)*pageSize;
        let end = Math.min(start + pageSize, totalRows);

        let html = `<div class='overflow-x-auto'><table class="w-full text-xs border bg-white my-2"><tbody>`;
        arr.slice(start, end).forEach(row => {
            html += "<tr>";
            row.forEach(cell => html += `<td class="border px-2 py-1">${cell||""}</td>`);
            html += "</tr>";
        });
        html += "</tbody></table></div>";

        if(totalPages > 1) {
            html += `<div class="flex items-center justify-center gap-2 my-2">`;
            html += `<button onclick="gotoTablePage('${pageId}',${currentPage-1})" ${currentPage===1?'disabled':''} class="px-2 py-1 rounded border text-xs bg-gray-50 ${currentPage===1?'opacity-50':''}">Prev</button>`;
            html += `<span class="text-xs">Halaman ${currentPage} dari ${totalPages}</span>`;
            html += `<button onclick="gotoTablePage('${pageId}',${currentPage+1})" ${currentPage===totalPages?'disabled':''} class="px-2 py-1 rounded border text-xs bg-gray-50 ${currentPage===totalPages?'opacity-50':''}">Next</button>`;
            html += `</div>`;
        }
        return html;
    }

    window.gotoTablePage = function(pageId, pageNum) {
        if (pageNum < 1) pageNum = 1;
        tablePreviewState[pageId] = pageNum;
        let [id, sheet] = pageId.split("_");
        let file = fileListCache.find(f => String(f.id) === String(id));
        if (!file) return;
        let ext = (file.nama||'').split('.').pop().toLowerCase();
        previewTable(encodeURIComponent(file.url), encodeURIComponent(file.nama), ext, file.id);
    };

    document.getElementById('searchStatistik').addEventListener('input', loadFileList);

    renderMenuList();
    renderUploadForm();
    loadFileList();
});
