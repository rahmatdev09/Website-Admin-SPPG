import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { openDetailModal } from "./detailBarang.js";

// --- STATE & VARIABEL GLOBAL ---
const barangTable = document.getElementById("barangTable");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const kolaseModal = document.getElementById("kolaseModal");
const kolaseList = document.getElementById("kolaseList");
const kolasePreview = document.getElementById("kolasePreview");
const downloadKolaseBtn = document.getElementById("downloadKolaseBtn");

let isInitialLoad = true; // Kunci untuk Skeleton Loading
let barangData = [];
let filteredData = [];
let selectedItems = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentSelectItem = null;
let kolaseSelectedDate = "";

// --- 1. FIRESTORE LISTENER (DENGAN LOADING) ---
onSnapshot(collection(db, "barang"), (snapshot) => {
  if (isInitialLoad) {
    showLoading(); // Tampilkan skeleton saat pertama kali
  }

  barangData = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (isInitialLoad) {
    setTimeout(() => {
      isInitialLoad = false;
      applyFilters();
    }, 800); // Delay halus agar skeleton terlihat
  } else {
    applyFilters();
  }
});

// --- 2. FUNGSI LOADING SKELETON ---
function showLoading() {
  const skeletonRow = `
        <tr class="animate-pulse border-b border-gray-100">
            <td class="px-6 py-4"><div class="h-4 w-4 bg-gray-200 rounded"></div></td>
            <td class="px-6 py-4"><div class="w-12 h-12 bg-gray-200 rounded-xl"></div></td>
            <td class="px-6 py-4">
                <div class="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div class="h-3 w-20 bg-gray-100 rounded"></div>
            </td>
            <td class="px-6 py-4 text-center"><div class="h-4 w-16 bg-gray-200 rounded mx-auto"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-12 bg-gray-200 rounded"></div></td>
            <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 rounded-full"></div></td>
            <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 rounded-full"></div></td>
            <td class="px-6 py-4 text-center"><div class="h-8 w-8 bg-gray-200 rounded-lg mx-auto"></div></td>
        </tr>
    `;
  barangTable.innerHTML = skeletonRow.repeat(5);
}

// --- 3. RENDER TABEL UTAMA ---
function renderTable() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  if (pageData.length === 0 && !isInitialLoad) {
    barangTable.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-400 italic">Data tidak ditemukan.</td></tr>`;
    return;
  }

  barangTable.innerHTML = pageData.map((data, index) => {
    const statusBadge = data.verifikasi
      ? `<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">✅ Diverifikasi</span>`
      : `<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">⏳ Menunggu</span>`;

    const adminBadge = data.verifikasiAdmin
      ? `<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Approved</span>`
      : `<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400 uppercase">Pending</span>`;

    return `
            <tr class="row-barang hover:bg-gray-50/80 transition-colors group cursor-pointer border-b border-gray-100" data-id="${data.id}">
                <td class="px-6 py-4 text-gray-400 font-medium">${start + index + 1}</td>
                <td class="px-6 py-4">
                    ${data.foto1 ? `<img src="${data.foto1}" class="w-12 h-12 object-cover rounded-xl border border-gray-200 shadow-sm">` : `<div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><i class="fa-solid fa-image"></i></div>`}
                </td>
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${data.nama}</div>
                    <div class="text-[11px] text-gray-400 flex items-center gap-1">
                        <i class="fa-regular fa-calendar-check"></i> ${formatTanggalHari(data.tanggal)}
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <span class="font-semibold text-gray-700">${data.jumlahKebutuhan}</span>
                        <span class="text-gray-300">/</span>
                        <span class="font-bold text-blue-600">${data.jumlahDatang}</span>
                    </div>
                </td>
                <td class="px-6 py-4">${data.tambahan ? `<span class="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100">TAMBAHAN</span>` : `<span class="text-gray-400 text-[10px] font-bold">UTAMA</span>`}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4">${adminBadge}</td>
                <td class="px-6 py-4 text-center">
                    <button class="btn-hapus p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" data-id="${data.id}" data-nama="${data.nama}">
                        <i class="fa-solid fa-trash-can pointer-events-none"></i>
                    </button>
                </td>
            </tr>
        `;
  }).join('');
}

// --- 4. LOGIKA FILTER & SORT ---
function applyFilters() {
  const filterTanggal = document.getElementById("filterTanggal")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const keyword = searchInput.value.toLowerCase();

  filteredData = barangData.filter((item) => {
    let match = item.nama.toLowerCase().includes(keyword);
    if (filterTanggal) match = match && item.tanggal === filterTanggal;
    if (filterStatus === "diverifikasi") match = match && item.verifikasi === true;
    else if (filterStatus === "menunggu") match = match && item.verifikasi === false;
    return match;
  });

  filteredData.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
  currentPage = 1;
  renderTable();
  renderPagination(filteredData.length);
}

// --- 5. FITUR KOLASE & FOTO SELECT ---
document.getElementById("kolaseBtn").addEventListener("click", () => {
  kolaseModal.classList.replace("hidden", "flex");
  renderKolaseList();
});

