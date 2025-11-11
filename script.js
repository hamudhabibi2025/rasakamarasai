<!DOCTYPE html>
<html>
<head>
    <title>Kunci Inspect Element</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .shortcut {
            font-weight: bold;
            color: #0056b3;
        }
    </style>
</head>
<body>

    <h1>🔑 Kunci (Shortcut) Inspect Element</h1>

    <table>
        <thead>
            <tr>
                <th>Aksi</th>
                <th>Windows & Linux</th>
                <th>macOS (Apple)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>**Buka Developer Tools**</td>
                <td class="shortcut">F12</td>
                <td class="shortcut">Cmd + Option + I</td>
            </tr>
            <tr>
                <td>**Buka Developer Tools**</td>
                <td class="shortcut">Ctrl + Shift + I</td>
                <td class="shortcut">Cmd + Option + J</td>
            </tr>
            <tr>
                <td>**Inspect Element Langsung**</td>
                <td class="shortcut">Ctrl + Shift + C</td>
                <td class="shortcut">Cmd + Shift + C</td>
            </tr>
        </tbody>
    </table>

    <h3>Cara Alternatif (Klik Kanan)</h3>
    <ol>
        <li>Arahkan kursor ke elemen pada halaman yang ingin Anda periksa.</li>
        <li>**Klik Kanan** (*Right Click*).</li>
        <li>Pilih opsi **"Inspect"** atau **"Periksa Elemen"**.</li>
    </ol>

</body>
</html>
// GANTI DENGAN URL APPS SCRIPT ANDA SETELAH DEPLOY
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzn7ZieFMApGz0qxdljK6aa1okfDOSuCh8h1i8-LKe066umohUR4DlVIDz-Kg8ieHY/exec'; 
const IMGBB_API_KEY = 'e9c06944a26b81e611e960c10a31634f'; 

// Variabel Global
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link[data-page]');
const loadingOverlay = document.getElementById('loading-overlay');
const toastElement = document.getElementById('liveToast');
const toastBody = document.getElementById('toast-body');
const toastTitle = document.getElementById('toast-title');
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const beritaModal = new bootstrap.Modal(document.getElementById('beritaModal'));
const kompetisiModal = new bootstrap.Modal(document.getElementById('kompetisiModal'));
const klubModal = new bootstrap.Modal(document.getElementById('klubModal'));

let ALL_DATA = {};
let currentPageId = 'home-page';

// --- [ UTILITY UI ] -----------------------------------------------------------------------------------

function showLoading() {
    loadingOverlay.classList.remove('d-none');
}

function hideLoading() {
    loadingOverlay.classList.add('d-none');
}

function showToast(message, isSuccess = true) {
    toastTitle.textContent = isSuccess ? 'Sukses' : 'Error';
    toastElement.querySelector('.toast-header').className = `toast-header text-white ${isSuccess ? 'bg-primary' : 'bg-danger'}`;
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

function navigateTo(targetPageId, isFromHistory = false) {
    if (isFromHistory && currentPageId === 'home-page' && targetPageId === 'home-page') {
        return; 
    }
    
    pages.forEach(page => {
        page.classList.add('d-none');
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(targetPageId);
    if(targetPage) {
        targetPage.classList.remove('d-none');
        targetPage.classList.add('active');
    }
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === targetPageId) {
            link.classList.add('active');
        }
    });

    currentPageId = targetPageId;

    if (!isFromHistory) {
        history.pushState({ page: targetPageId }, '', `#${targetPageId.replace('-page', '')}`);
    }
    
    // Muat data saat navigasi
    if (targetPageId === 'home-page') loadHomePageData();
    if (targetPageId === 'kompetisi-page') loadKompetisi();
    if (targetPageId === 'klub-page') loadKlub();
    if (targetPageId === 'setting-page') loadSettingInitialData();
}

// --- [ API & UTILITY KOMUNIKASI ] -------------------------------------------------------------

