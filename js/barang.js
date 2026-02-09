import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { openDetailModal } from "./detailBarang.js";

// --- GLOBAL STATE ---
let barangData = [];
let filteredData = [];
let selectedItems = [];
let currentPage = 1;
const itemsPerPage = 5;
let transformState = [];
let currentSelectItem = null;
let kolaseSelectedDate = "";
let isInitialLoad = true;

const barangTable = document.getElementById("barangTable");
const pagination = document.getElementById("pagination");
const kolaseList = document.getElementById("kolaseList");
const kolasePreview = document.getElementById("kolasePreview");
// --- LOGIKA TOMBOL TAMBAH BARANG ---
const btnTambah = document.getElementById("tambahBarangBtn");
const modalTambah = document.getElementById("tambahBarangModal");
const btnCloseTambah = document.getElementById("closeTambah");

if (btnTambah && modalTambah) {
  btnTambah.onclick = () => modalTambah.classList.remove("hidden");
}

if (btnCloseTambah) {
  btnCloseTambah.onclick = () => modalTambah.classList.add("hidden");
}
// --- 1. FIRESTORE LISTENER & LOADING ---
onSnapshot(collection(db, "barang"), (snapshot) => {
  if (isInitialLoad) renderLoading();
  barangData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  isInitialLoad = false;
  applyFilters();
});

