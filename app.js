// ============================================================
// IPANI - Umrah 2026 | app.js
// Frontend untuk GitHub Pages — memanggil GAS sebagai REST API
// ============================================================

// *** GANTI URL INI dengan URL deployment GAS Anda ***
// Cara mendapat URL: GAS → Deploy → Manage deployments → copy Web app URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzrfoZFD5ZwLUytNQ1g5oi6I9D6tHbG8eKj11dux_eEf9IuQpj9qKM8S32JZTaCEG7W/exec';

// ---- API Helper ----
async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// ---- State ----
let currentUser = null;
let pesertaData = [];
let editingId = null;

// ---- MOBILE VIEWPORT FIX ----
(function fixViewport() {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isMobile) {
    let vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1.0, shrink-to-fit=no');
    document.documentElement.style.width = '100%';
    document.documentElement.style.maxWidth = '100%';
    document.documentElement.style.overflowX = 'hidden';
  }
})();

// ---- INIT ----
window.onload = function () {
  const saved = sessionStorage.getItem('ipaniUser');
  if (saved) currentUser = JSON.parse(saved);

  setTimeout(() => {
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      if (currentUser) showDashboard();
      else document.getElementById('authSection').classList.remove('hidden');
    }, 600);
  }, 2000);

  ['loginUsername', 'loginPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  });

  ['regUsername', 'regPassword', 'regPassword2'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doRegister();
    });
  });
};

// ---- HELPERS ----
function showMsg(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.className = 'auth-msg ' + type;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => { el.textContent = ''; }, 4000);
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

function showLoading(text = 'Memproses...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function fmtRp(n) {
  if (!n || isNaN(n)) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  btn.innerHTML = isText ? '<i class="fa fa-eye"></i>' : '<i class="fa fa-eye-slash"></i>';
}

function initial(nama) {
  if (!nama) return '?';
  return nama.trim().charAt(0).toUpperCase();
}

// ---- AUTH ----
function switchTab(tab) {
  document.getElementById('formLogin').classList.toggle('hidden', tab !== 'login');
  document.getElementById('formRegister').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

async function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) return showMsg('loginMsg', 'Username dan password wajib diisi.');
  showLoading('Masuk...');
  try {
    const res = await apiPost({ action: 'login', username, password });
    hideLoading();
    if (res.success) {
      currentUser = res.user;
      sessionStorage.setItem('ipaniUser', JSON.stringify(currentUser));
      showDashboard();
    } else {
      showMsg('loginMsg', res.message || 'Login gagal.');
    }
  } catch (e) {
    hideLoading();
    showMsg('loginMsg', 'Error koneksi: ' + e.message);
  }
}

async function doRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const p1 = document.getElementById('regPassword').value;
  const p2 = document.getElementById('regPassword2').value;
  if (!username) return showMsg('registerMsg', 'Username wajib diisi.');
  if (username.length < 4) return showMsg('registerMsg', 'Username minimal 4 karakter.');
  if (!p1 || p1.length < 6) return showMsg('registerMsg', 'Password minimal 6 karakter.');
  if (p1 !== p2) return showMsg('registerMsg', 'Konfirmasi password tidak cocok.');
  showLoading('Mendaftar...');
  try {
    const res = await apiPost({ action: 'register', username, password: p1, role: 3 });
    hideLoading();
    if (res.success) {
      showMsg('registerMsg', 'Berhasil! Silakan masuk.', 'success');
      setTimeout(() => switchTab('login'), 1500);
    } else {
      showMsg('registerMsg', res.message || 'Gagal.');
    }
  } catch (e) {
    hideLoading();
    showMsg('registerMsg', 'Error koneksi: ' + e.message);
  }
}

function logout() {
  currentUser = null;
  pesertaData = [];
  editingId = null;
  sessionStorage.removeItem('ipaniUser');
  document.getElementById('dashSection').classList.add('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginMsg').textContent = '';
  document.getElementById('registerMsg').textContent = '';
  switchTab('login');
  document.getElementById('authSection').classList.remove('hidden');
}

