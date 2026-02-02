import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp
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

let transformState = [
  { scale: 1, x: 0, y: 0 },
  { scale: 1, x: 0, y: 0 },
  { scale: 1, x: 0, y: 0 },
  { scale: 1, x: 0, y: 0 }
];

// Import Firestore functions jika belum ada di atas
// import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.x/firebase-firestore.js";

const simpanDbBtn = document.getElementById("simpanDbBtn");

simpanDbBtn.onclick = async () => {
  const namaFile = document.getElementById("kolaseFileName")?.value;
  if (!namaFile) return alert("Masukkan nama file kolase terlebih dahulu!");

  simpanDbBtn.disabled = true;
  simpanDbBtn.innerText = "Menyimpan...";

  try {
    // 1. Capture kolase menggunakan html2canvas (sama seperti fungsi download)
    const canvas = await html2canvas(kolasePreview, {
      useCORS: true,
      scale: 2,
      logging: false,
      dataHtml2canvasIgnore: true // Mengabaikan tombol zoom
    });

    // 2. Ubah ke format Base64
    const base64Image = canvas.toDataURL("image/png");

    // 3. Simpan ke Firestore
    await addDoc(collection(db, "kolase_history"), {
      nama_file: namaFile,
      gambar_base64: base64Image,
      tanggal_buat: serverTimestamp(),
      item_ids: selectedItems.map(i => i.id) // Menyimpan referensi item yang digunakan
    });

    alert("Berhasil simpan ke database!");
  } catch (error) {
    console.error("Error simpan database:", error);
    alert("Gagal menyimpan ke database.");
  } finally {
    simpanDbBtn.disabled = false;
    simpanDbBtn.innerText = "Simpan ke DB";
  }
};

let isInitialLoad = true; 
let barangData = [];
let filteredData = [];
let selectedItems = []; 
let currentPage = 1;
const itemsPerPage = 5;
let currentSelectItem = null;
let kolaseSelectedDate = "";

// --- Event Listener Filter Tanggal Kolase ---
const filterTanggalKolase = document.getElementById("kolaseFilterTanggal");

if (filterTanggalKolase) {
  filterTanggalKolase.addEventListener("change", (e) => {
    // Simpan nilai tanggal yang dipilih (format YYYY-MM-DD)
    kolaseSelectedDate = e.target.value;
    console.log("Filter Tanggal Kolase:", kolaseSelectedDate);
    
    // PENTING: Reset pilihan item setiap kali filter berubah agar tidak terjadi error
    selectedItems = []; 
    
    // Panggil ulang render daftar gambar
    renderKolaseList();
  });
}

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
  
  // 1. Filter data yang valid
  let vItems = barangData.filter(i => i.verifikasi && i.verifikasiAdmin);
  if (kolaseSelectedDate) vItems = vItems.filter(i => toISODateOnly(i.tanggal) === kolaseSelectedDate);

  if (vItems.length === 0) {
    kolaseList.innerHTML = `<p class="text-center text-gray-500 col-span-2 py-10 italic">Tidak ada data untuk tanggal ini.</p>`;
    return;
  }

  vItems.forEach((item) => {
    const isSelected = selectedItems.find(s => s.id === item.id);
    const div = document.createElement("div");
    div.className = `border rounded-lg p-2 hover:bg-blue-50 relative cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50' : ''}`;
    div.setAttribute("data-id", item.id);

    div.innerHTML = `
      <div class="relative overflow-hidden rounded-lg mb-2">
        <img src="${item.foto1 || ""}" class="w-full h-32 object-cover" id="thumb-${item.id}">
        <div class="btn-ganti-foto absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
          GANTI FOTO
        </div>
      </div>
      <p class="text-sm font-bold text-gray-800 truncate">${item.nama}</p>
      
      <p class="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
        <i class="fa-regular fa-calendar text-[10px]"></i> ${formatTanggalSingkat(item.tanggal)}
      </p>

      <span class="orderBadge absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isSelected ? '' : 'hidden'}"></span>
    `;

    // Event stopPropagation agar ganti foto tidak memicu seleksi card
    div.querySelector(".btn-ganti-foto").onclick = (e) => {
      e.stopPropagation();
      currentSelectItem = item;
      openFotoSelectModal(item);
    };

    div.onclick = () => toggleSelect(item, div);
    kolaseList.appendChild(div);
  });
}

// Fungsi helper untuk format tanggal singkat di dalam card
function formatTanggalSingkat(tgl) {
  if (!tgl) return "-";
  const d = new Date(tgl);
  return d.toLocaleDateString("id-ID", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  });
}

