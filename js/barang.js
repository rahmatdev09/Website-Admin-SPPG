import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { openDetailModal } from "./detailBarang.js";

// --- Inisialisasi DOM ---
const barangTable = document.getElementById("barangTable");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const kolaseBtn = document.getElementById("kolaseBtn");
const kolaseModal = document.getElementById("kolaseModal");
const closeKolase = document.getElementById("closeKolase");
const kolaseList = document.getElementById("kolaseList");
const buatKolaseBtn = document.getElementById("buatKolaseBtn");
const kolasePreview = document.getElementById("kolasePreview");
const downloadKolaseBtn = document.getElementById("downloadKolaseBtn");

// --- State Aplikasi ---
let barangData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 5;
let selectedItems = [];
let currentSelectItem = null;
let kolaseSelectedDate = "";

// --- Fungsi Utilitas ---
function toISODateOnly(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  return d.toISOString().split('T')[0];
}

function formatTanggalHari(tanggalStr) {
  if (!tanggalStr) return "-";
  const date = new Date(tanggalStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// --- Logika Filter & Tabel ---
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

  // Urutkan terbaru
  filteredData.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));

  currentPage = 1;
  renderTable();
  renderPagination(filteredData.length);
}

function renderTable() {
  barangTable.innerHTML = "";
  const start = (currentPage - 1) * itemsPerPage;
  const pageData = filteredData.slice(start, start + itemsPerPage);

  pageData.forEach((data, index) => {
    const tr = document.createElement("tr");
    tr.className = data.verifikasi ? "bg-green-50 hover:bg-green-100 cursor-pointer" : "bg-white hover:bg-gray-50 cursor-pointer";
    tr.innerHTML = `
      <td class="px-4 py-2">${start + index + 1}</td>
      <td class="px-4 py-2">
        <img src="${data.foto1 || 'https://via.placeholder.com/150'}" class="w-16 h-16 object-cover rounded border">
      </td>
      <td class="px-4 py-2">
        <div class="font-medium">${data.nama}</div>
        <div class="text-xs text-gray-500">${formatTanggalHari(data.tanggal)}</div>
      </td>
      <td class="px-4 py-2">${data.jumlahKebutuhan}</td>
      <td class="px-4 py-2">${data.jumlahDatang}</td>
      <td class="px-4 py-2">${data.satuan || "-"}</td>
      <td class="px-4 py-2">${data.verifikasi ? "✅ Diverifikasi" : "⏳ Menunggu"}</td>
      <td class="px-4 py-2">${data.verifikasiAdmin ? "👨‍💼 Admin ✔️" : "❌ Belum"}</td>
      <td class="px-4 py-2">${data.tambahan ? "<span class='text-blue-600 font-semibold'>Tambahan</span>" : "<span class='text-gray-500'>Utama</span>"}</td>
      <td class="px-4 py-2">
        <button class="hapusBtn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-id="${data.id}">Hapus</button>
      </td>
    `;
    tr.addEventListener("click", (e) => {
      if (!e.target.classList.contains("hapusBtn")) openDetailModal(data);
    });
    barangTable.appendChild(tr);
  });
}

// --- Logika Kolase ---
function openFotoSelectModal(item) {
  currentSelectItem = item;
  const options = document.getElementById("fotoSelectOptions");
  options.innerHTML = `
    <label class="flex flex-col items-center cursor-pointer">
      <input type="radio" name="fotoChoice" value="foto1" checked>
      <img src="${item.foto1}" class="w-24 h-24 object-cover rounded border">
      <span class="text-xs mt-1">Foto 1</span>
    </label>
    <label class="flex flex-col items-center cursor-pointer">
      <input type="radio" name="fotoChoice" value="foto2">
      <img src="${item.foto2 || item.foto1}" class="w-24 h-24 object-cover rounded border">
      <span class="text-xs mt-1">Foto 2</span>
    </label>
  `;
  document.getElementById("fotoSelectModal").classList.remove("hidden");
}

document.getElementById("fotoSelectOk").addEventListener("click", () => {
  const choice = document.querySelector("input[name='fotoChoice']:checked").value;
  const itemInSelected = selectedItems.find(i => i.id === currentSelectItem.id);
  if (itemInSelected) itemInSelected.selectedFoto = choice;
  
  // Update thumbnail di list kolase
  const thumb = document.getElementById(`thumb-${currentSelectItem.id}`);
  if (thumb) thumb.src = choice === "foto2" ? currentSelectItem.foto2 : currentSelectItem.foto1;

  document.getElementById("fotoSelectModal").classList.add("hidden");
});

