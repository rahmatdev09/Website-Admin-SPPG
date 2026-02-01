import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { openDetailModal } from "./detailBarang.js";

// --- 1. STATE & VARIABEL GLOBAL ---
const barangTable = document.getElementById("barangTable");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const kolaseModal = document.getElementById("kolaseModal");
const kolaseList = document.getElementById("kolaseList");
const kolasePreview = document.getElementById("kolasePreview");
const downloadKolaseBtn = document.getElementById("downloadKolaseBtn");
const buatKolaseBtn = document.getElementById("buatKolaseBtn");
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

// --- 2. FIRESTORE LISTENER ---
onSnapshot(collection(db, "barang"), (snapshot) => {
  if (isInitialLoad) showLoading();

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

// --- 3. TABEL & PAGINATION ---
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
          <td class="px-6 py-4 text-center"><div class="flex items-center justify-center gap-2"><span class="font-semibold text-gray-700">${data.jumlahKebutuhan}</span><span class="text-gray-300">/</span><span class="font-bold text-blue-600">${data.jumlahDatang}</span></div></td>
          <td class="px-6 py-4">${data.tambahan ? `<span class="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100">TAMBAHAN</span>` : `<span class="text-gray-400 text-[10px] font-bold">UTAMA</span>`}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4">${adminBadge}</td>
          <td class="px-6 py-4 text-center"><button class="btn-hapus p-2 text-gray-300 hover:text-red-600 rounded-lg" data-id="${data.id}" data-nama="${data.nama}"><i class="fa-solid fa-trash-can pointer-events-none"></i></button></td>
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
    btn.className = `px-3 py-1 rounded ${active ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`;
    btn.disabled = disabled;
    btn.onclick = () => { currentPage = target; renderTable(); renderPagination(totalItems); };
    return btn;
  };

  pagination.appendChild(createBtn("«", currentPage - 1, false, currentPage === 1));
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pagination.appendChild(createBtn(i, i, i === currentPage));
  pagination.appendChild(createBtn("»", currentPage + 1, false, currentPage === totalPages));
}

// --- 4. LOGIKA KOLASE (PILIH & GENERATE) ---
document.getElementById("kolaseBtn").addEventListener("click", () => {
  kolaseModal.classList.replace("hidden", "flex");
  selectedItems = []; 
  renderKolaseList();
});

document.getElementById("closeKolase").addEventListener("click", () => kolaseModal.classList.replace("flex", "hidden"));

function renderKolaseList() {
  kolaseList.innerHTML = "";
  let vItems = barangData.filter(i => i.verifikasi && i.verifikasiAdmin);
  if (kolaseSelectedDate) vItems = vItems.filter(i => toISODateOnly(i.tanggal) === kolaseSelectedDate);

  vItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "border rounded-lg p-2 hover:bg-blue-50 relative cursor-pointer";
    div.innerHTML = `
      <img src="${item.foto1 || ""}" class="w-full h-32 object-cover rounded-lg mb-2 img-kolase-item" id="thumb-${item.id}">
      <p class="text-sm font-medium text-gray-700 truncate">${item.nama}</p>
      <span class="orderBadge absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full hidden"></span>
    `;

    // Klik Gambar -> Pilih Foto 1/2
    div.querySelector(".img-kolase-item").onclick = (e) => {
      e.stopPropagation();
      currentSelectItem = item;
      openFotoSelectModal(item);
    };

    // Klik Card -> Pilih Item
    div.onclick = () => {
      const idx = selectedItems.findIndex(s => s.id === item.id);
      if (idx >= 0) {
        selectedItems.splice(idx, 1);
        div.classList.remove("ring-2", "ring-blue-600");
      } else {
        if (selectedItems.length >= 4) return alert("Maksimal 4!");
        selectedItems.push(item);
        div.classList.add("ring-2", "ring-blue-600");
      }
      updateBadges();
    };
    kolaseList.appendChild(div);
  });
}

