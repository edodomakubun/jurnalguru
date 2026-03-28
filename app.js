// ================= PENGATURAN KONEKSI (UBAH URL INI) =================
const API_URL = "https://script.google.com/macros/s/AKfycbx8qg9xnD8BR688VWkmURca9Hj9S6phI2_pHh3n4QcSpb0QgCtTdt6FIZnf99lwMYxuyQ/exec"; 
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

// ================= FITUR GURU =================
function formatTanggalIndo(dateString) {
  const d = new Date(dateString);
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
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

  const payload = {
    userId: currentUser.userId, tanggal: formatTanggalIndo(rawTgl), bulan: document.getElementById('fBulan').value, tahunAjaran: document.getElementById('fTahunAjaran').value, cp: document.getElementById('fCP').value, tp: document.getElementById('fTP').value, kelas: document.getElementById('fKelas').value, nonTatapMuka: document.getElementById('fNonTatapMuka').value, volume: document.getElementById('fVolume').value, keterangan: document.getElementById('fKeterangan').value, fotoData: fotoDataArray
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

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = 800 / img.width; canvas.width = 800; canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    }; reader.onerror = error => reject(error);
  });
}

// ================= FITUR RIWAYAT 16 KOLOM =================
async function muatRiwayatGuru() {
  const tbody = document.getElementById('tbody-riwayat-guru');
  tbody.innerHTML = `<tr><td colspan="16" class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl mb-2"></i><br>Membuka laci arsip <b>${currentUser.userId}</b>...</td></tr>`;

  try {
    const res = await fetchAPI('getRiwayatGuru', { userId: currentUser.userId });
    tbody.innerHTML = '';
    
    if (res.status === 'error') return tbody.innerHTML = `<tr><td colspan="16" class="text-center py-10 text-red-500 font-bold">${res.message}</td></tr>`;
    if (!res.data || res.data.length === 0) return tbody.innerHTML = '<tr><td colspan="16" class="text-center py-10 text-gray-400 font-medium">Anda belum memiliki riwayat jurnal.</td></tr>';
    
    const buatLinkFoto = (url) => url ? `<a href="${url}" target="_blank" class="text-blue-500 underline font-semibold hover:text-blue-700">Lihat</a>` : `<span class="text-gray-300">-</span>`;

    res.data.forEach(baris => {
      let tr = document.createElement('tr');
      tr.className = "hover:bg-blue-50 transition duration-150 whitespace-nowrap text-xs";
      tr.innerHTML = `
        <td class="px-3 py-2 border border-gray-200 font-mono text-blue-600">${baris[0] || '-'}</td>
        <td class="px-3 py-2 border border-gray-200">${baris[1] || '-'}</td><td class="px-3 py-2 border border-gray-200">${baris[2] || '-'}</td>
        <td class="px-3 py-2 border border-gray-200">${baris[3] || '-'}</td><td class="px-3 py-2 border border-gray-200 whitespace-normal min-w-[200px]">${baris[4] || '-'}</td>
        <td class="px-3 py-2 border border-gray-200 whitespace-normal min-w-[200px]">${baris[5] || '-'}</td><td class="px-3 py-2 border border-gray-200">${baris[6] || '-'}</td>
        <td class="px-3 py-2 border border-gray-200">${baris[7] || '-'}</td><td class="px-3 py-2 border border-gray-200 text-center">${buatLinkFoto(baris[8])}</td>
        <td class="px-3 py-2 border border-gray-200 text-center">${buatLinkFoto(baris[9])}</td><td class="px-3 py-2 border border-gray-200 text-center">${buatLinkFoto(baris[10])}</td>
        <td class="px-3 py-2 border border-gray-200 text-center">${buatLinkFoto(baris[11])}</td><td class="px-3 py-2 border border-gray-200 text-center">${buatLinkFoto(baris[12])}</td>
        <td class="px-3 py-2 border border-gray-200 text-center">${buatLinkFoto(baris[13])}</td><td class="px-3 py-2 border border-gray-200 text-center font-bold">${baris[14] || '0'}</td>
        <td class="px-3 py-2 border border-gray-200 whitespace-normal min-w-[150px]">${baris[15] || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch(err) { tbody.innerHTML = `<tr><td colspan="16" class="text-center py-10 text-red-500 font-bold">${err.message}</td></tr>`; }
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