document.getElementById("closeKolase").addEventListener("click", () => {
  kolaseModal.classList.replace("flex", "hidden");
  selectedItems = [];
  kolasePreview.classList.add("hidden");
});

function renderKolaseList() {
  kolaseList.innerHTML = "";
  let vItems = barangData.filter(i => i.verifikasi && i.verifikasiAdmin);
  if (kolaseSelectedDate) vItems = vItems.filter(i => toISODateOnly(i.tanggal) === kolaseSelectedDate);

  if (vItems.length === 0) {
    kolaseList.innerHTML = `<p class="text-gray-500 text-center col-span-2">Tidak ada barang.</p>`;
    return;
  }

  vItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "border rounded-lg p-2 hover:bg-blue-50 relative cursor-pointer";
    div.innerHTML = `
      <img src="${item.foto1 || ""}" class="w-full h-32 object-cover rounded-lg mb-2" id="thumb-${item.id}">
      <p class="text-sm font-medium text-gray-700">${item.nama}</p>
      <span class="orderBadge absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full hidden"></span>
    `;
    div.querySelector("img").onclick = (e) => { e.stopPropagation(); currentSelectItem = item; openFotoSelectModal(item); };
    div.onclick = () => toggleSelect(item, div);
    kolaseList.appendChild(div);
  });
}

function openFotoSelectModal(item) {
  const options = document.getElementById("fotoSelectOptions");
  options.innerHTML = `
    <label class="flex flex-col items-center cursor-pointer"><input type="radio" name="fotoChoice" value="foto1" checked><img src="${item.foto1}" class="w-24 h-24 object-cover mt-1"></label>
    <label class="flex flex-col items-center cursor-pointer"><input type="radio" name="fotoChoice" value="foto2"><img src="${item.foto2}" class="w-24 h-24 object-cover mt-1"></label>
  `;
  document.getElementById("fotoSelectModal").classList.remove("hidden");
}

document.getElementById("fotoSelectOk").onclick = () => {
  const choice = document.querySelector("input[name='fotoChoice']:checked").value;
  currentSelectItem.selectedFoto = choice;
  const thumb = document.getElementById(`thumb-${currentSelectItem.id}`);
  if (thumb) thumb.src = choice === "foto2" ? currentSelectItem.foto2 : currentSelectItem.foto1;
  document.getElementById("fotoSelectModal").classList.add("hidden");
};

// --- 6. DOWNLOAD & HTML2CANVAS ---
document.getElementById("buatKolaseBtn").addEventListener("click", () => {
  if (selectedItems.length !== 4) return alert("Pilih 4 item!");
  kolasePreview.innerHTML = "";
  selectedItems.forEach(item => {
    const imgSrc = (item.selectedFoto === "foto2") ? item.foto2 : item.foto1;
    const wrapper = document.createElement("div");
    wrapper.className = "relative w-full h-full";
    wrapper.innerHTML = `<img src="${imgSrc}" class="w-full h-full object-cover">
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">
        ${formatTanggalHari(item.tanggal)} ${item.jam || ""}<br>SPPG Naila Jasmin
      </div>`;
    kolasePreview.appendChild(wrapper);
  });
  kolasePreview.className = "grid grid-cols-2 grid-rows-2 w-full h-[400px]";
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
});

downloadKolaseBtn.addEventListener("click", async () => {
  const canvas = await html2canvas(kolasePreview, { useCORS: true });
  const link = document.createElement("a");
  link.download = (document.getElementById("kolaseFileName").value || "kolase") + ".png";
  link.href = canvas.toDataURL();
  link.click();
});

// --- 7. REMINDER & UTILS ---
function checkReminderBarang() {
  const now = new Date();
  if (now.getHours() === 21 && now.getMinutes() === 0) {
    const belum = barangData.filter(i => !i.verifikasi);
    if (belum.length > 0) showToast(`Reminder: ${belum.length} barang belum verifikasi!`);
  }
}
setInterval(checkReminderBarang, 60000);

function formatTanggalHari(tanggalStr) {
  if (!tanggalStr) return "-";
  const date = new Date(tanggalStr);
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function toISODateOnly(dateInput) {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Delegasi Klik Tabel
barangTable.addEventListener("click", async (e) => {
  const btnHapus = e.target.closest(".btn-hapus");
  if (btnHapus) {
    e.stopPropagation();
    if (confirm("Hapus?")) await deleteDoc(doc(db, "barang", btnHapus.dataset.id));
    return;
  }
  const row = e.target.closest(".row-barang");
  if (row) {
    const data = filteredData.find(i => i.id === row.dataset.id);
    if (data) openDetailModal(data);
  }
});

// Penanganan Pagination (Fungsi renderPagination Anda tetap sama)
function renderPagination(totalItems) {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return;
  // ... (Logika tombol prev, nomor, next Anda masukkan kembali di sini) ...
}

searchInput.addEventListener("input", applyFilters);
document.getElementById("filterTanggal").addEventListener("change", applyFilters);
document.getElementById("filterStatus").addEventListener("change", applyFilters);