function updateBadges() {
  const allDivs = [...kolaseList.children];
  allDivs.forEach(d => d.querySelector(".orderBadge").classList.add("hidden"));
  selectedItems.forEach((item, i) => {
    const target = allDivs.find(d => d.querySelector("p").textContent === item.nama);
    if (target) {
      const b = target.querySelector(".orderBadge");
      b.classList.remove("hidden");
      b.textContent = i + 1;
    }
  });
}

// FUNGSI UTAMA GENERATE
buatKolaseBtn.onclick = () => {
  if (selectedItems.length !== 4) return alert("Pilih tepat 4 item!");
  
  kolasePreview.innerHTML = "";
  kolasePreview.className = "grid grid-cols-2 grid-rows-2 w-[500px] h-[500px] bg-white";
  
  selectedItems.forEach(item => {
    const src = item.selectedFoto === "foto2" ? item.foto2 : item.foto1;
    const wrap = document.createElement("div");
    wrap.className = "relative border-[0.5px] border-white";
    wrap.innerHTML = `
      <img src="${src}" class="w-full h-full object-cover" crossorigin="anonymous">
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] p-1 rounded">
        ${formatTanggalHari(item.tanggal)}<br>SPPG NAILA JASMIN
      </div>`;
    kolasePreview.appendChild(wrap);
  });
  
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
};

// --- 5. FOTO SELECT MODAL ---
function openFotoSelectModal(item) {
  const opt = document.getElementById("fotoSelectOptions");
  opt.innerHTML = `
    <label class="flex flex-col items-center"><input type="radio" name="fc" value="f1" checked><img src="${item.foto1}" class="w-20 h-20 object-cover mt-1"></label>
    <label class="flex flex-col items-center"><input type="radio" name="fc" value="f2"><img src="${item.foto2}" class="w-20 h-20 object-cover mt-1"></label>`;
  document.getElementById("fotoSelectModal").classList.remove("hidden");
}

document.getElementById("fotoSelectOk").onclick = () => {
  const val = document.querySelector("input[name='fc']:checked").value;
  currentSelectItem.selectedFoto = (val === "f2") ? "foto2" : "foto1";
  document.getElementById(`thumb-${currentSelectItem.id}`).src = (val === "f2") ? currentSelectItem.foto2 : currentSelectItem.foto1;
  document.getElementById("fotoSelectModal").classList.add("hidden");
};

// --- 6. DOWNLOAD ---
downloadKolaseBtn.onclick = async () => {
  const canvas = await html2canvas(kolasePreview, { useCORS: true });
  const link = document.createElement("a");
  link.download = "kolase.png";
  link.href = canvas.toDataURL();
  link.click();
};

// --- 7. UTILS & FILTER ---
function applyFilters() {
  const tgl = document.getElementById("filterTanggal")?.value || "";
  const st = document.getElementById("filterStatus")?.value || "";
  const kw = searchInput.value.toLowerCase();

  filteredData = barangData.filter(i => {
    let m = i.nama.toLowerCase().includes(kw);
    if (tgl) m = m && i.tanggal === tgl;
    if (st === "diverifikasi") m = m && i.verifikasi === true;
    else if (st === "menunggu") m = m && i.verifikasi === false;
    return m;
  });
  renderTable();
  renderPagination(filteredData.length);
}

function formatTanggalHari(t) {
  if (!t) return "-";
  return new Date(t).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function toISODateOnly(d) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

barangTable.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-hapus");
    if (btn) {
        e.stopPropagation();
        if (confirm("Hapus?")) await deleteDoc(doc(db, "barang", btn.dataset.id));
        return;
    }
    const row = e.target.closest(".row-barang");
    if (row) {
        const d = filteredData.find(i => i.id === row.dataset.id);
        if (d) openDetailModal(d);
    }
});

searchInput.addEventListener("input", applyFilters);
document.getElementById("filterTanggal")?.addEventListener("change", applyFilters);
document.getElementById("closeDetail").onclick = () => {
    detailModal.classList.add("hidden");
};

document.getElementById("closeTambah").onclick = () => {
    tambahModal.classList.add("hidden");
};