async function fetchAPI(sheet, action, data = {}) {
    showLoading();
    const url = `${APPS_SCRIPT_URL}?sheet=${sheet}&action=${action}`;
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify(data)
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        hideLoading();
        
        if (!result.success) {
            showToast(`Gagal: ${result.message}`, false);
            console.error("API Gagal:", result.message, result.data);
            return null;
        }
        
        showToast(result.message || 'Operasi berhasil!');
        return result.data;

    } catch (error) {
        hideLoading();
        showToast(`API Gagal: ${error.message}`, false);
        console.error("API Error:", error);
        return null;
    }
}

async function uploadImage(file) {
    if (!file) return null;
    
    showLoading();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            return result.data.url;
        } else {
            showToast(`Gagal unggah gambar: ${result.error.message}`, false);
            return null;
        }
    } catch (error) {
        hideLoading();
        showToast(`Error unggah gambar: ${error.message}`, false);
        return null;
    }
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
        const parts = dateString.split(/[\/\-]/);
        let d, m, y;
        
        if (parts.length === 3) {
            if (parts[0].length === 4) { [y, m, d] = parts; } else { [d, m, y] = parts; }
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    } catch (e) {
        console.warn("Format tanggal tidak dikenal:", dateString);
    }
    return '';
}

// --- [ PEMUATAN DATA STATIS ] -------------------------------------------------------------------

async function loadStaticData() {
    const headerData = await fetchAPI('kepala_halaman', 'READ', {});
    if (headerData) {
        ALL_DATA.kepala_halaman = headerData;
        document.getElementById('logo_pssi').src = headerData.logo_pssi;
        document.getElementById('judul_kepala').textContent = headerData.judul_kepala;
        document.getElementById('logo_askab').src = headerData.logo_askab;
    }

    const bannerData = await fetchAPI('banner', 'READ', {});
    if (bannerData) {
        ALL_DATA.banner = bannerData;
        const bannerInner = document.getElementById('banner-inner');
        bannerInner.innerHTML = '';
        const images = [bannerData['poto-1'], bannerData['poto-2'], bannerData['poto-3']].filter(url => url && url.startsWith('http'));
        
        images.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = `carousel-item${index === 0 ? ' active' : ''}`;
            item.innerHTML = `<img src="${url}" class="d-block w-100" alt="Banner ${index + 1}">`;
            bannerInner.appendChild(item);
        });
        if (images.length === 0) {
            bannerInner.innerHTML = '<div class="carousel-item active"><div class="alert alert-info text-center m-3">Belum ada gambar banner.</div></div>';
        }
    }
}


// --- [ FUNGSI FILTER ] --------------------------------------------------------------------------

