document.addEventListener('DOMContentLoaded', function() {
  let pubIdSeq = 3;
  let publications = [
    {
      id: 1,
      title: "Pedoman Penyusunan Data Desa 2025",
      date: "2025-04-30",
      year: "2025",
      img: "",
      imgUrl: "https://placehold.co/140x140?text=Logo+PD",
      doc: null,
      docName: "Pedoman1.pdf",
      docUrl: "https://example.com/pedoman1.pdf",
      desc: "Pedoman ini berisi tata cara penyusunan data desa...",
    },
    {
      id: 2,
      title: "Pedoman Verifikasi Data Wilayah 2024",
      date: "2024-03-20",
      year: "2024",
      img: "",
      imgUrl: "https://placehold.co/140x140/007a2f/ffffff?text=Cover+2024",
      doc: null,
      docName: "Pedoman2.pdf",
      docUrl: "https://example.com/pedoman2.pdf",
      desc: "Pedoman ini berisi prosedur verifikasi data wilayah...",
    }
  ];

  function renderList() {
    let filter = document.getElementById('keyword').value.trim().toLowerCase();
    let year = document.getElementById('year').value;
    let sort = document.getElementById('sort').value;
    let titleOnly = document.getElementById('titleOnly').checked;
    let filtered = publications.filter(pub => {
      if(year && String(pub.year) !== year) return false;
      if(filter) {
        if(titleOnly) {
          if(!(pub.title||"").toLowerCase().includes(filter)) return false;
        } else {
          let txt = (pub.title||"") + " " + (pub.desc||"");
          if(!txt.toLowerCase().includes(filter)) return false;
        }
      }
      return true;
    });

    filtered.sort((a,b)=>{
      if(sort==='terbaru') return (b.date||'').localeCompare(a.date||'');
      if(sort==='terlama') return (a.date||'').localeCompare(b.date||'');
      if(sort==='judul-asc') return (a.title||'').localeCompare(b.title||'');
      if(sort==='judul-desc') return (b.title||'').localeCompare(a.title||'');
      return 0;
    });

    document.getElementById('countInfo').textContent = `Menampilkan 1-${filtered.length} dari ${publications.length} Pedoman`;

    let html = '';
    if(filtered.length === 0) {
      html = `<div class="text-center text-gray-500 py-8">Tidak ada pedoman ditemukan</div>`;
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
          <p class="text-gray-700 mt-1 text-sm leading-relaxed max-h-[120px] overflow-hidden">${pub.desc||''}</p>
          <div class="flex gap-2 mt-4 flex-wrap">
            ${pub.docUrl ? `
              <a href="${pub.docUrl}" target="_blank" class="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700" download="${pub.docName || ''}">Unduh Dokumen</a>
              <a href="${pub.docUrl}" target="_blank" class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-700">Lihat Dokumen</a>
            `: `<span class="px-3 py-1 bg-gray-300 text-gray-600 rounded text-xs">Belum ada dokumen</span>`}
            <button onclick="editPub(${pub.id})" class="px-3 py-1 bg-yellow-400 text-white rounded text-xs hover:bg-yellow-500">Edit</button>
            <button onclick="deletePub(${pub.id})" class="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Hapus</button>
          </div>
        </div>
      </article>
      `).join('');
    }
    document.getElementById('pubList').innerHTML = html;
  }

  function formatDate(dateStr) {
    if(!dateStr) return '';
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    let d = new Date(dateStr);
    if(isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  document.getElementById('filterForm').onsubmit = function(e){
    e.preventDefault();
    renderList();
  };
  ['keyword','year','sort','titleOnly'].forEach(id=>{
    document.getElementById(id).addEventListener('change', renderList);
    document.getElementById(id).addEventListener('input', renderList);
  });

  document.getElementById('addBtn').onclick = function() { openModal(); };
  window.openModal = openModal;
  function openModal(data) {
    document.getElementById('modalPub').classList.remove('hidden');
    document.getElementById('modalTitle').textContent = data ? 'Edit Pedoman' : 'Tambah Pedoman';
    document.getElementById('pubId').value = data?.id || '';
    document.getElementById('pubTitle').value = data?.title || '';
    document.getElementById('pubDate').value = data?.date || '';
    document.getElementById('pubYear').value = data?.year || '';
    document.getElementById('pubDesc').value = data?.desc || '';
    document.getElementById('pubImg').value = '';
    document.getElementById('previewImg').src = data?.imgUrl || '';
    document.getElementById('previewImg').classList.toggle('hidden', !data?.imgUrl);
    document.getElementById('pubDoc').value = '';
    document.getElementById('docName').textContent = data?.docName || '';
    document.getElementById('docName').setAttribute('title', data?.docName || '');
    document.getElementById('pubForm').setAttribute('data-edit', data ? '1' : '');
    document.getElementById('pubForm').setAttribute('data-edit-id', data?.id || '');
    document.getElementById('pubForm').setAttribute('data-imgurl', data?.imgUrl || '');
    document.getElementById('pubForm').setAttribute('data-docurl', data?.docUrl || '');
    document.getElementById('pubForm').setAttribute('data-docname', data?.docName || '');
    document.getElementById('errorMsg').textContent = "";
  }
  window.closeModal = closeModal;
  function closeModal() {
    document.getElementById('modalPub').classList.add('hidden');
    document.getElementById('pubForm').reset();
    document.getElementById('previewImg').src = "";
    document.getElementById('previewImg').classList.add('hidden');
    document.getElementById('docName').textContent = "";
    document.getElementById('docName').title = "";
    document.getElementById('errorMsg').textContent = "";
  }
  document.getElementById('modalPub').onclick = function(e) {
    if(e.target === this) closeModal();
  };

  document.getElementById('pubImg').onchange = function(e){
    let file = this.files[0];
    let preview = document.getElementById('previewImg');
    if(file){
      let url = URL.createObjectURL(file);
      preview.src = url;
      preview.classList.remove('hidden');
    }else{
      preview.src = "";
      preview.classList.add('hidden');
    }
  };

  document.getElementById('pubDoc').onchange = function(e){
    let file = this.files[0];
    let label = document.getElementById('docName');
    if(file) {
      label.textContent = file.name;
      label.title = file.name;
    } else {
      label.textContent = "";
      label.title = "";
    }
  };

  document.getElementById('pubForm').onsubmit = function(e){
    e.preventDefault();
    let id = document.getElementById('pubId').value;
    let obj = {
      id: id ? Number(id) : pubIdSeq++,
      title: document.getElementById('pubTitle').value,
      date: document.getElementById('pubDate').value,
      year: document.getElementById('pubYear').value,
      desc: document.getElementById('pubDesc').value,
      img: null,
      imgUrl: '',
      doc: null,
      docName: "",
      docUrl: ""
    };

    let tahunVal = obj.year;
    if (!/^\d{4}$/.test(tahunVal)) {
      document.getElementById('errorMsg').textContent = "Tahun harus 4 digit angka, misal: 2024";
      document.getElementById('pubYear').focus();
      return false;
    }
    let docFile = document.getElementById('pubDoc').files[0];
    if(!docFile && !this.getAttribute('data-docurl')) {
      document.getElementById('errorMsg').textContent = "Anda wajib mengunggah dokumen pedoman (.pdf, .doc, .xls, .zip)";
      document.getElementById('pubDoc').focus();
      return false;
    }

    let imgFile = document.getElementById('pubImg').files[0];
    if(imgFile){
      obj.img = imgFile;
      obj.imgUrl = URL.createObjectURL(imgFile);
    } else if (this.getAttribute('data-edit')) {
      obj.imgUrl = this.getAttribute('data-imgurl');
    }

    if(docFile){
      obj.doc = docFile;
      obj.docName = docFile.name;
      obj.docUrl = URL.createObjectURL(docFile);
    } else if (this.getAttribute('data-edit')) {
      obj.docUrl = this.getAttribute('data-docurl');
      obj.docName = this.getAttribute('data-docname');
    }

    if(id) {
      let idx = publications.findIndex(p=>p.id===Number(id));
      if(idx>=0) publications[idx] = obj;
    } else {
      publications.push(obj);
    }
    closeModal();
    renderList();
  };

  window.editPub = function(id) {
    let data = publications.find(p=>p.id===id);
    if(data) openModal(data);
  };
  window.deletePub = function(id) {
    if(confirm("Yakin ingin menghapus pedoman ini?")) {
      publications = publications.filter(p=>p.id!==id);
      renderList();
    }
  };

  renderList();
});
