// ================= PENGATURAN KONEKSI (UBAH URL INI) =================
const API_URL = "https://script.google.com/macros/s/AKfycbxG3gloRxNZWcM8bk4xS0QE2RUNWgDJd9Y9tE7vSTf8wW5-0ci45q0ZFqvzybOo4awV/exec"; 
const SECRET_TOKEN = "GAS_MASTER_PRO_2026_NASIONAL"; // Harus sama dengan di Backend

let currentUser = JSON.parse(localStorage.getItem('userEJournal')) || null;

// ================= FETCH API KE GAS =================
async function fetchAPI(action, payloadData = {}) {
  const requestBody = { secretToken: SECRET_TOKEN, action: action, ...payloadData };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(requestBody)
    });
    return await response.json(); // Mengurai string JSON dari Google
  } catch (error) {
    throw new Error('Koneksi ke Server Pusat Terputus!');
  }
}

// ================= LOGIKA APLIKASI =================
window.onload = () => { if(currentUser) masukAplikasi(); }

async function prosesLogin() {
  const id = document.getElementById('userId').value;
  const pin = document.getElementById('pin').value;
  if(!id || !pin) return Swal.fire('Peringatan', 'Isi ID dan PIN!', 'warning');
  
  Swal.fire({ title: 'Otentikasi...', didOpen: () => Swal.showLoading() });

  try {
    const res = await fetchAPI('login', { userId: id, pin: pin });
    if(res.status === 'success') {
      Swal.close();
      currentUser = res;
      localStorage.setItem('userEJournal', JSON.stringify(res));
      masukAplikasi();
    } else { Swal.fire('Gagal', res.message, 'error'); }
  } catch(err) { Swal.fire('Error', err.message, 'error'); }
}

function masukAplikasi() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('sidebar').classList.add('flex');
  document.getElementById('mainContent').classList.remove('hidden');
  document.getElementById('mainContent').classList.add('flex');
  
  document.getElementById('userName').innerText = currentUser.nama;
  document.getElementById('userRole').innerText = `Role: ${currentUser.role}`;
  document.getElementById('userInitial').innerText = currentUser.nama.charAt(0);
  renderMenu();
}

function logout() { localStorage.removeItem('userEJournal'); location.reload(); }

function renderMenu() {
  const menuList = document.getElementById('menuList');
  menuList.innerHTML = '';
  if (currentUser.role === 'GURU') {
    menuList.innerHTML += `
      <li><button onclick="bukaHalaman('form-jurnal')" class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-gray-600 hover:bg-blue-50 font-medium"><i class="fa-solid fa-pen-to-square w-5"></i> Isi Jurnal</button></li>
      <li><button onclick="bukaHalaman('riwayat-guru')" class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-gray-600 hover:bg-blue-50 font-medium"><i class="fa-solid fa-clock-rotate-left w-5"></i> Riwayat Saya</button></li>
    `;
    bukaHalaman('form-jurnal');
  } else if (currentUser.role === 'ADMIN') {
    menuList.innerHTML += `<li><button onclick="bukaHalaman('dashboard-admin')" class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-indigo-600 bg-indigo-50 font-bold"><i class="fa-solid fa-chart-line w-5"></i> Monitor Jurnal</button></li>`;
    bukaHalaman('dashboard-admin');
  }
}

function bukaHalaman(halamanId) {
  document.getElementById('contentArea').innerHTML = document.getElementById(`tpl-${halamanId}`).innerHTML;
  if(halamanId === 'riwayat-guru') muatRiwayatGuru();
  if(halamanId === 'dashboard-admin') muatDataAdmin();
  if(window.innerWidth < 768) toggleSidebar(); 
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('hidden'); sb.classList.toggle('absolute'); sb.classList.toggle('h-full');
}

