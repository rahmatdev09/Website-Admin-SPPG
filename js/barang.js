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
const tambahModal = document.getElementById("tambahBarangModal");
const detailModal = document.getElementById("detailModal");

let isInitialLoad = true; 
let barangData = [];
let filteredData = [];
let selectedItems = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentSelectItem = null;
let kolaseSelectedDate = "";

// --- 1. FIRESTORE LISTENER (SKELETON LOADING) ---
onSnapshot(collection(db, "barang"), (snapshot) => {
  if (isInitialLoad) {
    showLoading(); 
  }

  barangData = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (isInitialLoad) {
    setTimeout(() => {
      isInitialLoad = false;
      applyFilters();
    }, 800);
  } else {
    applyFilters();
  }
});

function showLoading() {
  const skeletonRow = `
    <tr class="animate-pulse border-b border-gray-100">
        <td class="px-6 py-4"><div class="h-4 w-4 bg-gray-200 rounded"></div></td>
        <td class="px-6 py-4"><div class="w-12 h-12 bg-gray-200 rounded-xl"></div></td>
        <td class="px-6 py-4"><div class="h-4 w-32 bg-gray-200 rounded mb-2"></div><div class="h-3 w-20 bg-gray-100 rounded"></div></td>
        <td class="px-6 py-4 text-center"><div class="h-4 w-16 bg-gray-200 rounded mx-auto"></div></td>
        <td class="px-6 py-4"><div class="h-4 w-12 bg-gray-200 rounded"></div></td>
        <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 rounded-full"></div></td>
        <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 rounded-full"></div></td>
        <td class="px-6 py-4 text-center"><div class="h-8 w-8 bg-gray-200 rounded-lg mx-auto"></div></td>
    </tr>`;
  barangTable.innerHTML = skeletonRow.repeat(5);
}

// --- 2. RENDER TABEL & PAGINATION (FIXED) ---
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
          <td class="px-6 py-4">${data.foto1 ? `<img src="${data.foto1}" class="w-12 h-12 object-cover rounded-xl border border-gray-200 shadow-sm">` : `<div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><i class="fa-solid fa-image"></i></div>`}</td>
          <td class="px-6 py-4">
              <div class="font-bold text-gray-800">${data.nama}</div>
              <div class="text-[11px] text-gray-400 flex items-center gap-1"><i class="fa-regular fa-calendar-check"></i> ${formatTanggalHari(data.tanggal)}</div>
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
      </tr>`;
  }).join('');
}

function renderPagination(totalItems) {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return;

  const createBtn = (text, target, active = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 rounded transition-all ${active ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 hover:bg-gray-300 text-gray-700"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`;
    btn.disabled = disabled;
    btn.onclick = () => { currentPage = target; renderTable(); renderPagination(totalItems); };
    return btn;
  };

  // Tombol Prev
  pagination.appendChild(createBtn("« Prev", currentPage - 1, false, currentPage === 1));

  // Logika Batasan Nomor Halaman (Max 5 nomor)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    pagination.appendChild(createBtn(i, i, i === currentPage));
  }

  // Tombol Next
  pagination.appendChild(createBtn("Next »", currentPage + 1, false, currentPage === totalPages));
}

// --- 3. FILTER & SEARCH ---
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
  currentPage = 1; // Reset ke halaman 1 saat filter berubah
  renderTable();
  renderPagination(filteredData.length);
}

// --- 4. MODAL CLOSE LOGIC ---
const closeDetail = () => { detailModal.classList.add("hidden"); detailModal.classList.remove("flex"); };
const closeTambah = () => { tambahModal.classList.add("hidden"); tambahModal.classList.remove("flex"); };

document.getElementById("closeDetail")?.addEventListener("click", closeDetail);
document.getElementById("closeTambah")?.addEventListener("click", closeTambah);

// --- 5. KOLASE LOGIC (PILIH GAMBAR & TOGGLE SELECT) ---
document.getElementById("kolaseBtn").addEventListener("click", () => {
  kolaseModal.classList.remove("hidden");
  kolaseModal.classList.add("flex");
  selectedItems = []; // Reset pilihan saat buka
  renderKolaseList();
});

document.getElementById("closeKolase").addEventListener("click", () => {
  kolaseModal.classList.add("hidden");
  kolaseModal.classList.remove("flex");
});