function filterData(sheetName) {
    const searchInput = document.getElementById(`search-${sheetName}`).value.toLowerCase();
    const listContainer = document.getElementById(`${sheetName.split('_')[0]}-list`);
    const cards = listContainer.querySelectorAll('.data-card');

    cards.forEach(card => {
        const searchContent = card.dataset.search;
        if (searchContent && searchContent.includes(searchInput)) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

// --- [ RENDERING DATA ] -------------------------------------------------------------------------

async function loadDataAndRender(sheetName, renderFunction) {
    const list = await fetchAPI(sheetName, 'READ');
    if (list) {
        ALL_DATA[sheetName] = list;
        renderFunction(list);
    }
}

function loadHomePageData() { loadDataAndRender('berita_home', renderBerita); }
function loadKompetisi() { loadDataAndRender('kompetisi', renderKompetisi); }
function loadKlub() { loadDataAndRender('klub', renderKlub); }


function renderBerita(data) {
    const listContainer = document.getElementById('berita-list');
    listContainer.innerHTML = '';
    if (data.length === 0) { listContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Belum ada berita.</p></div>'; return; }

    data.forEach(item => {
        const date = item.tanggal || 'Tanggal Tidak Diketahui';
        const card = `
            <div class="col-12 col-md-6 col-lg-4 mb-4 data-card" data-sheet="berita_home" data-search="${item.Judul_Berita.toLowerCase()} ${item.isi_berita.toLowerCase()}">
                <div class="card shadow-sm h-100">
                    <img src="${item.gambar_1 || 'https://via.placeholder.com/400x200?text=No+Image'}" class="card-img-top" alt="${item.Judul_Berita}" style="height:200px; object-fit:cover;">
                    <div class="card-body d-flex flex-column">
                        <small class="text-muted">${date} | ID: ${item.id_berita}</small>
                        <h5 class="card-title">${item.Judul_Berita}</h5>
                        <p class="card-text flex-grow-1">${item.isi_berita.substring(0, 100)}...</p>
                        <div class="mt-auto pt-2 border-top">
                            <button class="btn btn-sm btn-warning me-2" onclick="editData('berita_home', '${item.id_berita}', 'id_berita')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="confirmDelete('berita_home', '${item.id_berita}')">Hapus</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        listContainer.innerHTML += card;
    });
}

function renderKompetisi(data) {
    const listContainer = document.getElementById('kompetisi-list');
    listContainer.innerHTML = '';
    if (data.length === 0) { listContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Belum ada data kompetisi.</p></div>'; return; }

    data.forEach(item => {
        const date = item.tanggal || 'Tgl Tidak Ada';
        const searchString = `${item.nama_kompetisi} ${item.nama_klub1} ${item.nama_klub2} ${item.lokasi}`.toLowerCase();
        const card = `
            <div class="col-12 mb-3 data-card" data-sheet="kompetisi" data-search="${searchString}">
                <div class="card shadow-sm">
                    <div class="card-header bg-primary text-white text-center">
                        <small class="fw-bold">${item.jenis_pertandingan}</small>
                        <h6 class="mb-0">${item.nama_kompetisi} - ${date}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center align-items-center">
                            <div class="col-4">
                                <img src="${item.logo_klub1 || 'https://via.placeholder.com/50'}" class="img-fluid mb-1" style="height:50px; object-fit:contain;">
                                <p class="mb-0 fw-bold">${item.nama_klub1}</p>
                            </div>
                            <div class="col-4">
                                <h2 class="fw-bolder text-primary">${item.goal1} - ${item.goal2}</h2>
                                <small class="text-muted d-block">${item.lokasi}</small>
                            </div>
                            <div class="col-4">
                                <img src="${item.logo_klub2 || 'https://via.placeholder.com/50'}" class="img-fluid mb-1" style="height:50px; object-fit:contain;">
                                <p class="mb-0 fw-bold">${item.nama_klub2}</p>
                            </div>
                        </div>
                        <div class="mt-3 border-top pt-2">
                             <small class="d-block text-center text-muted">Kartu Kuning: ${item.kartu_kuning1} vs ${item.kartu_kuning2} | Merah: ${item.kartu_merah1} vs ${item.kartu_merah2}</small>
                        </div>
                        <div class="text-center mt-3">
                             <button class="btn btn-sm btn-warning me-2" onclick="editData('kompetisi', '${item.id_pertandingan}', 'id_pertandingan')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="confirmDelete('kompetisi', '${item.id_pertandingan}')">Hapus</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        listContainer.innerHTML += card;
    });
}

function renderKlub(data) {
    const listContainer = document.getElementById('klub-list');
    listContainer.innerHTML = '';
    if (data.length === 0) { listContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Belum ada data klub.</p></div>'; return; }

    data.forEach(item => {
        const searchString = `${item.nama_klub} ${item.julukan} ${item.manejer} ${item.pelatih}`.toLowerCase();
        const card = `
            <div class="col-12 col-md-6 mb-4 data-card" data-sheet="klub" data-search="${searchString}">
                <div class="card shadow-sm h-100">
                    <div class="card-body d-flex">
                        <img src="${item.logo_klub || 'https://via.placeholder.com/80'}" alt="${item.nama_klub}" class="me-3 rounded-circle" style="width: 80px; height: 80px; object-fit: contain; border: 1px solid #ddd;">
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-0">${item.nama_klub} <span class="badge bg-secondary">${item.julukan}</span></h5>
                            <small class="text-muted">Berdiri: ${item.tanggal_berdiri || 'N/A'}</small><br>
                            <small>Manajer: **${item.manejer || '-'}** | Pelatih: **${item.pelatih || '-'}**</small>
                            <p class="text-xs mb-0 mt-1">Alamat: ${item.alamat.substring(0, 50)}...</p>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-end">
                        <button class="btn btn-sm btn-warning me-2" onclick="editData('klub', '${item.id_klub}', 'id_klub')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDelete('klub', '${item.id_klub}')">Hapus</button>
                    </div>
                </div>
            </div>
        `;
        listContainer.innerHTML += card;
    });
}


// --- [ CRUD HANDLERS ] --------------------------------------------------------------------------

function resetForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
    form.querySelectorAll('input[type="file"]').forEach(input => { input.value = ''; });

    const idMap = { 'beritaForm': 'id_berita', 'kompetisiForm': 'id_pertandingan', 'klubForm': 'id_klub' };
    const modalMap = { 'beritaForm': { modal: beritaModal, label: 'beritaModalLabel', title: 'Tambah Berita Baru' },
                       'kompetisiForm': { modal: kompetisiModal, label: 'kompetisiModalLabel', title: 'Tambah Kompetisi Baru' },
                       'klubForm': { modal: klubModal, label: 'klubModalLabel', title: 'Tambah Klub Baru' } };

    if (idMap[formId]) {
        document.getElementById(idMap[formId]).value = '';
        document.getElementById(modalMap[formId].label).textContent = modalMap[formId].title;
        modalMap[formId].modal.hide();
    }
}

async function editData(sheetName, id, idColName) {
    const dataToEdit = ALL_DATA[sheetName].find(item => item[idColName] === id);
    if (!dataToEdit) { showToast("Data tidak ditemukan di cache.", false); return; }
    
    let formId, modal, modalLabelId;
    if (sheetName === 'berita_home') { formId = 'beritaForm'; modal = beritaModal; modalLabelId = 'beritaModalLabel'; } 
    else if (sheetName === 'kompetisi') { formId = 'kompetisiForm'; modal = kompetisiModal; modalLabelId = 'kompetisiModalLabel'; } 
    else if (sheetName === 'klub') { formId = 'klubForm'; modal = klubModal; modalLabelId = 'klubModalLabel'; } else { return; }

    resetForm(formId);
    document.getElementById(modalLabelId).textContent = `Edit Data ID: ${id}`;
    
    const form = document.getElementById(formId);
    for (const key in dataToEdit) {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'date') { input.value = formatDateForInput(dataToEdit[key]); }
            else if (input.type !== 'file') { input.value = dataToEdit[key]; }
        }
        
        if (key.startsWith('id_') || key.startsWith('logo_') || key.startsWith('gambar_') || key.startsWith('poto-')) {
             const hiddenInput = form.querySelector(`[name="${key}Hidden"]`);
             if(hiddenInput) hiddenInput.value = dataToEdit[key];
             if(key.startsWith('id_')) input.value = dataToEdit[key]; // set ID field
        }
    }
    modal.show();
}

function confirmDelete(sheetName, id) {
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    
    deleteBtn.replaceWith(deleteBtn.cloneNode(true));
    const newDeleteBtn = document.getElementById('confirmDeleteBtn');

    newDeleteBtn.addEventListener('click', async () => {
        confirmModal.hide();
        const result = await fetchAPI(sheetName, 'DELETE', { id: id });
        if (result) {
            if (sheetName === 'berita_home') loadHomePageData();
            if (sheetName === 'kompetisi') loadKompetisi();
            if (sheetName === 'klub') loadKlub();
        }
    }, { once: true });

    document.getElementById('confirmModalBody').textContent = `Apakah Anda yakin ingin menghapus data ${sheetName} dengan ID: ${id}?`;
    confirmModal.show();
}

async function handleFormSubmit(event, sheetName, action) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {};
    let uploadPromises = [];
    let isUpdateOperation = action === 'UPDATE';

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.name) {
            if (key.endsWith('Hidden')) continue;
            
            if (key.startsWith('logo_') || key.startsWith('gambar_') || key.startsWith('poto-')) {
                if (value.size > 0) {
                     uploadPromises.push(uploadImage(value).then(url => ({ key: key, url: url })));
                } else if (isUpdateOperation) {
                     const oldValue = form.querySelector(`[name="${key}Hidden"]`)?.value || '';
                     data[key] = oldValue;
                }
            }
        } else if (!(value instanceof File) && !key.endsWith('Hidden')) {
            data[key] = value;
        }
    }
    
    const uploadedUrls = await Promise.all(uploadPromises);
    for (const { key, url } of uploadedUrls) {
        if (url) {
            data[key] = url;
        } else if (isUpdateOperation) {
            const oldValue = form.querySelector(`[name="${key}Hidden"]`)?.value || '';
            if (oldValue && oldValue.startsWith('http')) {
                data[key] = oldValue;
            } else if(form.querySelector(`[name="${key}"][required]`)) {
                showToast(`Unggahan gambar ${key} gagal dan tidak ada URL lama. Operasi dibatalkan.`, false);
                return; 
            }
        } else if(form.querySelector(`[name="${key}"][required]`)) {
             showToast(`Unggahan gambar ${key} gagal. Operasi dibatalkan.`, false);
             return; 
        }
    }
    
    const result = await fetchAPI(sheetName, action, data);
    
    if (result) {
        if (sheetName === 'berita_home') loadHomePageData();
        if (sheetName === 'kompetisi') loadKompetisi();
        if (sheetName === 'klub') loadKlub();
        
        if (['kepala_halaman', 'banner', 'profil', 'struktur_organisasi'].includes(sheetName)) {
            loadStaticData(); 
            loadSettingData(sheetName); 
        }

        resetForm(form.id);
    }
}