// ================= FITUR PENERJEMAH TANGGAL (UPDATE ZERO-PADDING 'dd') =================
function formatTanggalIndo(dateString) {
  const d = new Date(dateString);
  
  // Array kamus Hari dan Bulan
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  // Ekstraksi komponen waktu
  const namaHari = hari[d.getDay()];
  const namaBulan = bulan[d.getMonth()];
  const tahun = d.getFullYear();
  
  // KUNCI PERBAIKAN: Memaksa tanggal menjadi 2 digit (dd). Jika tanggal 5, menjadi 05.
  const tanggalLengkap = String(d.getDate()).padStart(2, '0');
  
  // Menggabungkan sesuai format pesanan: Hari, dd Bulan yyyy
  return `${namaHari}, ${tanggalLengkap} ${namaBulan} ${tahun}`;
}

function tampilkanPreview(inputElement) {
  const previewArea = document.getElementById('previewArea');
  previewArea.innerHTML = ''; 
  if(inputElement.files.length > 6) Swal.fire('Batas Terlampaui', 'Hanya 6 foto pertama yang akan diproses.', 'warning');

  const jumlah = Math.min(inputElement.files.length, 6);
  for(let i=0; i<jumlah; i++) {
    const file = inputElement.files[i];
    const reader = new FileReader();
    reader.onload = e => { previewArea.innerHTML += `<div class="relative w-20 h-20 rounded-lg overflow-hidden border shadow-sm"><img src="${e.target.result}" class="w-full h-full object-cover"></div>`; }
    reader.readAsDataURL(file);
  }
}

// ================= 1. FUNGSI SUBMIT (Ditambah Materi & PertemuanKe) =================
async function submitJurnal() {
  const rawTgl = document.getElementById('fTanggal').value;
  if(!rawTgl) return Swal.fire('Oops...', 'Tanggal wajib diisi!', 'warning');
  
  const btn = document.getElementById('btnSubmit');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sedang Mengompresi...';
  btn.disabled = true;

  const fileInput = document.getElementById('fFoto');
  let fotoDataArray = [];
  if (fileInput.files.length > 0) {
    const fileCount = Math.min(fileInput.files.length, 6);
    for(let i=0; i<fileCount; i++) {
      let base64 = await compressImage(fileInput.files[i]);
      fotoDataArray.push({ name: fileInput.files[i].name, mimeType: fileInput.files[i].type, data: base64.split(',')[1] });
    }
  }

  // Payload Baru Sesuai Form
  const payload = {
    userId: currentUser.userId, 
    tanggal: formatTanggalIndo(rawTgl), 
    bulan: document.getElementById('fBulan').value, 
    tahunAjaran: document.getElementById('fTahunAjaran').value, 
    materi: document.getElementById('fMateri').value, // Baru
    cp: document.getElementById('fCP').value, 
    tp: document.getElementById('fTP').value, 
    kelas: document.getElementById('fKelas').value, 
    nonTatapMuka: document.getElementById('fNonTatapMuka').value, 
    pertemuanKe: document.getElementById('fPertemuanKe').value, // Baru
    keterangan: document.getElementById('fKeterangan').value, 
    fotoData: fotoDataArray
  };

  btn.innerHTML = '<i class="fa-solid fa-satellite-dish fa-beat"></i> Mengirim Data...';

  try {
    const res = await fetchAPI('simpanJurnal', { data: payload });
    btn.disabled = false;
    if(res.status === 'success') {
      Swal.fire('Berhasil!', 'Jurnal harian tersimpan di Pusat.', 'success');
      bukaHalaman('form-jurnal');
    } else {
      Swal.fire('Terjadi Kesalahan', res.message, 'error');
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Laporan Jurnal';
    }
  } catch(err) {
    btn.disabled = false;
    Swal.fire('Error', err.message, 'error');
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Laporan Jurnal';
  }
}