function renderKolaseList() {
  kolaseList.innerHTML = "";
  let vItems = barangData.filter(i => i.verifikasi && i.verifikasiAdmin);
  if (kolaseSelectedDate) vItems = vItems.filter(i => toISODateOnly(i.tanggal) === kolaseSelectedDate);

  vItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "border rounded-lg p-2 hover:bg-blue-50 relative cursor-pointer group";
    div.innerHTML = `
      <div class="relative overflow-hidden rounded-lg mb-2">
        <img src="${item.foto1 || ""}" class="w-full h-32 object-cover" id="thumb-${item.id}">
        <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">GANTI FOTO</div>
      </div>
      <p class="text-sm font-medium text-gray-700 truncate">${item.nama}</p>
      <span class="orderBadge absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full hidden"></span>
    `;

    // Klik gambar = Ganti sumber foto
    div.querySelector("img").addEventListener("click", (e) => {
      e.stopPropagation();
      currentSelectItem = item;
      openFotoSelectModal(item);
    });

    // Klik div = Pilih untuk kolase
    div.addEventListener("click", () => toggleSelect(item, div));
    kolaseList.appendChild(div);
  });
}

function toggleSelect(item, div) {
  const idx = selectedItems.findIndex(i => i.id === item.id);
  const badge = div.querySelector(".orderBadge");

  if (idx >= 0) {
    selectedItems.splice(idx, 1);
    div.classList.remove("ring-2", "ring-blue-600", "bg-blue-50");
    badge.classList.add("hidden");
  } else {
    if (selectedItems.length >= 4) return alert("Maksimal 4 item!");
    selectedItems.push(item);
    div.classList.add("ring-2", "ring-blue-600", "bg-blue-50");
    badge.classList.remove("hidden");
  }
  updateOrderBadges();
}

function updateOrderBadges() {
  const divs = [...kolaseList.children];
  divs.forEach(d => d.querySelector(".orderBadge").classList.add("hidden")); // Reset semua dulu

  selectedItems.forEach((item, index) => {
    const targetDiv = divs.find(d => d.querySelector("p").textContent === item.nama);
    if (targetDiv) {
      const b = targetDiv.querySelector(".orderBadge");
      b.classList.remove("hidden");
      b.textContent = index + 1;
    }
  });
}

function openFotoSelectModal(item) {
  const options = document.getElementById("fotoSelectOptions");
  options.innerHTML = `
    <label class="cursor-pointer flex flex-col items-center"><input type="radio" name="fc" value="f1" checked><img src="${item.foto1}" class="w-20 h-20 object-cover rounded mt-1"></label>
    <label class="cursor-pointer flex flex-col items-center"><input type="radio" name="fc" value="f2"><img src="${item.foto2}" class="w-20 h-20 object-cover rounded mt-1"></label>
  `;
  document.getElementById("fotoSelectModal").classList.remove("hidden");
}

document.getElementById("fotoSelectOk").onclick = () => {
  const choice = document.querySelector("input[name='fc']:checked").value;
  currentSelectItem.selectedFoto = choice === "f2" ? "foto2" : "foto1";
  const thumb = document.getElementById(`thumb-${currentSelectItem.id}`);
  if (thumb) thumb.src = choice === "f2" ? currentSelectItem.foto2 : currentSelectItem.foto1;
  document.getElementById("fotoSelectModal").classList.add("hidden");
};

// --- 6. EVENT & LISTENERS ---
barangTable.addEventListener("click", async (e) => {
  const btnHapus = e.target.closest(".btn-hapus");
  if (btnHapus) {
    e.stopPropagation();
    if (confirm(`Hapus "${btnHapus.dataset.nama}"?`)) await deleteDoc(doc(db, "barang", btnHapus.dataset.id));
    return;
  }
  const row = e.target.closest(".row-barang");
  if (row) {
    const data = filteredData.find(i => i.id === row.dataset.id);
    if (data) openDetailModal(data);
  }
});

searchInput.addEventListener("input", applyFilters);
document.getElementById("filterTanggal")?.addEventListener("change", applyFilters);
document.getElementById("kolaseFilterTanggal")?.addEventListener("change", (e) => {
  kolaseSelectedDate = e.target.value;
  renderKolaseList();
});

// Utils
function formatTanggalHari(t) {
  if (!t) return "-";
  const d = new Date(t);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function toISODateOnly(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
