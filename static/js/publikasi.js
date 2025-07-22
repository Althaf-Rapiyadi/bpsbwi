document.addEventListener('DOMContentLoaded', function () {
  let publications = [];
  let editId = null;

  async function fetchPublications() {
    try {
      const res = await fetch('/api/publikasi/list');
      const data = await res.json();
      if (Array.isArray(data)) {
        publications = data;
        renderList();
      } else {
        console.error('Format data tidak valid:', data);
      }
    } catch (err) {
      console.error('Gagal memuat data:', err);
    }
  }

  function renderList() {
    let filter = document.getElementById('keyword').value.trim().toLowerCase();
    let year = document.getElementById('year').value;
    let sort = document.getElementById('sort').value;
    let titleOnly = document.getElementById('titleOnly').checked;

    let filtered = publications.filter(pub => {
      if (year && String(pub.year) !== year) return false;
      if (filter) {
        if (titleOnly) {
          if (!(pub.title || "").toLowerCase().includes(filter)) return false;
        } else {
          let txt = (pub.title || "") + " " + (pub.desc || "");
          if (!txt.toLowerCase().includes(filter)) return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'terbaru') return (b.date || '').localeCompare(a.date || '');
      if (sort === 'terlama') return (a.date || '').localeCompare(b.date || '');
      if (sort === 'judul-asc') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'judul-desc') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

    // Bagian countInfo DIHAPUS

    let html = '';
    if (filtered.length === 0) {
      html = `<div class="text-center text-gray-500 py-8">Tidak ada publikasi ditemukan</div>`;
    } else {
      html = filtered.map(pub => `
        <article class="bg-white rounded-lg p-5 shadow-sm flex gap-5">
          <div class="flex-shrink-0 w-[140px] h-[140px] rounded-md overflow-hidden shadow">
            <img src="${pub.imgUrl || 'https://placehold.co/140x140?text=No+Image'}"
              alt="${pub.title}" class="w-full h-full object-cover"
              onerror="this.onerror=null;this.src='https://placehold.co/140x140?text=Image+Not+Available';" />
          </div>
          <div class="flex flex-col w-full">
            <time datetime="${pub.date}" class="text-gray-500 text-sm flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
              </svg>
              ${formatDate(pub.date)}
            </time>
            <h2>
              <span class="text-blue-700 font-semibold text-lg hover:underline">${pub.title}</span>
            </h2>
            <div class="flex flex-wrap gap-2 mt-2 items-center">
              <span class="inline-block text-xs bg-gray-200 rounded px-2 py-1 text-gray-700">Tahun: ${pub.year || '-'}</span>
            </div>
            <p class="text-gray-700 mt-1 text-sm leading-relaxed max-h-[120px] overflow-hidden">${pub.desc || ''}</p>
            <div class="flex gap-2 mt-4 flex-wrap">
              ${pub.docUrl ? `
                <a href="${pub.docUrl}" target="_blank" class="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700" download="${pub.docName || ''}">Unduh Dokumen</a>
                <a href="${pub.docUrl}" target="_blank" class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-700">Lihat Dokumen</a>
              ` : `<span class="px-3 py-1 bg-gray-300 text-gray-600 rounded text-xs">Belum ada dokumen</span>`}
              <button class="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 editBtn" data-id="${pub.id}">Edit</button>
              <button class="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 deleteBtn" data-id="${pub.id}">Hapus</button>
            </div>
          </div>
        </article>
      `).join('');
    }

    document.getElementById('pubList').innerHTML = html;
    // Attach event for edit and delete
    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.onclick = () => openEdit(btn.getAttribute('data-id'));
    });
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.onclick = () => deletePub(btn.getAttribute('data-id'));
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Modal toggle
  document.getElementById('addBtn').onclick = function () { openModal(); };
  window.openModal = function () {
    editId = null;
    document.getElementById('modalPub').classList.remove('hidden');
    document.getElementById('pubForm').reset();
    document.getElementById('previewImg').classList.add('hidden');
    document.getElementById('previewImg').src = "";
    document.getElementById('docName').textContent = "";
    document.getElementById('errorMsg').textContent = "";
    document.getElementById('modalTitle').textContent = 'Tambah Publikasi';
  };
  window.closeModal = function () {
    document.getElementById('modalPub').classList.add('hidden');
  };
  document.getElementById('modalPub').onclick = function (e) {
    if (e.target === this) closeModal();
  };

  document.getElementById('pubImg').onchange = function () {
    let file = this.files[0];
    let preview = document.getElementById('previewImg');
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.classList.remove('hidden');
    } else {
      preview.src = "";
      preview.classList.add('hidden');
    }
  };

  document.getElementById('pubDoc').onchange = function () {
    let file = this.files[0];
    let label = document.getElementById('docName');
    if (file) {
      label.textContent = file.name;
      label.title = file.name;
    } else {
      label.textContent = "";
      label.title = "";
    }
  };

  // ==== Tambah/Update publikasi ====
  document.getElementById('pubForm').onsubmit = async function (e) {
    e.preventDefault();
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = "";

    const judul = document.getElementById('pubTitle').value;
    const tanggalISO = document.getElementById('pubDate').value;
    const tahun = document.getElementById('pubYear').value;
    const deskripsi = document.getElementById('pubDesc').value || '';
    const fileCover = document.getElementById('pubImg').files[0];
    const fileDokumen = document.getElementById('pubDoc').files[0];

    if (!judul || !tanggalISO || !tahun) {
      errorMsg.textContent = "Lengkapi semua data wajib.";
      return;
    }
    if (!/^\d{4}$/.test(tahun)) {
      errorMsg.textContent = "Tahun harus 4 digit angka.";
      return;
    }
    const [yyyy, mm, dd] = tanggalISO.split("-");
    const tanggal = `${dd}/${mm}/${yyyy}`;

    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('tanggal', tanggal);
    formData.append('tahun', tahun);
    formData.append('deskripsi', deskripsi);
    if (fileCover) formData.append('file_cover', fileCover);
    if (fileDokumen) formData.append('file_dokumen', fileDokumen);

    try {
      let url = '/api/publikasi/upload';
      if (editId) url = `/api/publikasi/update/${editId}`;
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message || "Publikasi berhasil disimpan.");
        closeModal();
        fetchPublications();
      } else {
        errorMsg.textContent = result.error || "Gagal menyimpan publikasi.";
      }
    } catch (err) {
      errorMsg.textContent = "Gagal menghubungi server.";
    }
  };

  // ==== Edit (prefill modal) ====
  async function openEdit(id) {
    let pub = publications.find(p => p.id == id);
    if (!pub) return;
    editId = id;
    document.getElementById('modalPub').classList.remove('hidden');
    document.getElementById('modalTitle').textContent = 'Edit Publikasi';
    document.getElementById('pubTitle').value = pub.title || '';
    if (pub.date) {
      let d = new Date(pub.date);
      let yyyy = d.getFullYear();
      let mm = String(d.getMonth() + 1).padStart(2, '0');
      let dd = String(d.getDate()).padStart(2, '0');
      document.getElementById('pubDate').value = `${yyyy}-${mm}-${dd}`;
    }
    document.getElementById('pubYear').value = pub.year || '';
    document.getElementById('pubDesc').value = pub.desc || '';
    document.getElementById('previewImg').src = pub.imgUrl || '';
    if (pub.imgUrl) document.getElementById('previewImg').classList.remove('hidden');
    else document.getElementById('previewImg').classList.add('hidden');
    document.getElementById('docName').textContent = pub.docName || "";
    document.getElementById('errorMsg').textContent = "";
  }

  // ==== Hapus ====
  async function deletePub(id) {
    if (!confirm('Yakin ingin menghapus publikasi ini?')) return;
    try {
      const res = await fetch(`/api/publikasi/delete/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        alert(result.message || "Berhasil dihapus");
        fetchPublications();
      } else {
        alert(result.error || "Gagal menghapus");
      }
    } catch (err) {
      alert("Gagal menghubungi server.");
    }
  }

  document.getElementById('filterForm').onsubmit = function (e) {
    e.preventDefault();
    renderList();
  };
  ['keyword', 'year', 'sort', 'titleOnly'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderList);
    document.getElementById(id).addEventListener('change', renderList);
  });

  fetchPublications();
});