function toggleSelect(item, div) {
  const idx = selectedItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    selectedItems.splice(idx, 1);
    div.classList.remove("bg-blue-100");
    div.querySelector(".orderBadge").classList.add("hidden");
  } else {
    if (selectedItems.length >= 4) return alert("Maksimal 4 item!");
    selectedItems.push({ ...item, selectedFoto: "foto1" });
    div.classList.add("bg-blue-100");
    div.querySelector(".orderBadge").classList.remove("hidden");
  }
  updateOrderBadges();
}

function updateOrderBadges() {
  const allCards = kolaseList.querySelectorAll("[data-id]");
  allCards.forEach(card => {
    const id = card.getAttribute("data-id");
    const foundIdx = selectedItems.findIndex(si => si.id === id);
    const badge = card.querySelector(".orderBadge");
    if (foundIdx >= 0) {
      badge.textContent = foundIdx + 1;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  });
}

function renderKolaseList() {
  kolaseList.innerHTML = "";
  let verifiedItems = barangData.filter(item => item.verifikasi && item.verifikasiAdmin);
  
  if (kolaseSelectedDate) {
    verifiedItems = verifiedItems.filter(item => toISODateOnly(item.tanggal) === kolaseSelectedDate);
  }

  verifiedItems.forEach((item) => {
    const div = document.createElement("div");
    div.setAttribute("data-id", item.id);
    div.className = "border rounded-lg p-2 hover:bg-blue-50 relative cursor-pointer";
    div.innerHTML = `
      <img src="${item.foto1}" id="thumb-${item.id}" class="w-full h-32 object-cover rounded-lg mb-2">
      <p class="text-sm font-medium truncate">${item.nama}</p>
      <p class="text-[10px] text-gray-500">${formatTanggalHari(item.tanggal)}</p>
      <span class="orderBadge absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full hidden"></span>
    `;

    div.querySelector(`#thumb-${item.id}`).addEventListener("click", (e) => {
      e.stopPropagation();
      openFotoSelectModal(item);
    });

    div.addEventListener("click", () => toggleSelect(item, div));
    kolaseList.appendChild(div);
  });
}

// --- Pembuatan Kolase Akhir ---
buatKolaseBtn.addEventListener("click", () => {
  if (selectedItems.length !== 4) return alert("Pilih tepat 4 item!");

  kolasePreview.innerHTML = "";
  selectedItems.forEach((item) => {
    const imgSrc = item.selectedFoto === "foto2" ? item.foto2 : item.foto1;
    const timestamp = `${formatTanggalHari(item.tanggal)} ${item.jam || ""}`;
    
    const wrapper = document.createElement("div");
    wrapper.className = "relative w-full h-full";
    wrapper.innerHTML = `
      <img src="${imgSrc}" crossorigin="anonymous" class="w-full h-full object-cover">
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded">
        ${timestamp}<br>SPPG Naila Jasmin 📍
      </div>
    `;
    kolasePreview.appendChild(wrapper);
  });

  kolasePreview.className = "grid grid-cols-2 grid-rows-2 w-full h-[400px] gap-0 overflow-hidden border";
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
});

// --- Download dengan html2canvas ---
downloadKolaseBtn.addEventListener("click", async () => {
  const canvas = await html2canvas(kolasePreview, { useCORS: true, scale: 2 });
  const fileName = document.getElementById("kolaseFileName").value || "kolase-barang";
  const link = document.createElement("a");
  link.download = `${fileName}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// --- Sinkronisasi Firebase ---
onSnapshot(collection(db, "barang"), (snapshot) => {
  barangData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  applyFilters();
});

// --- Event Listeners Umum ---
searchInput.addEventListener("input", applyFilters);
document.getElementById("filterTanggal").addEventListener("change", applyFilters);
document.getElementById("filterStatus").addEventListener("change", applyFilters);
kolaseBtn.addEventListener("click", () => {
  kolaseModal.classList.replace("hidden", "flex");
  renderKolaseList();
});
closeKolase.addEventListener("click", () => {
  kolaseModal.classList.replace("flex", "hidden");
  selectedItems = [];
  kolasePreview.classList.add("hidden");
});
document.getElementById("kolaseFilterTanggal").addEventListener("change", (e) => {
  kolaseSelectedDate = e.target.value;
  renderKolaseList();
});