// Ganti fungsi renderLoading di barang.js dengan ini
function renderLoading() {
  const tableBody = document.getElementById("barangTable");
  if (tableBody) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-20 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <div class="loader-circle mb-3"></div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                            Memuat Data...
                        </p>
                    </div>
                </td>
            </tr>
        `;
  }
}

// --- 2. TABEL & PAGINATION ---
function applyFilters() {
  const kw = document.getElementById("searchInput").value.toLowerCase();
  const tgl = document.getElementById("filterTanggal").value;
  const st = document.getElementById("filterStatus").value;

  filteredData = barangData.filter((i) => {
    let m = i.nama.toLowerCase().includes(kw);
    if (tgl) m = m && i.tanggal === tgl;
    if (st === "diverifikasi") m = m && i.verifikasi && i.verifikasiAdmin;
    if (st === "menunggu") m = m && (!i.verifikasi || !i.verifikasiAdmin);
    return m;
  });
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * itemsPerPage;
  const data = filteredData.slice(start, start + itemsPerPage);

  if (data.length === 0) {
    barangTable.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-400 italic">Data tidak ditemukan</td></tr>`;
    pagination.innerHTML = "";
    return;
  }

  barangTable.innerHTML = data
    .map((d, i) => {
      const userSt = d.verifikasi
        ? '<span class="px-2 py-1 rounded bg-green-100 text-green-700 font-bold text-[9px] uppercase">Diterima</span>'
        : '<span class="px-2 py-1 rounded bg-amber-100 text-amber-700 font-bold text-[9px] uppercase">Menunggu</span>';
      const adminSt = d.verifikasiAdmin
        ? '<span class="px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold text-[9px] uppercase">Disetujui</span>'
        : '<span class="px-2 py-1 rounded bg-gray-100 text-gray-400 font-bold text-[9px] uppercase">Pending</span>';

      return `
        <tr class="row-barang cursor-pointer hover:bg-gray-50 transition-colors border-b" data-id="${d.id}">
            <td class="px-6 py-4 text-gray-400 font-medium">${start + i + 1}</td>
            <td class="px-6 py-4"><img src="${d.foto1 || ""}" class="w-10 h-10 object-cover rounded-lg border"></td>
            <td class="px-6 py-4">
                <div class="font-bold text-gray-800">${d.nama}</div>
                <div class="text-[10px] text-gray-400 italic">${formatTgl(d.tanggal)}</div>
            </td>
            <td class="px-6 py-4 text-center font-bold">
                <span class="text-gray-500">${d.jumlahKebutuhan}</span> / <span class="text-blue-600">${d.jumlahDatang}</span>
            </td>
            <td class="px-6 py-4 text-[10px] font-bold uppercase ${d.tambahan ? "text-blue-500" : "text-gray-400"}">${d.tambahan ? "Tambahan" : "Utama"}</td>
            <td class="px-6 py-4">${userSt}</td>
            <td class="px-6 py-4">${adminSt}</td>
            <td class="px-6 py-4 text-center">
                <button class="btn-hapus text-gray-300 hover:text-red-600" data-id="${d.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  // Tombol Back
  const prev = document.createElement("button");
  prev.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
  prev.className = `w-8 h-8 flex items-center justify-center rounded-lg border text-xs ${currentPage === 1 ? "text-gray-300" : "text-primary hover:bg-gray-100"}`;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };
  container.appendChild(prev);

  // Hitung Range Nomor (Agar tidak kepanjangan)
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);

  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = `w-8 h-8 rounded-lg text-xs font-bold transition-all ${i === currentPage ? "bg-primary text-white shadow-md" : "text-gray-500 border hover:bg-gray-50"}`;
    btn.onclick = () => {
      currentPage = i;
      renderTable();
    };
    container.appendChild(btn);
  }

  // Tombol Next
  const next = document.createElement("button");
  next.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
  next.className = `w-8 h-8 flex items-center justify-center rounded-lg border text-xs ${currentPage === totalPages ? "text-gray-300" : "text-primary hover:bg-gray-100"}`;
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };
  container.appendChild(next);
}

// --- 3. LOGIKA KOLASE (FILTER & SELECT FOTO) ---
document.getElementById("kolaseFilterTanggal").onchange = (e) => {
  kolaseSelectedDate = e.target.value;
  selectedItems = [];
  renderKolaseList();
};

function renderKolaseList() {
  kolaseList.innerHTML = "";
  let items = barangData.filter((i) => i.verifikasi && i.verifikasiAdmin);
  if (kolaseSelectedDate)
    items = items.filter((i) => i.tanggal === kolaseSelectedDate);

  if (items.length === 0) {
    kolaseList.innerHTML = `<p class="col-span-2 text-center py-10 text-gray-400 text-xs italic">Tidak ada barang yang siap dikolase (Pastikan sudah di-approve User & Admin)</p>`;
    return;
  }

  items.forEach((item) => {
    const isSelected = selectedItems.find((s) => s.id === item.id);
    const div = document.createElement("div");
    div.className = `border rounded-xl p-2 relative cursor-pointer hover:bg-blue-50 transition-all ${isSelected ? "ring-2 ring-primary bg-blue-50" : ""}`;
    div.setAttribute("data-id", item.id);

    div.innerHTML = `
            <div class="relative mb-2">
                <img src="${item.foto1}" id="thumb-${item.id}" class="w-full h-24 object-cover rounded-lg">
                <button class="btn-ganti absolute inset-0 bg-black/40 text-white text-[8px] font-bold opacity-0 hover:opacity-100 rounded-lg">GANTI FOTO</button>
            </div>
            <p class="text-[10px] font-extrabold truncate text-gray-800 uppercase">${item.nama}</p>
            <p class="text-[9px] text-gray-400">${formatTgl(item.tanggal)}</p>
            <span class="orderBadge absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold hidden"></span>
        `;

    div.querySelector(".btn-ganti").onclick = (e) => {
      e.stopPropagation();
      currentSelectItem = item;
      openFotoSelect(item);
    };
    div.onclick = () => toggleKolaseSelection(item, div);
    kolaseList.appendChild(div);
  });
  updateBadges();
}

function openFotoSelect(item) {
  const opt = document.getElementById("fotoSelectOptions");
  opt.innerHTML = `
        <label class="cursor-pointer border p-2 rounded-xl flex flex-col items-center">
            <input type="radio" name="fc" value="f1" checked class="mb-2">
            <img src="${item.foto1}" class="w-full h-20 object-cover rounded-lg">
            <span class="text-[8px] mt-1 font-bold uppercase">Foto 1</span>
        </label>
        <label class="cursor-pointer border p-2 rounded-xl flex flex-col items-center">
            <input type="radio" name="fc" value="f2" class="mb-2">
            <img src="${item.foto2 || item.foto1}" class="w-full h-20 object-cover rounded-lg">
            <span class="text-[8px] mt-1 font-bold uppercase">Foto 2</span>
        </label>`;
  document.getElementById("fotoSelectModal").classList.remove("hidden");
}

document.getElementById("fotoSelectOk").onclick = () => {
  const val = document.querySelector("input[name='fc']:checked").value;
  const chosen =
    val === "f2" && currentSelectItem.foto2
      ? currentSelectItem.foto2
      : currentSelectItem.foto1;
  currentSelectItem.chosenImg = chosen;
  document.getElementById(`thumb-${currentSelectItem.id}`).src = chosen;
  document.getElementById("fotoSelectModal").classList.add("hidden");
};

function toggleKolaseSelection(item, div) {
  const idx = selectedItems.findIndex((s) => s.id === item.id);
  if (idx >= 0) {
    selectedItems.splice(idx, 1);
  } else {
    if (selectedItems.length >= 6) return alert("Maksimal 6 foto!");
    if (!item.chosenImg) item.chosenImg = item.foto1; // Default
    selectedItems.push(item);
  }
  renderKolaseList(); // Re-render untuk update UI ring & badge
}

function updateBadges() {
  selectedItems.forEach((item, i) => {
    const div = [...kolaseList.children].find(
      (d) => d.getAttribute("data-id") === item.id,
    );
    if (div) {
      const b = div.querySelector(".orderBadge");
      b.classList.remove("hidden");
      b.innerText = i + 1;
      div.classList.add("ring-2", "ring-primary", "bg-blue-50");
    }
  });
}

// --- 4. GENERATE KOLASE ---
document.getElementById("buatKolaseBtn").onclick = () => {
  const jml = selectedItems.length;
  if (jml < 2) return alert("Pilih minimal 2 foto!");

  kolasePreview.innerHTML = "";
  kolasePreview.className =
    "relative w-full aspect-square bg-white border grid gap-[2px] overflow-hidden";

  // Dynamic Grid Layout
  if (jml === 2) kolasePreview.classList.add("grid-cols-1", "grid-rows-2");
  else if (jml === 3) kolasePreview.classList.add("grid-cols-1", "grid-rows-3");
  else if (jml === 4) kolasePreview.classList.add("grid-cols-2", "grid-rows-2");
  else if (jml === 5) kolasePreview.classList.add("grid-cols-2", "grid-rows-3");
  else if (jml === 6) kolasePreview.classList.add("grid-cols-2", "grid-rows-3");

  transformState = Array.from({ length: jml }, () => ({
    scale: 1,
    x: 0,
    y: 0,
  }));

  selectedItems.forEach((item, idx) => {
    const wrap = document.createElement("div");
    wrap.className =
      "relative w-full h-full overflow-hidden cursor-move bg-gray-50";
    if (jml === 5 && idx === 0) wrap.classList.add("col-span-2");

    wrap.innerHTML = `
            <img src="${item.chosenImg}" id="img-edit-${idx}" class="absolute w-full h-full object-cover origin-center pointer-events-none" style="transform: scale(1) translate(0px,0px)" crossorigin="anonymous">
            <div class="absolute bottom-1 left-1 bg-black/60 text-white text-[7px] p-1 rounded z-10 font-bold leading-tight">
                ${formatTglFull(item.tanggal)}<br>SPPG NAILA JASMIN 📍
            </div>
            <div class="absolute top-1 right-1 flex gap-1 z-20" data-html2canvas-ignore="true">
                <button onclick="event.stopPropagation(); changeZ(${idx}, 0.1)" class="bg-white/90 w-6 h-6 rounded flex items-center justify-center text-xs">➕</button>
                <button onclick="event.stopPropagation(); changeZ(${idx}, -0.1)" class="bg-white/90 w-6 h-6 rounded flex items-center justify-center text-xs">➖</button>
            </div>`;

    let isD = false,
      sx,
      sy;
    wrap.onmousedown = (e) => {
      isD = true;
      sx = e.clientX - transformState[idx].x;
      sy = e.clientY - transformState[idx].y;
    };
    window.onmousemove = (e) => {
      if (!isD) return;
      transformState[idx].x = e.clientX - sx;
      transformState[idx].y = e.clientY - sy;
      upd(idx);
    };
    window.onmouseup = () => (isD = false);
    kolasePreview.appendChild(wrap);
  });

  kolasePreview.classList.remove("hidden");
  document.getElementById("kolasePlaceholder").classList.add("hidden");
  document.getElementById("downloadKolaseBtn").classList.remove("hidden");
  document.getElementById("simpanDbBtn").classList.remove("hidden");
};

// Global Zoom Helper
window.changeZ = (idx, delta) => {
  transformState[idx].scale = Math.max(1, transformState[idx].scale + delta);
  upd(idx);
};

function upd(idx) {
  const img = document.getElementById(`img-edit-${idx}`);
  const { scale, x, y } = transformState[idx];
  img.style.transform = `scale(${scale}) translate(${x / scale}px, ${y / scale}px)`;
}

// --- UTILS ---
function formatTgl(t) {
  if (!t) return "-";
  const d = new Date(t);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTglFull(t) {
  if (!t) return "-";
  const d = new Date(t);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// --- GLOBAL CLICK HANDLERS ---
barangTable.onclick = (e) => {
  const b = e.target.closest(".btn-hapus");
  if (b) {
    e.stopPropagation();
    if (confirm("Hapus barang?")) deleteDoc(doc(db, "barang", b.dataset.id));
    return;
  }
  const r = e.target.closest(".row-barang");
  if (r) openDetailModal(barangData.find((x) => x.id === r.dataset.id));
};

document.getElementById("searchInput").oninput = applyFilters;
document.getElementById("filterTanggal").onchange = applyFilters;
document.getElementById("filterStatus").onchange = applyFilters;
document.getElementById("kolaseBtn").onclick = () => {
  document.getElementById("kolaseModal").classList.remove("hidden");
  renderKolaseList();
};
document.getElementById("closeKolase").onclick = () =>
  document.getElementById("kolaseModal").classList.add("hidden");
