const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwE_HroFq8uYAU8SXVWrDqoz3MtoJyQp3fyf53tBpKDVUAv41SF3bv_xU5R6gmv7-MM/exec"; // <<< GANTI DENGAN URL WEB APP ANDA DI SINI
const appContent = document.getElementById('app-content');
const appHeader = document.getElementById('app-header');
const navItems = document.querySelectorAll('.nav-item');
const crudModal = document.getElementById('crud-modal');
const crudForm = document.getElementById('crud-form');
const formTitle = document.getElementById('form-title');
const toastNotification = document.getElementById('toast-notification');
const loadingSpinner = document.getElementById('loading-spinner');
const confirmModal = document.getElementById('confirmation-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmYes = document.getElementById('confirm-yes');
let currentSheetData = {}; // Cache data from sheets

// --- Utility Functions ---

function showLoading() { loadingSpinner.style.display = 'flex'; }
function hideLoading() { loadingSpinner.style.display = 'none'; }

function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

function showConfirmation(message, callback) {
    confirmMessage.textContent = message;
    confirmModal.style.display = 'block';
    
    confirmYes.onclick = () => {
        confirmModal.style.display = 'none';
        callback(true);
    };

    document.getElementById('confirm-no').onclick = () => {
        confirmModal.style.display = 'none';
        callback(false);
    };
}

function fetchApi(action, method = 'GET', data = null) {
    const url = `${WEB_APP_URL}?action=${action}`;
    const options = {
        method: method,
        muteHttpExceptions: true
    };
    
    if (data && method === 'POST') {
        options.body = JSON.stringify(data);
        options.headers = { 'Content-Type': 'application/json' };
    }

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'error') {
                throw new Error(data.message);
            }
            return data;
        });
}

function getBase64Image(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Convert DD/MM/YYYY to YYYY-MM-DD for date input value
function dateToInput(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateString.substring(0, 10);
    }
    return '';
}