// ================= 2. FUNGSI LIST RIWAYAT (Geser Indeks Kelas) =================
async function muatRiwayatGuru() {
  const listContainer = document.getElementById('listRiwayatContainer');
  const detailContainer = document.getElementById('detailRiwayatContainer');
  
  if(detailContainer) detailContainer.classList.add('hidden');
  if(listContainer) {
    listContainer.classList.remove('hidden');
    listContainer.innerHTML = `<div class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl mb-2"></i><br>Membaca Arsip <b>${currentUser.userId}</b>...</div>`;
  }

  try {
    const res = await fetchAPI('getRiwayatGuru', { userId: currentUser.userId });
    if (res.status === 'error') return listContainer.innerHTML = `<div class="text-center py-10 text-red-500 font-bold">${res.message}</div>`;
    if (!res.data || res.data.length === 0) return listContainer.innerHTML = '<div class="text-center py-10 text-gray-400 font-medium">Anda belum memiliki riwayat jurnal.</div>';
    
    riwayatDataLokal = res.data; 
    
    let listHTML = '<ul class="divide-y divide-gray-100">';
    riwayatDataLokal.forEach((baris, index) => {
      // PERHATIAN: Indeks Kelas sekarang bergeser ke-7 karena ada Materi (di indeks 4)
      listHTML += `
        <li class="p-4 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group" onclick="bukaDetailRiwayat(${index})">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i class="fa-solid fa-file-lines"></i></div>
            <div>
              <p class="text-md font-bold text-gray-800 group-hover:text-blue-600 transition">${baris[0] || '-'}</p>
              <p class="text-xs text-gray-500 font-medium"><i class="fa-regular fa-calendar mr-1"></i> ${baris[1] || '-'} • Kelas: ${baris[7] || '-'}</p>
            </div>
          </div>
          <div class="text-gray-300 group-hover:text-blue-500 transition"><i class="fa-solid fa-chevron-right"></i></div>
        </li>
      `;
    });
    listHTML += '</ul>';
    listContainer.innerHTML = listHTML;

  } catch(err) { listContainer.innerHTML = `<div class="text-center py-10 text-red-500 font-bold">${err.message}</div>`; }
}

// ================= 3. FUNGSI DETAIL RIWAYAT (17 Kolom) =================

// KACAMATA PINTAR (Wajib ada agar tidak ReferenceError)
function ubahUrlDriveKeGambar(url) {
  if (!url) return '';
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  }
  return url; 
}