// --- [ PENGATURAN / SETTING ] --------------------------------------------------------------------

function loadSettingInitialData() {
    loadStaticData(); 
    const activeSetting = document.querySelector('.btn-setting.active')?.dataset.targetSheet || 'kepala_halaman';
    loadSettingData(activeSetting);
}

function loadSettingData(sheetName) {
    document.querySelectorAll('.btn-setting').forEach(btn => btn.classList.remove('active'));
    
    document.querySelectorAll('[id^="form-setting-"]').forEach(f => f.classList.add('d-none'));
    const formElement = document.getElementById(`form-setting-${sheetName}`);
    if (formElement) {
        formElement.classList.remove('d-none');
        document.querySelector(`.btn-setting[data-target-sheet="${sheetName}"]`).classList.add('active');
        loadStaticDataToForm(sheetName);
    }
}

async function loadStaticDataToForm(sheetName) {
    const data = ALL_DATA[sheetName];
    if (!data) {
        // Coba load lagi jika belum ada di cache
        const freshData = await fetchAPI(sheetName, 'READ');
        if (freshData) ALL_DATA[sheetName] = freshData;
        else return;
    }

    const form = document.getElementById(`${sheetName}Form`);
    if (!form) return;

    for (const key in data) {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'date') { input.value = formatDateForInput(data[key]); }
            else { input.value = data[key]; }
        }
        
        // Set hidden field untuk gambar statis
        if (key.startsWith('logo_') || key.startsWith('poto-')) {
             const hiddenInput = form.querySelector(`[name="${key}Hidden"]`);
             if(hiddenInput) hiddenInput.value = data[key];
        }
    }
}


// --- [ INIALISASI APLIKASI ] ----------------------------------------------------------------------

function init() {
    // 1. Setup Navigasi Bawah
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
    
    // 2. Setup Navigasi Setting
    document.querySelectorAll('.btn-setting').forEach(btn => {
        btn.addEventListener('click', (e) => {
            loadSettingData(e.target.dataset.targetSheet);
        });
    });
    
    // 3. Penanganan Back Button (Popstate)
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            navigateTo(e.state.page, true);
        } else {
            if (currentPageId !== 'home-page') {
                 navigateTo('home-page', true);
            }
        }
    });
    
    // 4. Muat data statis dan halaman default
    loadStaticData().then(() => {
        const initialPageHash = window.location.hash.substring(1);
        const initialPage = (initialPageHash ? initialPageHash + '-page' : 'home-page');
        navigateTo(initialPage);
    });
}

window.onload = init;