// Convert YYYY-MM-DD (from input) to DD/MM/YYYY (for Sheets)
function dateToSheet(dateString) {
    if (!dateString || dateString.length !== 10) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

// --- Header Management ---

async function loadHeader() {
    try {
        const response = await fetchApi('kepala_halaman');
        const headerData = response.data[0] || {};
        
        appHeader.innerHTML = `
            <img src="${headerData.logo_pssi || 'placeholder.png'}" alt="Logo PSSI" id="logo-pssi">
            <h1>${headerData.judul_kepala || 'ASKAB PSSI KEPULAUAN MENTAWAI'}</h1>
            <img src="${headerData.logo_askab || 'placeholder.png'}" alt="Logo ASKAB" id="logo-askab">
        `;
    } catch (error) {
        console.error("Error loading header:", error);
        appHeader.innerHTML = `<h1>ASKAB PSSI KEPULAUAN MENTAWAI</h1>`; // Fallback
    }
}


// --- Form Definitions ---

const FORM_DEFINITIONS = {
    kepala_halaman: [
        { name: 'logo_pssi', type: 'file', label: 'Logo PSSI (ImgBB)', required: true },
        { name: 'judul_kepala', type: 'text', label: 'Judul Kepala', required: true },
        { name: 'logo_askab', type: 'file', label: 'Logo ASKAB (ImgBB)', required: true }
    ],
    banner: [
        { name: 'poto-1', type: 'file', label: 'Foto Banner 1 (ImgBB)', required: true },
        { name: 'poto-2', type: 'file', label: 'Foto Banner 2 (ImgBB)', required: true },
        { name: 'poto-3', type: 'file', label: 'Foto Banner 3 (ImgBB)', required: true }
    ],
    profil: [
        { name: 'nama_organisasi', type: 'text', label: 'Nama Organisasi', required: true },
        { name: 'tanggal_berdiri', type: 'date', label: 'Tanggal Berdiri', required: true },
        { name: 'visi', type: 'textarea', label: 'Visi', required: true },
        { name: 'misi', type: 'textarea', label: 'Misi', required: true }
    ],
    struktur_organisasi: [
        { name: 'ketua', type: 'text', label: 'Ketua', required: true },
        { name: 'wakil_ketua', type: 'text', label: 'Wakil Ketua', required: true },
        { name: 'sekretaris', type: 'text', label: 'Sekretaris', required: true },
        { name: 'bendahara', type: 'text', label: 'Bendahara', required: true },
        { name: 'humas', type: 'text', label: 'Humas', required: true },
        { name: 'media', type: 'text', label: 'Media', required: true }
    ],
    berita_home: [
        { name: 'id_berita', type: 'text', label: 'ID Berita', readonly: true, isId: true },
        { name: 'tanggal', type: 'date', label: 'Tanggal', required: true },
        { name: 'Judul_Berita', type: 'text', label: 'Judul Berita', required: true },
        { name: 'isi_berita', type: 'textarea', label: 'Isi Berita', required: true },
        { name: 'gambar_1', type: 'file', label: 'Gambar 1 (ImgBB)' },
        { name: 'gambar_2', type: 'file', label: 'Gambar 2 (ImgBB)' },
        { name: 'gambar_3', type: 'file', label: 'Gambar 3 (ImgBB)' }
    ],
    kompetisi: [
        { name: 'id_pertandingan', type: 'text', label: 'ID Pertandingan', readonly: true, isId: true },
        { name: 'nama_kompetisi', type: 'select', label: 'Nama Kompetisi', options: ['Liga Askab', 'Liga Bupati', 'Liga Desa'], required: true },
        { name: 'jenis_pertandingan', type: 'select', label: 'Jenis Pertandingan', options: ['Babak Fase Group', 'Babak Penyisihan', 'Babak 16 Besar', 'Babak Semifinal', 'Final'], required: true },
        { name: 'tanggal', type: 'date', label: 'Tanggal', required: true },
        { name: 'lokasi', type: 'text', label: 'Lokasi', required: true },
        { name: 'nama_klub1', type: 'text', label: 'Nama Klub 1', required: true },
        { name: 'logo_klub1', type: 'file', label: 'Logo Klub 1 (ImgBB)' },
        { name: 'goal1', type: 'number', label: 'Goal Klub 1', default: 0 },
        { name: 'Ket_goal1', type: 'textarea', label: 'Keterangan Goal 1' },
        { name: 'kartu_kuning1', type: 'number', label: 'Kartu Kuning 1', default: 0 },
        { name: 'ket_kartu_kuning1', type: 'textarea', label: 'Ket. Kartu Kuning 1' },
        { name: 'kartu_merah1', type: 'number', label: 'Kartu Merah 1', default: 0 },
        { name: 'ket_kartu_merah1', type: 'textarea', label: 'Ket. Kartu Merah 1' },
        { name: 'nama_klub2', type: 'text', label: 'Nama Klub 2', required: true },
        { name: 'logo_klub2', type: 'file', label: 'Logo Klub 2 (ImgBB)' },
        { name: 'goal2', type: 'number', label: 'Goal Klub 2', default: 0 },
        { name: 'Ket_goal2', type: 'textarea', label: 'Keterangan Goal 2' },
        { name: 'kartu_kuning2', type: 'number', label: 'Kartu Kuning 2', default: 0 },
        { name: 'ket_kartu_kuning2', type: 'textarea', label: 'Ket. Kartu Kuning 2' },
        { name: 'kartu_merah2', type: 'number', label: 'Kartu Merah 2', default: 0 },
        { name: 'ket_kartu_merah2', type: 'textarea', label: 'Ket. Kartu Merah 2' }
    ],
    klub: [
        { name: 'id_klub', type: 'text', label: 'ID Klub', readonly: true, isId: true },
        { name: 'nama_klub', type: 'text', label: 'Nama Klub', required: true },
        { name: 'julukan', type: 'text', label: 'Julukan' },
        { name: 'tanggal_berdiri', type: 'date', label: 'Tanggal Berdiri', required: true },
        { name: 'alamat', type: 'textarea', label: 'Alamat', required: true },
        { name: 'manejer', type: 'text', label: 'Manejer', required: true },
        { name: 'asisten_manejer', type: 'text', label: 'Asisten Manejer' },
        { name: 'pelatih', type: 'text', label: 'Pelatih', required: true },
        { name: 'asisten_pelatih', type: 'text', label: 'Asisten Pelatih' },
        { name: 'staff_lainnya', type: 'textarea', label: 'Staff Lainnya' },
        { name: 'no_handphone_klub', type: 'number', label: 'No Handphone Klub', required: true },
        { name: 'logo_klub', type: 'file', label: 'Logo Klub (ImgBB)' }
    ]
};

function createFormFields(sheetName, record = {}) {
    const fields = FORM_DEFINITIONS[sheetName];
    if (!fields) return;

    let html = '';
    const isEditingFixed = ['kepala_halaman', 'banner', 'profil', 'struktur_organisasi'].includes(sheetName);

    fields.forEach(field => {
        const currentValue = field.type === 'date' ? dateToInput(record[field.name]) : record[field.name] || '';
        let inputField = '';
        const requiredAttr = field.required ? 'required' : '';
        const defaultValue = field.default !== undefined ? field.default : '';

        if (field.type === 'select') {
            inputField = `<select id="${field.name}" name="${field.name}" ${requiredAttr}>`;
            field.options.forEach(option => {
                const selected = option === currentValue ? 'selected' : '';
                inputField += `<option value="${option}" ${selected}>${option}</option>`;
            });
            inputField += `</select>`;
        } else if (field.type === 'textarea') {
             inputField = `<textarea id="${field.name}" name="${field.name}" class="text-area-wide" ${requiredAttr}>${currentValue}</textarea>`;
        } else if (field.type === 'file') {
            const currentImgUrl = currentValue.includes('http') ? currentValue : '';
            inputField = `
                <input type="file" id="${field.name}" name="${field.name}" accept="image/*" ${field.required && !currentImgUrl ? 'required' : ''}>
                ${currentImgUrl ? `<img src="${currentImgUrl}" alt="Current Image" class="image-preview-small"><p>Abaikan jika tidak ingin ganti gambar.</p><input type="hidden" name="existing_${field.name}" value="${currentImgUrl}">` : ''}
            `;
        } else {
            const valueToUse = currentValue || defaultValue;
            inputField = `<input type="${field.type}" id="${field.name}" name="${field.name}" value="${valueToUse}" ${field.readonly ? 'readonly' : ''} ${requiredAttr} ${field.type === 'number' ? 'min="0"' : ''}>`;
        }

        html += `
            <div class="form-group">
                <label for="${field.name}">${field.label} ${field.required ? '<span style="color:red;">*</span>' : ''}</label>
                ${inputField}
            </div>
        `;
    });
    
    const idField = fields.find(f => f.isId);
    if (idField && record[idField.name]) {
        html += `<input type="hidden" name="${idField.name}" value="${record[idField.name]}">`;
    }
    
    html += `<button type="submit" class="btn btn-primary">Simpan</button>`;
    
    if (idField && record[idField.name] && !isEditingFixed) {
         html += `<button type="button" class="btn btn-danger" id="delete-btn" style="margin-left: 10px;">Hapus</button>`;
    }

    crudForm.innerHTML = html;
    crudForm.setAttribute('data-sheet', sheetName);
    crudModal.style.display = 'block';

    if (document.getElementById('delete-btn')) {
        document.getElementById('delete-btn').onclick = () => {
            showConfirmation('Yakin ingin menghapus data ini?', (isConfirmed) => {
                if (isConfirmed) {
                    handleFormSubmit(sheetName, 'DELETE', record);
                }
            });
        };
    }
}

// --- CRUD Submission Handler ---

async function handleFormSubmit(sheetName, method, initialRecord = {}) {
    const requiredFields = FORM_DEFINITIONS[sheetName].filter(f => f.required);
    let isValid = true;
    
    for (const field of requiredFields) {
        const element = crudForm.querySelector(`[name="${field.name}"]`);
        if (element) {
            let value = element.value.trim();
            if (field.type === 'file') {
                const existingHidden = crudForm.querySelector(`input[name="existing_${field.name}"]`);
                if ((method === 'CREATE' && element.files.length === 0) || 
                    (method === 'UPDATE' && field.required && !existingHidden?.value && element.files.length === 0)) {
                     isValid = false;
                     showToast(`Gambar ${field.label} wajib diisi.`);
                     break;
                }
            } else if (value === '' && !field.readonly) {
                isValid = false;
                showToast(`${field.label} wajib diisi.`);
                break;
            }
        }
    }

    if (!isValid) return;

    showLoading();
    crudModal.style.display = 'none';

    let record = {};
    const formElements = crudForm.elements;
    
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        if (element.name && element.type !== 'submit' && element.type !== 'button') {
            const fieldDef = FORM_DEFINITIONS[sheetName].find(f => f.name === element.name);
            
            if (element.type === 'file' && element.files.length > 0) {
                record[element.name] = await getBase64Image(element.files[0]);
            } else if (element.name.startsWith('existing_')) {
                record[element.name.replace('existing_', '')] = element.value;
            } else if (element.type !== 'file') {
                if (fieldDef && fieldDef.type === 'number' && element.value === '') {
                     record[element.name] = fieldDef.default !== undefined ? String(fieldDef.default) : '';
                } else {
                     record[element.name] = element.value.trim();
                }
            }
        }
    }
    
    if (record.tanggal) record.tanggal = dateToSheet(record.tanggal);
    if (record.tanggal_berdiri) record.tanggal_berdiri = dateToSheet(record.tanggal_berdiri);

    let finalPayload = (method === 'UPDATE' || method === 'DELETE') ? {...initialRecord, ...record} : record;
    
    const payload = {
        sheetName: sheetName,
        method: method,
        record: finalPayload
    };
    
    try {
        const response = await fetchApi(sheetName, 'POST', payload);
        showToast(response.message);
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) loadPage(activeNav.dataset.page);
    } catch (error) {
        console.error("CRUD Error:", error);
        showToast(`Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}


// --- Page Render Functions --- (Disederhanakan untuk kode final)

function renderHomePage(data) {
    const listHtml = data.map(item => `
        <div class="list-item berita-item" data-id="${item.id_berita}">
            <div class="item-header">${item.Judul_Berita} (${item.tanggal})</div>
            <div class="item-details">
                <p>${item.isi_berita.substring(0, 100)}...</p>
                ${item.gambar_1 ? `<img src="${item.gambar_1}" alt="Gambar Berita" class="image-preview">` : ''}
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-edit" data-id="${item.id_berita}" data-sheet="berita_home">Edit</button>
            </div>
        </div>
    `).join('');

    appContent.innerHTML = `<div class="page-container"><div class="search-container"><input type="text" id="search-berita" placeholder="Cari Berita..."><button class="btn btn-primary" id="add-berita-btn"><i class="fas fa-plus"></i> Tambah Berita</button></div><div class="data-list" id="berita-list">${listHtml}</div></div>`;

    document.getElementById('add-berita-btn').onclick = () => { formTitle.textContent = 'Tambah Berita Baru'; createFormFields('berita_home'); };
    document.getElementById('search-berita').addEventListener('input', (e) => filterList('berita_home', e.target.value, ['Judul_Berita', 'isi_berita']));
    document.querySelectorAll('.btn-edit[data-sheet="berita_home"]').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const record = data.find(item => item.id_berita === id);
            formTitle.textContent = 'Edit Berita';
            createFormFields('berita_home', record);
        };
    });
}

function renderKompetisiPage(data) {
    const listHtml = data.map(item => `
        <div class="list-item kompetisi-item" data-id="${item.id_pertandingan}">
            <div class="item-header">${item.nama_kompetisi} - ${item.jenis_pertandingan} (${item.tanggal})</div>
            <p>Lokasi: <strong>${item.lokasi}</strong></p>
            <div class="klub-matchup" style="display: flex; align-items: center; justify-content: space-between; margin: 10px 0; border: 1px solid #eee; padding: 10px; border-radius: 5px;">
                <div style="text-align: center; flex: 1;">
                    ${item.logo_klub1 ? `<img src="${item.logo_klub1}" alt="Logo Klub 1" class="image-preview-small">` : ''}
                    <p><strong>${item.nama_klub1}</strong></p>
                </div>
                <div style="text-align: center; flex: 0 0 80px;"><span style="font-size: 1.5em; font-weight: bold;">${item.goal1 || 0} - ${item.goal2 || 0}</span></div>
                <div style="text-align: center; flex: 1;">
                    ${item.logo_klub2 ? `<img src="${item.logo_klub2}" alt="Logo Klub 2" class="image-preview-small">` : ''}
                    <p><strong>${item.nama_klub2}</strong></p>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-edit" data-id="${item.id_pertandingan}" data-sheet="kompetisi">Detail / Edit</button>
            </div>
        </div>
    `).join('');

    appContent.innerHTML = `<div class="page-container"><div class="search-container"><input type="text" id="search-kompetisi" placeholder="Cari Kompetisi..."><button class="btn btn-primary" id="add-kompetisi-btn"><i class="fas fa-plus"></i> Tambah Kompetisi</button></div><div class="data-list" id="kompetisi-list">${listHtml}</div></div>`;

    document.getElementById('add-kompetisi-btn').onclick = () => { formTitle.textContent = 'Tambah Data Kompetisi'; createFormFields('kompetisi'); };
    document.getElementById('search-kompetisi').addEventListener('input', (e) => filterList('kompetisi', e.target.value, ['nama_kompetisi', 'jenis_pertandingan', 'nama_klub1', 'nama_klub2', 'lokasi']));
    document.querySelectorAll('.btn-edit[data-sheet="kompetisi"]').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const record = data.find(item => item.id_pertandingan === id);
            formTitle.textContent = 'Edit Data Kompetisi';
            createFormFields('kompetisi', record);
        };
    });
}

function renderKlubPage(data) {
    const listHtml = data.map(item => `
        <div class="list-item klub-item" data-id="${item.id_klub}">
            <div style="display: flex; align-items: center; width: 100%;">
                ${item.logo_klub ? `<img src="${item.logo_klub}" alt="Logo Klub" class="image-preview-small">` : ''}
                <div style="flex-grow: 1;"><div class="item-header">${item.nama_klub} (${item.julukan})</div><p>Berdiri: ${item.tanggal_berdiri}</p><p>Manajer: ${item.manejer}</p></div>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-edit" data-id="${item.id_klub}" data-sheet="klub">Detail / Edit</button>
            </div>
        </div>
    `).join('');

    appContent.innerHTML = `<div class="page-container"><div class="search-container"><input type="text" id="search-klub" placeholder="Cari Klub..."><button class="btn btn-primary" id="add-klub-btn"><i class="fas fa-plus"></i> Tambah Klub</button></div><div class="data-list klub-list" id="klub-list">${listHtml}</div></div>`;

    document.getElementById('add-klub-btn').onclick = () => { formTitle.textContent = 'Tambah Klub Baru'; createFormFields('klub'); };
    document.getElementById('search-klub').addEventListener('input', (e) => filterList('klub', e.target.value, ['nama_klub', 'julukan', 'manejer', 'pelatih']));
    document.querySelectorAll('.btn-edit[data-sheet="klub"]').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const record = data.find(item => item.id_klub === id);
            formTitle.textContent = 'Edit Data Klub';
            createFormFields('klub', record);
        };
    });
}

function renderSettingPage(data) {
    const kepalaData = data.kepala_halaman[0] || {};
    const profilData = data.profil[0] || {};
    const strukturData = data.struktur_organisasi[0] || {};

    appContent.innerHTML = `
        <div class="page-container"><h2>Pengaturan Website</h2><div class="data-list">
            <div class="list-item"><div class="item-header">Kepala Halaman (Header)</div><p>Judul: <strong>${kepalaData.judul_kepala || '-'}</strong></p><p>Logo PSSI: <img src="${kepalaData.logo_pssi}" class="image-preview-small"></p><div class="item-actions"><button class="btn btn-secondary btn-setting-edit" data-sheet="kepala_halaman">Edit</button></div></div>
            <div class="list-item"><div class="item-header">Banner Foto (Poto-1, Poto-2, Poto-3)</div><div class="item-actions"><button class="btn btn-secondary btn-setting-edit" data-sheet="banner">Edit</button></div></div>
            <div class="list-item"><div class="item-header">Profil Organisasi</div><p>Nama: <strong>${profilData.nama_organisasi || '-'}</strong></p><p>Visi: ${profilData.visi ? profilData.visi.substring(0, 50) + '...' : '-'}</p><div class="item-actions"><button class="btn btn-secondary btn-setting-edit" data-sheet="profil">Edit</button></div></div>
            <div class="list-item"><div class="item-header">Struktur Organisasi</div><p>Ketua: <strong>${strukturData.ketua || '-'}</strong></p><div class="item-actions"><button class="btn btn-secondary btn-setting-edit" data-sheet="struktur_organisasi">Edit</button></div></div>
        </div></div>
    `;
    
    document.querySelectorAll('.btn-setting-edit').forEach(btn => {
        btn.onclick = () => {
            const sheetName = btn.dataset.sheet;
            const record = data[sheetName][0] || {};
            formTitle.textContent = `Edit Data ${sheetName.replace('_', ' ').toUpperCase()}`;
            createFormFields(sheetName, record);
        };
    });
}

// --- Main Load Function ---

async function loadPage(pageName) {
    showLoading();
    
    const fixedSheets = ['kepala_halaman', 'banner', 'profil', 'struktur_organisasi'];
    for (const sheet of fixedSheets) {
        try {
            currentSheetData[sheet] = (await fetchApi(sheet)).data;
        } catch (e) {
             currentSheetData[sheet] = [];
        }
    }
    loadHeader();
    
    let renderData = [];
    const dynamicSheets = { 'home': 'berita_home', 'kompetisi': 'kompetisi', 'klub': 'klub' };

    if (dynamicSheets[pageName]) {
        const sheetToLoad = dynamicSheets[pageName];
        try {
            const response = await fetchApi(sheetToLoad);
            renderData = response.data;
            currentSheetData[sheetToLoad] = renderData;
        } catch (error) {
            showToast(`Gagal memuat data ${sheetToLoad}.`);
            renderData = [];
        }
    } else if (pageName === 'setting') {
        renderData = currentSheetData;
    }
    
    switch (pageName) {
        case 'home': renderHomePage(renderData); break;
        case 'kompetisi': renderKompetisiPage(renderData); break;
        case 'klub': renderKlubPage(renderData); break;
        case 'setting': renderSettingPage(renderData); break;
    }

    navItems.forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if(activeNav) activeNav.classList.add('active');

    hideLoading();
}

// --- Filtering Function ---

function filterList(sheetName, searchTerm, searchFields) {
    const listContainer = document.getElementById(sheetName + '-list');
    if (!listContainer) return;
    
    const data = currentSheetData[sheetName];
    const normalizedSearch = searchTerm.toLowerCase();

    const filteredData = data.filter(record => {
        return searchFields.some(field => 
            String(record[field]).toLowerCase().includes(normalizedSearch)
        );
    });

    const allItems = listContainer.querySelectorAll('.list-item');
    allItems.forEach(item => item.style.display = 'none');
    
    filteredData.forEach(record => {
        const idField = sheetName === 'berita_home' ? 'id_berita' : 
                        sheetName === 'kompetisi' ? 'id_pertandingan' : 'id_klub';
        const itemElement = listContainer.querySelector(`[data-id="${record[idField]}"]`);
        if (itemElement) {
            itemElement.style.display = 'flex';
            itemElement.style.flexDirection = 'column';
        }
    });
}


// --- Event Listeners and Initial Load ---

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        if (window.location.hash.replace('#', '') !== page) {
            history.pushState({ page: page }, '', `#${page}`);
        }
        loadPage(page);
    });
});