// ---- SIDEBAR ----
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth <= 768) {
    const isOpen = sb.classList.contains('open');
    sb.classList.toggle('open', !isOpen);
    overlay.classList.toggle('show', !isOpen);
  } else {
    const isCollapsed = sb.classList.contains('collapsed');
    sb.classList.toggle('collapsed', !isCollapsed);
    document.querySelector('.dash-main').classList.toggle('expanded', !isCollapsed);
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ---- DASHBOARD ----
function showDashboard() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('dashSection').classList.remove('hidden');
  const role = currentUser.role;
  document.getElementById('topbarUsername').textContent = currentUser.username;
  document.getElementById('topbarRole').textContent = role == 1 ? 'Admin' : role == 2 ? 'Keuangan' : 'User';
  if (role == 1 || role == 2) document.getElementById('menuKeuangan').classList.remove('hidden');
  loadRekap();
  loadPeserta();
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const pageEl = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
  if (pageEl) { pageEl.classList.remove('hidden'); pageEl.classList.add('active'); }
  const menuEl = document.getElementById('menu' + page.charAt(0).toUpperCase() + page.slice(1));
  if (menuEl) menuEl.classList.add('active');
  const titles = { dashboard: 'Dashboard', peserta: 'Data Peserta', keuangan: 'Keuangan' };
  document.getElementById('topbarTitle').textContent = titles[page] || page;
  if (page === 'keuangan') loadKeuangan();
  if (page === 'peserta') loadPeserta();
  closeSidebar();
}

// ---- REKAP ----
async function loadRekap() {
  try {
    const res = await apiGet({ action: 'getRekap' });
    if (!res.success) return;
    document.getElementById('statTotalPeserta').textContent = res.totalPeserta;
    document.getElementById('statLunasPanjar').textContent = res.countPanjar + ' org';
    document.getElementById('statTotalPanjar').textContent = fmtRp(res.lunasPanjar);
    document.getElementById('statLunasPelunasan').textContent = res.countPelunasan + ' org';
    document.getElementById('statTotalPelunasan').textContent = fmtRp(res.lunasPelunasan);
    const tbody = document.getElementById('rekapTableBody');
    tbody.innerHTML = `
      <tr>
        <td><strong>Uang Panjar</strong></td>
        <td><span class="badge badge-info">${res.countPanjar} lunas</span></td>
        <td>${fmtRp(res.lunasPanjar)}</td>
        <td>${fmtRp(res.totalPanjar)}</td>
      </tr>
      <tr>
        <td><strong>Uang Pelunasan</strong></td>
        <td><span class="badge badge-success">${res.countPelunasan} lunas</span></td>
        <td>${fmtRp(res.lunasPelunasan)}</td>
        <td>${fmtRp(res.totalPelunasan)}</td>
      </tr>
      <tr style="font-weight:700;background:#f0f6ff">
        <td>TOTAL</td><td>—</td>
        <td>${fmtRp(res.lunasPanjar + res.lunasPelunasan)}</td>
        <td>${fmtRp(res.totalPanjar + res.totalPelunasan)}</td>
      </tr>`;
  } catch (e) {
    console.error('loadRekap error:', e);
  }
}

// ---- PESERTA ----
async function loadPeserta() {
  try {
    const res = await apiGet({ action: 'getPeserta', userId: currentUser.id, role: currentUser.role });
    if (!res.success) { showToast('Gagal memuat: ' + res.message, 'error'); return; }
    pesertaData = res.data;
    renderPeserta(pesertaData);
    loadNamaPesertaForCombo();
  } catch (e) {
    showToast('Error koneksi: ' + e.message, 'error');
  }
}

function renderPeserta(data) {
  renderPesertaTable(data);
  renderPesertaCards(data);
}