// Fungsi Buka Detail
function bukaDetailRiwayat(index) {
  const data = riwayatDataLokal[index];
  const listContainer = document.getElementById('listRiwayatContainer');
  const detailContainer = document.getElementById('detailRiwayatContainer');
  
  listContainer.classList.add('hidden');
  detailContainer.classList.remove('hidden');

  let fotoHTML = '';
  // Loop Foto di Indeks 9 sampai 14
  for(let i = 9; i <= 14; i++) {
    if(data[i] && data[i].trim() !== '') {
      // Memanggil fungsi kacamata pintar di sini
      const gambarLangsung = ubahUrlDriveKeGambar(data[i]);
      
      fotoHTML += `
        <div class="aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm relative group cursor-pointer" onclick="window.open('${data[i]}', '_blank')">
          <img src="${gambarLangsung}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.onerror=null; this.src='https://placehold.co/400x400?text=Gagal+Muat';">
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center"><i class="fa-solid fa-magnifying-glass text-white opacity-0 group-hover:opacity-100 text-2xl drop-shadow-md"></i></div>
        </div>`;
    }
  }
  if(fotoHTML === '') fotoHTML = '<p class="text-sm text-gray-400 italic col-span-full">Tidak ada lampiran foto untuk laporan ini.</p>';

  detailContainer.innerHTML = `
    <div class="mb-6 flex justify-between items-start border-b border-gray-100 pb-4">
       <div>
         <h3 class="text-2xl font-bold text-gray-800">Detail Riwayat Jurnal</h3>
         <p class="text-sm text-gray-500 mt-1">ID Laporan : <span class="font-mono text-blue-600 font-bold">${data[0]}</span></p>
       </div>
       <button onclick="kembaliKeList()" class="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"><i class="fa-solid fa-arrow-left mr-1"></i> Kembali</button>
    </div>

    <div class="space-y-8">
      <div>
        <h4 class="text-lg font-bold text-gray-800 mb-4 border-l-4 border-indigo-500 pl-3">Data Waktu</h4>
        <div class="grid grid-cols-[140px_10px_1fr] gap-y-3 text-sm text-gray-700 ml-2">
          <div class="font-medium">Tanggal</div><div>:</div><div class="font-semibold">${data[1]}</div>
          <div class="font-medium">Bulan</div><div>:</div><div>${data[2]}</div>
          <div class="font-medium">Tahun Ajaran</div><div>:</div><div>${data[3]}</div>
        </div>
      </div>

      <div>
        <h4 class="text-lg font-bold text-gray-800 mb-4 border-l-4 border-indigo-500 pl-3">Data Pelajaran</h4>
        <div class="grid grid-cols-[140px_10px_1fr] gap-y-3 text-sm text-gray-700 ml-2">
          <div class="font-medium">Kelas</div><div>:</div><div class="font-semibold">${data[7]}</div>
          <div class="font-medium">Materi</div><div>:</div><div class="whitespace-pre-wrap leading-relaxed font-bold text-gray-800">${data[4]}</div>
          <div class="font-medium">Capaian (CP)</div><div>:</div><div class="whitespace-pre-wrap leading-relaxed">${data[5]}</div>
          <div class="font-medium">Tujuan (TP)</div><div>:</div><div class="whitespace-pre-wrap leading-relaxed">${data[6]}</div>
          <div class="font-medium">Mode</div><div>:</div><div>${data[8]}</div>
          <div class="font-medium">Pertemuan Ke</div><div>:</div><div><span class="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded">${data[15] || '-'}</span></div>
          <div class="font-medium">Keterangan</div><div>:</div><div class="whitespace-pre-wrap text-red-500 font-medium">${data[16] || '-'}</div>
        </div>
      </div>

      <div>
        <h4 class="text-lg font-bold text-gray-800 mb-4 border-l-4 border-indigo-500 pl-3">Lampiran Foto</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 ml-2">
          ${fotoHTML}
        </div>
      </div>
    </div>
  `;
}

// Fungsi Navigasi Kembali
function kembaliKeList() {
  document.getElementById('listRiwayatContainer').classList.remove('hidden');
  document.getElementById('detailRiwayatContainer').classList.add('hidden');
}

async function muatDataAdmin() {
  const tbody = document.getElementById('tbody-admin');
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10"><i class="fa-solid fa-satellite-dish fa-beat text-indigo-500 text-3xl mb-3"></i><br>Sinkronisasi...</td></tr>`;
  try {
    const res = await fetchAPI('getDataAdmin');
    tbody.innerHTML = '';
    if (res.status === 'error') return tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">${res.message}</td></tr>`;
    if(!res.data || res.data.length === 0) return tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-gray-400 font-medium">Belum ada data.</td></tr>';
    
    res.data.forEach(baris => {
      let tr = document.createElement('tr'); tr.className = "hover:bg-indigo-50 transition border-b";
      tr.innerHTML = `<td class="px-4 py-3 font-bold text-gray-800">${baris[0]}</td><td class="px-4 py-3 whitespace-nowrap">${baris[2]} <br><span class="text-xs text-indigo-600 font-bold">${baris[7]}</span></td><td class="px-4 py-3 whitespace-nowrap">${baris[8]} <br><span class="text-xs text-gray-500">${baris[15]} JP</span></td><td class="px-4 py-3 min-w-[250px] text-xs text-gray-600"><div class="font-bold">CP:</div>${baris[5]} <div class="font-bold mt-1">TP:</div>${baris[6]}</td><td class="px-4 py-3 min-w-[150px] text-xs text-red-500">${baris[16] || '-'}</td>`;
      tbody.appendChild(tr);
    });
  } catch(err) { tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">${err.message}</td></tr>`; }
}
