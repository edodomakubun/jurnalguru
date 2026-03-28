// ================= PENGATURAN KONEKSI (UBAH URL INI) =================
const API_URL = "YOUR_WEB_APP_URL_HERE"; 
const SECRET_TOKEN = "GAS_MASTER_PRO_2026_NASIONAL"; // Harus sama dengan di Backend

let currentUser = JSON.parse(localStorage.getItem('userEJournal')) || null;

// ================= FUNGSI KURIR API (CORS SAFE) =================
// Menggunakan text/plain agar browser tidak mengirim request preflight (OPTIONS) yang diblokir GAS
async function fetchAPI(action, payloadData = {}) {
  const requestBody = {
    secretToken: SECRET_TOKEN,
    action: action,
    ...payloadData
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Trik anti-CORS GAS
      body: JSON.stringify(requestBody)
    });
    return await response.json();
  } catch (error) {
    throw new Error('Koneksi ke Markas Pusat (GAS) Terputus!');
  }
}

// ================= LOGIKA LOGIN =================
window.onload = () => { if(currentUser) bangunDashboard(); }

async function prosesLogin() {
  const id = document.getElementById('userId').value;
  const pin = document.getElementById('pin').value;
  if(!id || !pin) return Swal.fire('Peringatan', 'Isi ID dan PIN!', 'warning');
  
  Swal.fire({ title: 'Menghubungi Pusat...', didOpen: () => Swal.showLoading() });

  try {
    const res = await fetchAPI('login', { userId: id, pin: pin });
    if(res.status === 'success') {
      Swal.close();
      currentUser = res;
      localStorage.setItem('userEJournal', JSON.stringify(res)); // Simpan sesi
      bangunDashboard();
    } else {
      Swal.fire('Gagal', res.message, 'error');
    }
  } catch(err) { Swal.fire('Error', err.message, 'error'); }
}

function logout() {
  localStorage.removeItem('userEJournal');
  location.reload();
}

// ================= MEMBANGUN UI DASHBOARD SECARA DINAMIS =================
function bangunDashboard() {
  const appRoot = document.getElementById('appRoot');
  
  const menuHTML = currentUser.role === 'GURU' 
    ? `<li><button onclick="bukaHalaman('form')" class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-gray-600 hover:bg-blue-50"><i class="fa-solid fa-pen-to-square w-5"></i> Isi Jurnal</button></li>
       <li><button onclick="bukaHalaman('riwayat')" class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-gray-600 hover:bg-blue-50"><i class="fa-solid fa-clock-rotate-left w-5"></i> Riwayat Saya</button></li>`
    : `<li><button onclick="bukaHalaman('admin')" class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-indigo-600 bg-indigo-50 font-bold"><i class="fa-solid fa-chart-line w-5"></i> Monitor Jurnal</button></li>`;

  appRoot.innerHTML = `
    <aside id="sidebar" class="hidden md:flex w-64 bg-white shadow-xl flex-col justify-between h-full z-40 absolute md:relative">
      <div>
        <div class="p-6 border-b flex items-center gap-3"><div class="bg-blue-600 text-white p-2 rounded-lg"><i class="fa-solid fa-book-open"></i></div><h1 class="text-xl font-bold">E-Jurnal</h1></div>
        <div class="p-4"><ul class="space-y-2">${menuHTML}</ul></div>
      </div>
      <div class="p-4 border-t bg-gray-50">
        <div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">${currentUser.nama.charAt(0)}</div><div><p class="text-sm font-bold">${currentUser.nama}</p><p class="text-xs text-gray-500">${currentUser.role}</p></div></div>
        <button onclick="logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 rounded-lg"><i class="fa-solid fa-power-off mr-2"></i> Keluar</button>
      </div>
    </aside>
    <main class="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 relative">
      <header class="bg-white shadow-sm p-4 flex justify-between items-center md:hidden sticky top-0 z-30"><h1 class="text-lg font-bold"><i class="fa-solid fa-book-open text-blue-600 mr-2"></i> E-Jurnal</h1><button onclick="document.getElementById('sidebar').classList.toggle('hidden')"><i class="fa-solid fa-bars text-xl"></i></button></header>
      <div class="p-6 md:p-10 w-full fade-in" id="contentArea"></div>
    </main>
  `;
  
  bukaHalaman(currentUser.role === 'GURU' ? 'form' : 'admin');
}

// Mengelola Pergantian Halaman & Kompresi Foto (Kode Logika Frontend lainnya)
// Karena keterbatasan layar text, struktur HTML formnya saya sisipkan langsung ke JS:

function bukaHalaman(tipe) {
  const content = document.getElementById('contentArea');
  if(window.innerWidth < 768) document.getElementById('sidebar').classList.add('hidden');
  
  if (tipe === 'form') {
    content.innerHTML = `
      <h2 class="text-2xl font-bold mb-6">Tulis Jurnal Harian</h2>
      <div class="bg-white rounded-xl shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" id="fTanggal" class="p-3 border rounded focus:ring-2 focus:ring-blue-500 w-full" title="Tanggal">
          <input type="text" id="fTahunAjaran" placeholder="Tahun Ajaran (2025/2026)" class="p-3 border rounded w-full">
          <select id="fBulan" class="p-3 border rounded w-full"><option value="Januari">Januari</option><option value="Februari">Februari</option><option value="Maret">Maret</option></select>
          <input type="text" id="fKelas" placeholder="Kelas" class="p-3 border rounded w-full">
          <input type="number" id="fVolume" placeholder="Volume (JP)" class="p-3 border rounded w-full">
          <select id="fNonTatapMuka" class="p-3 border rounded w-full"><option value="Tatap Muka">Tatap Muka</option><option value="Daring">Daring</option></select>
          <textarea id="fCP" placeholder="Capaian Pembelajaran" class="p-3 border rounded w-full md:col-span-2"></textarea>
          <textarea id="fTP" placeholder="Tujuan Pembelajaran" class="p-3 border rounded w-full md:col-span-2"></textarea>
          <textarea id="fKeterangan" placeholder="Keterangan / Presensi" class="p-3 border rounded w-full md:col-span-2"></textarea>
          <div class="md:col-span-2 border-2 border-dashed p-4 text-center">
            <label>Unggah Foto (Maks 6)</label>
            <input type="file" id="fFoto" accept="image/*" multiple class="block w-full mt-2">
          </div>
        </div>
        <button onclick="submitJurnal()" id="btnSubmit" class="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl"><i class="fa-solid fa-paper-plane"></i> Kirim Laporan</button>
      </div>
    `;
  } else if (tipe === 'riwayat') {
    content.innerHTML = `<h2 class="text-2xl font-bold mb-4">Riwayat Anda</h2><div class="bg-white rounded-xl shadow overflow-x-auto p-4"><table class="w-full text-sm text-left"><thead class="border-b"><tr><th>Tgl</th><th>Kelas</th><th>CP</th><th>Ket</th></tr></thead><tbody id="tbRiwayat"><tr><td colspan="4">Memuat...</td></tr></tbody></table></div>`;
    muatRiwayat();
  } else if (tipe === 'admin') {
    content.innerHTML = `<h2 class="text-2xl font-bold mb-4">Dashboard Admin</h2><div class="bg-white rounded-xl shadow overflow-x-auto p-4"><table class="w-full text-sm text-left"><thead class="border-b"><tr><th>Guru</th><th>Tgl</th><th>Kelas</th><th>CP</th></tr></thead><tbody id="tbAdmin"><tr><td colspan="4">Memuat...</td></tr></tbody></table></div>`;
    muatAdmin();
  }
}

// FUNGSI GURU
async function submitJurnal() {
  const tgl = document.getElementById('fTanggal').value;
  if(!tgl) return Swal.fire('Oops', 'Tanggal wajib diisi!', 'warning');
  
  document.getElementById('btnSubmit').innerText = 'Memproses...';
  
  // Fungsi kompresi gambar (Sama seperti sebelumnya)
  const fileInput = document.getElementById('fFoto');
  let fotoDataArray = [];
  if (fileInput.files.length > 0) {
    for(let i=0; i<Math.min(fileInput.files.length, 6); i++) {
      let b64 = await compress(fileInput.files[i]);
      fotoDataArray.push({ name: fileInput.files[i].name, mimeType: fileInput.files[i].type, data: b64 });
    }
  }

  const payload = {
    userId: currentUser.userId, tanggal: tgl, bulan: document.getElementById('fBulan').value, tahunAjaran: document.getElementById('fTahunAjaran').value, cp: document.getElementById('fCP').value, tp: document.getElementById('fTP').value, kelas: document.getElementById('fKelas').value, nonTatapMuka: document.getElementById('fNonTatapMuka').value, volume: document.getElementById('fVolume').value, keterangan: document.getElementById('fKeterangan').value, fotoData: fotoDataArray
  };

  try {
    const res = await fetchAPI('simpanJurnal', { data: payload });
    if(res.status === 'success') { Swal.fire('Sukses', 'Jurnal terkirim!', 'success'); bukaHalaman('form'); }
    else { Swal.fire('Error', res.message, 'error'); document.getElementById('btnSubmit').innerText = 'Kirim Laporan'; }
  } catch(err) { Swal.fire('Error', err.message, 'error'); }
}

function compress(file) {
  return new Promise((res) => { const r = new FileReader(); r.onload = e => { const i = new Image(); i.onload = () => { const cvs = document.createElement('canvas'); cvs.width = 800; cvs.height = i.height * (800/i.width); const ctx = cvs.getContext('2d'); ctx.drawImage(i, 0, 0, cvs.width, cvs.height); res(cvs.toDataURL('image/jpeg', 0.6).split(',')[1]); }; i.src = e.target.result; }; r.readAsDataURL(file); });
}

async function muatRiwayat() {
  const tb = document.getElementById('tbRiwayat');
  try {
    const res = await fetchAPI('getRiwayatGuru', { userId: currentUser.userId });
    tb.innerHTML = '';
    if(res.data.length === 0) return tb.innerHTML = '<tr><td colspan="4">Kosong</td></tr>';
    res.data.forEach(b => tb.innerHTML += `<tr class="border-b"><td>${b[1]}</td><td>${b[6]}</td><td class="truncate max-w-xs">${b[4]}</td><td>${b[15]}</td></tr>`);
  } catch(e) { tb.innerHTML = `<tr><td colspan="4" class="text-red-500">${e.message}</td></tr>`; }
}

async function muatAdmin() {
  const tb = document.getElementById('tbAdmin');
  try {
    const res = await fetchAPI('getDataAdmin');
    tb.innerHTML = '';
    if(res.data.length === 0) return tb.innerHTML = '<tr><td colspan="4">Kosong</td></tr>';
    res.data.forEach(b => tb.innerHTML += `<tr class="border-b font-bold"><td>${b[0]}</td><td>${b[2]}</td><td>${b[7]}</td><td class="truncate max-w-xs font-normal">${b[5]}</td></tr>`);
  } catch(e) { tb.innerHTML = `<tr><td colspan="4" class="text-red-500">${e.message}</td></tr>`; }
}