function renderPesertaTable(data) {
  const tbody = document.getElementById('pesertaTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="11"><div class="empty-state"><i class="fa fa-inbox"></i><p>Belum ada data peserta</p></div></td></tr>';
    return;
  }
  const role = currentUser.role;
  tbody.innerHTML = data.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${p.Nama || '-'}</strong></td>
      <td style="font-size:.78rem">${p['nomor ktp'] || '-'}</td>
      <td>${p['Daerah Asal'] || p.Daerah_Asal || '-'}</td>
      <td>${p.Jenis_Kelamin ? p.Jenis_Kelamin.charAt(0) : '-'}</td>
      <td>${p.status || '-'}</td>
      <td style="white-space:nowrap">${fmtRp(p.Uang_panjar)}</td>
      <td>${badgeStatus(p.StatusBayarPanjar)}</td>
      <td style="white-space:nowrap">${fmtRp(p.uang_pelunasan)}</td>
      <td>${badgeStatus(p.StatusBayarPelunasan)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-outline" onclick="openModalDetail('${p.id}')" title="Detail"><i class="fa fa-eye"></i></button>
          ${(role == 1 || role == 3) ? `<button class="btn-outline" onclick="openModalEdit('${p.id}')" title="Edit"><i class="fa fa-pen"></i></button>` : ''}
          ${role == 1 ? `<button class="btn-danger" onclick="konfirmHapus('${p.id}','${(p.Nama||'').replace(/'/g,"\\'")}')"><i class="fa fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

function renderPesertaCards(data) {
  const container = document.getElementById('pesertaCardList');
  const role = currentUser.role;
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa fa-inbox"></i><p>Belum ada data peserta</p></div>';
    return;
  }
  container.innerHTML = data.map((p, i) => `
    <div class="peserta-card">
      <div class="peserta-card-header">
        <div class="peserta-card-avatar">${initial(p.Nama)}</div>
        <div class="peserta-card-name">
          <strong>${p.Nama || '-'}</strong>
          <small>${p['Daerah Asal'] || p.Daerah_Asal || '-'}</small>
        </div>
        <span class="peserta-card-num">#${i + 1}</span>
      </div>
      <div class="peserta-card-body">
        <div class="peserta-card-row">
          <span class="lbl">No. KTP</span>
          <span class="val">${p['nomor ktp'] || '-'}</span>
        </div>
        <div class="peserta-card-row">
          <span class="lbl">J. Kelamin</span>
          <span class="val">${p.Jenis_Kelamin || '-'}</span>
        </div>
        <div class="peserta-card-row">
          <span class="lbl">Status</span>
          <span class="val">${p.status || '-'}</span>
        </div>
      </div>
      <div class="peserta-card-payment">
        <div class="payment-block">
          <span class="pb-label">Panjar</span>
          <span class="pb-amount">${fmtRp(p.Uang_panjar)}</span>
          ${badgeStatus(p.StatusBayarPanjar)}
        </div>
        <div class="payment-block">
          <span class="pb-label">Pelunasan</span>
          <span class="pb-amount">${fmtRp(p.uang_pelunasan)}</span>
          ${badgeStatus(p.StatusBayarPelunasan)}
        </div>
      </div>
      <div class="peserta-card-footer">
        <button class="btn-outline" onclick="openModalDetail('${p.id}')"><i class="fa fa-eye"></i> Detail</button>
        ${(role == 1 || role == 3) ? `<button class="btn-outline" onclick="openModalEdit('${p.id}')"><i class="fa fa-pen"></i> Edit</button>` : ''}
        ${role == 1 ? `<button class="btn-danger" onclick="konfirmHapus('${p.id}','${(p.Nama||'').replace(/'/g,"\\'")}')"><i class="fa fa-trash"></i> Hapus</button>` : ''}
      </div>
    </div>`).join('');
}

function badgeStatus(status) {
  if (!status || status === 'Belum Bayar') return '<span class="badge badge-danger">Belum Bayar</span>';
  if (status === 'Lunas') return '<span class="badge badge-success">Lunas</span>';
  return `<span class="badge badge-warning">${status}</span>`;
}

function filterPeserta() {
  const q = document.getElementById('searchPeserta').value.toLowerCase();
  const filtered = pesertaData.filter(p =>
    (p.Nama || '').toLowerCase().includes(q) ||
    (p['nomor ktp'] || '').includes(q) ||
    (p['Daerah Asal'] || p.Daerah_Asal || '').toLowerCase().includes(q)
  );
  renderPeserta(filtered);
}

function loadNamaPesertaForCombo() {
  const sel = document.getElementById('pHubunganAlumni');
  sel.innerHTML = '<option value="">-- Pilih Mahram --</option>';
  pesertaData.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.Nama; opt.textContent = p.Nama;
    sel.appendChild(opt);
  });
}

// ---- MODAL TAMBAH/EDIT ----
function openModalTambah() {
  editingId = null;
  resetForm();
  document.getElementById('modalPesertaTitle').innerHTML = '<i class="fa fa-user-plus"></i> Tambah Peserta';
  document.getElementById('btnSimpanPeserta').innerHTML = '<i class="fa fa-save"></i> Simpan';
  setUploadEnabled(false);
  document.getElementById('modalPeserta').classList.remove('hidden');
  document.getElementById('modalPeserta').scrollTop = 0;
}

function openModalEdit(id) {
  editingId = id;
  const p = pesertaData.find(x => x.id === id);
  if (!p) return;
  resetForm();
  document.getElementById('pNama').value = p.Nama || '';
  document.getElementById('pNoKtp').value = p['nomor ktp'] || '';
  document.getElementById('pDaerah').value = p['Daerah Asal'] || p.Daerah_Asal || '';
  document.getElementById('pAlamat').value = p.Alamat || '';
  document.getElementById('pJK').value = p.Jenis_Kelamin || '';
  document.getElementById('pStatus').value = p.status || '';
  document.getElementById('pAlumni').value = p.alumni || '';
  document.getElementById('pHubunganAlumni').value = p.Hubungan_alumni || '';
  document.getElementById('pUangPanjar').value = p.Uang_panjar || '';
  document.getElementById('pUangPelunasan').value = p.uang_pelunasan || '';
  setUploadEnabled(p.StatusBayarPanjar === 'Lunas');
  document.getElementById('modalPesertaTitle').innerHTML = '<i class="fa fa-pen"></i> Edit Peserta';
  document.getElementById('btnSimpanPeserta').innerHTML = '<i class="fa fa-save"></i> Update';
  document.getElementById('modalPeserta').classList.remove('hidden');
}

function setUploadEnabled(enabled) {
  ['uploadKTPArea','uploadKKArea','uploadPassportArea','uploadPelunasanArea'].forEach(a => {
    document.getElementById(a).classList.toggle('disabled', !enabled);
  });
  ['fileFotoKTP','fileFotoKK','fileFotoPassport','fileBuktiPelunasan'].forEach(i => {
    document.getElementById(i).disabled = !enabled;
  });
  document.getElementById('uploadLockIcon').className = enabled ? 'fa fa-unlock-alt' : 'fa fa-lock';
  document.getElementById('uploadSectionTitle').textContent = enabled
    ? 'Upload Dokumen' : 'Dokumen (Tersedia setelah panjar dikonfirmasi Lunas)';
}

function resetForm() {
  ['pNama','pNoKtp','pDaerah','pAlamat','pJK','pStatus','pAlumni','pHubunganAlumni','pUangPanjar','pUangPelunasan'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['fileBuktiPanjar','fileFotoKTP','fileFotoKK','fileFotoPassport','fileBuktiPelunasan'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['previewPanjar','previewKTP','previewKK','previewPassport','previewPelunasan'].forEach(id => {
    const el = document.getElementById(id); if (el) el.classList.add('hidden');
  });
  document.getElementById('modalPesertaMsg').textContent = '';
}

function handleFileSelect(input, areaId, previewId) {
  const file = input.files[0]; if (!file) return;
  const preview = document.getElementById(previewId);
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}"><span>${file.name}</span>`;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<i class="fa fa-file-pdf" style="color:var(--red)"></i><span>${file.name}</span>`;
    preview.classList.remove('hidden');
  }
}

async function simpanPeserta() {
  const nama = document.getElementById('pNama').value.trim();
  const noKtp = document.getElementById('pNoKtp').value.trim();
  if (!nama) return showMsg('modalPesertaMsg', 'Nama wajib diisi.');
  if (!noKtp) return showMsg('modalPesertaMsg', 'Nomor KTP wajib diisi.');

  showLoading('Menyimpan data...');
  const fileFields = [
    { inputId: 'fileBuktiPanjar', field: 'Bukti_Panjar' },
    { inputId: 'fileFotoKTP', field: 'foto_KTP' },
    { inputId: 'fileFotoKK', field: 'foto_KK' },
    { inputId: 'fileFotoPassport', field: 'foto_Pasport' },
    { inputId: 'fileBuktiPelunasan', field: 'bukti_pelunasan' }
  ];
  const uploadedFiles = {};
  for (const ff of fileFields) {
    const input = document.getElementById(ff.inputId);
    if (input.files.length > 0) {
      const file = input.files[0];
      try {
        const b64 = await fileToBase64(file);
        const result = await apiPost({ action: 'uploadFileToDrive', base64Data: b64, fileName: file.name, mimeType: file.type });
        if (result.success) uploadedFiles[ff.field] = result.fileUrl;
      } catch (e) {
        hideLoading();
        showMsg('modalPesertaMsg', 'Gagal upload: ' + e.message);
        return;
      }
    }
  }

  const peserta = {
    'nomor ktp': noKtp, Nama: nama,
    'Daerah Asal': document.getElementById('pDaerah').value.trim(),
    Alamat: document.getElementById('pAlamat').value.trim(),
    Jenis_Kelamin: document.getElementById('pJK').value,
    status: document.getElementById('pStatus').value.trim(),
    alumni: document.getElementById('pAlumni').value.trim(),
    Hubungan_alumni: document.getElementById('pHubunganAlumni').value,
    Uang_panjar: document.getElementById('pUangPanjar').value || 0,
    uang_pelunasan: document.getElementById('pUangPelunasan').value || 0,
    ...uploadedFiles
  };

  try {
    if (editingId) {
      for (const [field, value] of Object.entries(peserta)) {
        await apiPost({ action: 'updatePeserta', id: editingId, field, value });
      }
      hideLoading();
      closeModal('modalPeserta');
      showToast('Data peserta diperbarui!', 'success');
      loadPeserta(); loadRekap();
    } else {
      const res = await apiPost({ action: 'tambahPeserta', peserta, userId: currentUser.id });
      hideLoading();
      if (res.success) {
        closeModal('modalPeserta');
        showToast('Peserta ditambahkan!', 'success');
        loadPeserta(); loadRekap();
      } else {
        showMsg('modalPesertaMsg', res.message || 'Gagal menyimpan.');
      }
    }
  } catch (e) {
    hideLoading();
    showMsg('modalPesertaMsg', 'Error koneksi: ' + e.message);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = () => reject(new Error('Gagal membaca file'));
    r.readAsDataURL(file);
  });
}

// ---- DETAIL ----
function openModalDetail(id) {
  const p = pesertaData.find(x => x.id === id); if (!p) return;
  const docLink = (url, label, icon) => url
    ? `<a class="doc-link" href="${url}" target="_blank"><i class="fa fa-${icon}"></i>${label}</a>`
    : `<span class="doc-link" style="opacity:.4"><i class="fa fa-${icon}"></i>${label}</span>`;

  document.getElementById('modalDetailBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Nama</div><div class="detail-value">${p.Nama||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">No. KTP</div><div class="detail-value">${p['nomor ktp']||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Jenis Kelamin</div><div class="detail-value">${p.Jenis_Kelamin||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Daerah Asal</div><div class="detail-value">${p['Daerah Asal']||p.Daerah_Asal||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Alamat</div><div class="detail-value">${p.Alamat||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Status Nikah</div><div class="detail-value">${p.status||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Alumni</div><div class="detail-value">${p.alumni||'-'}</div></div>
      <div class="detail-item"><div class="detail-label">Mahram</div><div class="detail-value">${p.Hubungan_alumni||'-'}</div></div>
    </div>
    <div class="detail-section">
      <h4><i class="fa fa-money-bill-wave" style="color:var(--blue);margin-right:.4rem"></i>Pembayaran</h4>
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">Uang Panjar</div><div class="detail-value">${fmtRp(p.Uang_panjar)}</div></div>
        <div class="detail-item"><div class="detail-label">Status Panjar</div><div class="detail-value">${badgeStatus(p.StatusBayarPanjar)}</div></div>
        <div class="detail-item"><div class="detail-label">Uang Pelunasan</div><div class="detail-value">${fmtRp(p.uang_pelunasan)}</div></div>
        <div class="detail-item"><div class="detail-label">Status Pelunasan</div><div class="detail-value">${badgeStatus(p.StatusBayarPelunasan)}</div></div>
      </div>
    </div>
    <div class="detail-section">
      <h4><i class="fa fa-folder-open" style="color:var(--blue);margin-right:.4rem"></i>Dokumen</h4>
      <div class="doc-grid">
        ${docLink(p.Bukti_Panjar,'Bukti Panjar','receipt')}
        ${docLink(p.foto_KTP,'Foto KTP','id-card')}
        ${docLink(p.foto_KK,'Kartu Keluarga','home')}
        ${docLink(p.foto_Pasport,'Passport','passport')}
        ${docLink(p.bukti_pelunasan,'Bukti Pelunasan','file-invoice')}
      </div>
    </div>`;
  document.getElementById('modalDetail').classList.remove('hidden');
}

async function konfirmHapus(id, nama) {
  if (!confirm(`Hapus peserta "${nama}"?`)) return;
  showLoading('Menghapus...');
  try {
    const res = await apiPost({ action: 'hapusPeserta', id });
    hideLoading();
    if (res.success) { showToast('Peserta dihapus.', 'success'); loadPeserta(); loadRekap(); }
    else showToast('Gagal: ' + res.message, 'error');
  } catch (e) {
    hideLoading();
    showToast('Error: ' + e.message, 'error');
  }
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ---- KEUANGAN ----
async function loadKeuangan() {
  try {
    const res = await apiGet({ action: 'getRekap' });
    if (res.success) {
      document.getElementById('keuanganStats').innerHTML = `
        <div class="stat-card blue"><div class="stat-icon"><i class="fa fa-users"></i></div>
          <div class="stat-info"><span class="stat-num">${res.totalPeserta}</span><span class="stat-label">Total Peserta</span></div></div>
        <div class="stat-card red"><div class="stat-icon"><i class="fa fa-money-bill-wave"></i></div>
          <div class="stat-info"><span class="stat-num">${fmtRp(res.lunasPanjar)}</span><span class="stat-label">Panjar Masuk</span></div></div>
        <div class="stat-card white"><div class="stat-icon"><i class="fa fa-check-circle"></i></div>
          <div class="stat-info"><span class="stat-num">${fmtRp(res.lunasPelunasan)}</span><span class="stat-label">Pelunasan Masuk</span></div></div>
        <div class="stat-card blue"><div class="stat-icon"><i class="fa fa-coins"></i></div>
          <div class="stat-info"><span class="stat-num">${fmtRp(res.lunasPanjar+res.lunasPelunasan)}</span><span class="stat-label">Total Masuk</span></div></div>`;
    }
  } catch (e) { console.error(e); }

  try {
    const res = await apiGet({ action: 'getPeserta', userId: currentUser.id, role: 1 });
    if (!res.success) return;
    const data = res.data;
    const tbody = document.getElementById('keuanganTableBody');
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state"><i class="fa fa-inbox"></i><p>Belum ada data</p></div></td></tr>';
    } else {
      tbody.innerHTML = data.map((p, i) => `
        <tr>
          <td>${i+1}</td>
          <td><strong>${p.Nama||'-'}</strong></td>
          <td>${fmtRp(p.Uang_panjar)}</td>
          <td>${p.Bukti_Panjar?`<a href="${p.Bukti_Panjar}" target="_blank" class="btn-outline"><i class="fa fa-eye"></i></a>`:'<span style="color:var(--text-muted);font-size:.78rem">—</span>'}</td>
          <td>${badgeStatus(p.StatusBayarPanjar)}</td>
          <td>
            <div class="confirm-btns">
              <button class="btn-success" onclick="konfirmBayar('${p.id}','StatusBayarPanjar','Lunas')" ${p.StatusBayarPanjar==='Lunas'?'disabled':''}><i class="fa fa-check"></i> Lunas</button>
              <button class="btn-danger" onclick="konfirmBayar('${p.id}','StatusBayarPanjar','Belum Bayar')" ${p.StatusBayarPanjar!=='Lunas'?'disabled':''}><i class="fa fa-times"></i> Batal</button>
            </div>
          </td>
          <td>${fmtRp(p.uang_pelunasan)}</td>
          <td>${p.bukti_pelunasan?`<a href="${p.bukti_pelunasan}" target="_blank" class="btn-outline"><i class="fa fa-eye"></i></a>`:'<span style="color:var(--text-muted);font-size:.78rem">—</span>'}</td>
          <td>${badgeStatus(p.StatusBayarPelunasan)}</td>
          <td>
            <div class="confirm-btns">
              <button class="btn-success" onclick="konfirmBayar('${p.id}','StatusBayarPelunasan','Lunas')" ${p.StatusBayarPelunasan==='Lunas'||p.StatusBayarPanjar!=='Lunas'?'disabled':''}><i class="fa fa-check"></i> Lunas</button>
              <button class="btn-danger" onclick="konfirmBayar('${p.id}','StatusBayarPelunasan','Belum Bayar')" ${p.StatusBayarPelunasan!=='Lunas'?'disabled':''}><i class="fa fa-times"></i> Batal</button>
            </div>
          </td>
        </tr>`).join('');
    }

    const cardList = document.getElementById('keuanganCardList');
    if (!data.length) {
      cardList.innerHTML = '<div class="empty-state"><i class="fa fa-inbox"></i><p>Belum ada data</p></div>';
    } else {
      cardList.innerHTML = data.map((p, i) => `
        <div class="keu-card">
          <div class="keu-card-header">
            <strong>${p.Nama||'-'}</strong>
            <span>#${i+1}</span>
          </div>
          <div class="keu-section">
            <div class="keu-section-title"><i class="fa fa-money-bill-wave"></i> Panjar</div>
            <div class="keu-row"><span class="lbl">Jumlah</span><span class="val">${fmtRp(p.Uang_panjar)}</span></div>
            <div class="keu-row"><span class="lbl">Status</span><span class="val">${badgeStatus(p.StatusBayarPanjar)}</span></div>
            ${p.Bukti_Panjar ? `<div class="keu-row"><span class="lbl">Bukti</span><a href="${p.Bukti_Panjar}" target="_blank" class="btn-outline" style="font-size:.75rem"><i class="fa fa-eye"></i> Lihat</a></div>` : ''}
            <div class="keu-actions">
              <button class="btn-success" onclick="konfirmBayar('${p.id}','StatusBayarPanjar','Lunas')" ${p.StatusBayarPanjar==='Lunas'?'disabled':''}><i class="fa fa-check"></i> Konfirmasi Lunas</button>
              <button class="btn-danger" onclick="konfirmBayar('${p.id}','StatusBayarPanjar','Belum Bayar')" ${p.StatusBayarPanjar!=='Lunas'?'disabled':''}><i class="fa fa-undo"></i> Batalkan</button>
            </div>
          </div>
          <div class="keu-section">
            <div class="keu-section-title"><i class="fa fa-hand-holding-usd"></i> Pelunasan</div>
            <div class="keu-row"><span class="lbl">Jumlah</span><span class="val">${fmtRp(p.uang_pelunasan)}</span></div>
            <div class="keu-row"><span class="lbl">Status</span><span class="val">${badgeStatus(p.StatusBayarPelunasan)}</span></div>
            ${p.bukti_pelunasan ? `<div class="keu-row"><span class="lbl">Bukti</span><a href="${p.bukti_pelunasan}" target="_blank" class="btn-outline" style="font-size:.75rem"><i class="fa fa-eye"></i> Lihat</a></div>` : ''}
            <div class="keu-actions">
              <button class="btn-success" onclick="konfirmBayar('${p.id}','StatusBayarPelunasan','Lunas')" ${p.StatusBayarPelunasan==='Lunas'||p.StatusBayarPanjar!=='Lunas'?'disabled':''}><i class="fa fa-check"></i> Konfirmasi Lunas</button>
              <button class="btn-danger" onclick="konfirmBayar('${p.id}','StatusBayarPelunasan','Belum Bayar')" ${p.StatusBayarPelunasan!=='Lunas'?'disabled':''}><i class="fa fa-undo"></i> Batalkan</button>
            </div>
          </div>
        </div>`).join('');
    }
  } catch (e) {
    showToast('Error memuat keuangan: ' + e.message, 'error');
  }
}

async function konfirmBayar(id, field, status) {
  const label = field === 'StatusBayarPanjar' ? 'panjar' : 'pelunasan';
  const msg = status === 'Lunas' ? `Konfirmasi ${label} sebagai LUNAS?` : `Batalkan status lunas ${label}?`;
  if (!confirm(msg)) return;
  showLoading('Mengupdate...');
  try {
    const res = await apiPost({ action: 'updateStatusBayar', id, field, status });
    hideLoading();
    if (res.success) { showToast('Status diperbarui!', 'success'); loadKeuangan(); loadRekap(); }
    else showToast('Gagal: ' + res.message, 'error');
  } catch (e) {
    hideLoading();
    showToast('Error: ' + e.message, 'error');
  }
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// Resize handler
window.addEventListener('resize', function() {
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth > 768 && overlay) overlay.classList.remove('show');
});