crudModal.querySelector('.close-button').onclick = () => { crudModal.style.display = 'none'; };
window.onclick = (event) => { if (event.target === crudModal || event.target === confirmModal) { event.target.style.display = 'none'; } };

crudForm.onsubmit = async (e) => {
    e.preventDefault();
    const sheetName = crudForm.getAttribute('data-sheet');
    const idField = FORM_DEFINITIONS[sheetName].find(f => f.isId);
    const existingId = idField ? crudForm.querySelector(`input[name="${idField.name}"]`)?.value : null;

    const isFixedSheet = ['kepala_halaman', 'banner', 'profil', 'struktur_organisasi'].includes(sheetName);
    
    let method = 'CREATE';
    let initialRecord = {};

    if (existingId || isFixedSheet) {
        method = 'UPDATE';
        if (idField && existingId) {
             initialRecord = currentSheetData[sheetName].find(r => r[idField.name] === existingId) || {};
        } else if (isFixedSheet) {
             initialRecord = currentSheetData[sheetName][0] || {};
        }
    }
    
    await handleFormSubmit(sheetName, method, initialRecord);
};

window.onpopstate = (event) => {
    const page = (event.state && event.state.page) ? event.state.page : 'home';
    loadPage(page);
};

document.addEventListener('DOMContentLoaded', () => {
    const initialPage = window.location.hash.replace('#', '') || 'home';
    loadPage(initialPage);
    history.replaceState({ page: initialPage }, '', `#${initialPage}`);
});