function toggleSelect(item, div) {
  const idx = selectedItems.findIndex(s => s.id === item.id);
  
  if (idx >= 0) {
    // Jika sudah ada, hapus dari seleksi
    selectedItems.splice(idx, 1);
    div.classList.remove("ring-2", "ring-blue-600", "bg-blue-50");
  } else {
    // Jika belum ada, tambahkan (maksimal 4)
    if (selectedItems.length >= 4) {
      alert("Maksimal hanya boleh memilih 4 item!");
      return;
    }
    selectedItems.push(item);
    div.classList.add("ring-2", "ring-blue-600", "bg-blue-50");
  }
  
  updateBadges();
}

function updateBadges() {
  const allDivs = [...kolaseList.children];
  
  // Sembunyikan semua badge dulu
  allDivs.forEach(d => {
    const b = d.querySelector(".orderBadge");
    if (b) b.classList.add("hidden");
  });

  // Tampilkan badge sesuai urutan di array selectedItems
  selectedItems.forEach((item, i) => {
    const targetDiv = allDivs.find(d => d.getAttribute("data-id") === item.id);
    if (targetDiv) {
      const badge = targetDiv.querySelector(".orderBadge");
      badge.classList.remove("hidden");
      badge.textContent = i + 1;
    }
  });
}

// FUNGSI UTAMA GENERATE
// --- Perbaikan Fungsi Generate Agar Tidak Melewati Kontainer ---
buatKolaseBtn.onclick = () => {
  if (selectedItems.length !== 4) return alert("Pilih tepat 4 item!");
  
  kolasePreview.innerHTML = "";
  kolasePreview.className = "grid grid-cols-2 grid-rows-2 w-full aspect-square bg-white border border-gray-200 shadow-inner overflow-hidden mx-auto";
  
  // Reset transformasi
  transformState = transformState.map(() => ({ scale: 1, x: 0, y: 0 }));

  selectedItems.forEach((item, index) => {
    const src = item.selectedFoto === "foto2" ? item.foto2 : item.foto1;
    const wrap = document.createElement("div");
    wrap.className = "relative w-full h-full border-[0.5px] border-white overflow-hidden cursor-move bg-gray-100";
    
  wrap.innerHTML = `
      <img src="${src}" 
           id="img-edit-${index}"
           class="absolute w-full h-full object-cover origin-center transition-transform duration-75 pointer-events-none" 
           style="transform: scale(1) translate(0px, 0px);"
           crossorigin="anonymous">
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] p-1 rounded pointer-events-none z-10">
        ${formatTanggalHari(item.tanggal)}<br>
        SPPG NAILA JASMIN 📍
      </div>
      
      <div class="absolute top-1 right-1 flex gap-1 z-20" data-html2canvas-ignore="true">
         <button class="btn-zoom-in bg-white/80 hover:bg-white p-1 rounded shadow text-[10px]">➕</button>
         <button class="btn-zoom-out bg-white/80 hover:bg-white p-1 rounded shadow text-[10px]">➖</button>
      </div>`;

    // Ambil referensi tombol zoom
    wrap.querySelector(".btn-zoom-in").onclick = (e) => { e.stopPropagation(); changeZoom(index, 0.1); };
    wrap.querySelector(".btn-zoom-out").onclick = (e) => { e.stopPropagation(); changeZoom(index, -0.1); };

    // --- Logika Drag and Drop yang Diperbaiki ---
    let isDragging = false;
    let startX, startY;

    wrap.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - transformState[index].x;
      startY = e.clientY - transformState[index].y;
      wrap.style.cursor = 'grabbing';
    });

    // Gunakan document agar drag tetap mulus meski mouse keluar sedikit dari kotak
    const mouseMoveHandler = (e) => {
      if (!isDragging) return;
      transformState[index].x = e.clientX - startX;
      transformState[index].y = e.clientY - startY;
      updateImageTransform(index);
    };

    const mouseUpHandler = () => {
      if (isDragging) {
        isDragging = false;
        wrap.style.cursor = 'move';
      }
    };

    // Tambahkan listener secara global namun tetap dalam scope index masing-masing
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    kolasePreview.appendChild(wrap);
  });
  
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
    simpanDbBtn.classList.remove("hidden");
  
};

// Fungsi untuk memperbarui tampilan gambar
window.updateImageTransform = (index) => {
  const img = document.getElementById(`img-edit-${index}`);
  if (img) {
    const { scale, x, y } = transformState[index];
    // Translate harus dibagi scale agar pergerakan mouse sinkron dengan gambar
    img.style.transform = `scale(${scale}) translate(${x / scale}px, ${y / scale}px)`;
  }
};

// Fungsi untuk Zoom
window.changeZoom = (index, delta) => {
  transformState[index].scale = Math.max(1, transformState[index].scale + delta);
  updateImageTransform(index);
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
  const canvas = await html2canvas(kolasePreview, { 
  useCORS: true, 
  scale: 3, // Meningkatkan kualitas gambar hasil download meskipun preview di web terlihat kecil
  logging: false 
});
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














