import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { openDetailModal } from "./detailBarang.js";

// DOM Elements
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

let barangData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 5;
let selectedItems = [];
let currentSelectItem = null;
let kolaseSelectedDate = "";

// Utils
const formatTanggalHari = (tgl) => {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Functions
function applyFilters() {
  const keyword = searchInput?.value.toLowerCase() || "";
  const fTgl = document.getElementById("filterTanggal")?.value;
  const fStat = document.getElementById("filterStatus")?.value;

  filteredData = barangData.filter(item => {
    let match = item.nama.toLowerCase().includes(keyword);
    if (fTgl) match = match && item.tanggal === fTgl;
    if (fStat === "diverifikasi") match = match && item.verifikasi === true;
    if (fStat === "menunggu") match = match && item.verifikasi === false;
    return match;
  });

  filteredData.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
  renderTable();
}

function renderTable() {
  if (!barangTable) return;
  barangTable.innerHTML = "";
  const start = (currentPage - 1) * itemsPerPage;
  const pageData = filteredData.slice(start, start + itemsPerPage);

  pageData.forEach((data, index) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50 cursor-pointer";
    tr.innerHTML = `
      <td class="p-3">${start + index + 1}</td>
      <td class="p-3"><img src="${data.foto1 || ''}" class="w-12 h-12 object-cover rounded"></td>
      <td class="p-3 font-medium">${data.nama}</td>
      <td class="p-3">${data.jumlahKebutuhan}</td>
      <td class="p-3">${data.jumlahDatang}</td>
      <td class="p-3">${data.satuan || '-'}</td>
      <td class="p-3">${data.verifikasi ? '✅' : '⏳'}</td>
      <td class="p-3">${data.verifikasiAdmin ? '👨‍💼✔️' : '❌'}</td>
      <td class="p-3">${data.tambahan ? 'Tambahan' : 'Utama'}</td>
      <td class="p-3"><button class="btn-del bg-red-500 text-white px-2 py-1 rounded" data-id="${data.id}">Hapus</button></td>
    `;
    tr.onclick = (e) => { if(!e.target.classList.contains('btn-del')) openDetailModal(data) };
    barangTable.appendChild(tr);
  });
  
  // Tombol Hapus
  document.querySelectorAll('.btn-del').forEach(btn => {
    btn.onclick = async (e) => {
        e.stopPropagation();
        if(confirm("Hapus barang?")) await deleteDoc(doc(db, "barang", btn.dataset.id));
    };
  });
}

// Kolase Logic
function renderKolaseList() {
  kolaseList.innerHTML = "";
  let verified = barangData.filter(item => item.verifikasi && item.verifikasiAdmin);
  if (kolaseSelectedDate) verified = verified.filter(i => i.tanggal === kolaseSelectedDate);

  verified.forEach(item => {
    const isSelected = selectedItems.find(s => s.id === item.id);
    const div = document.createElement("div");
    div.className = `p-2 border rounded relative cursor-pointer ${isSelected ? 'bg-blue-100 border-blue-500' : ''}`;
    div.innerHTML = `
      <img src="${item.foto1}" id="img-${item.id}" class="w-full h-24 object-cover rounded mb-1">
      <p class="text-xs font-bold truncate">${item.nama}</p>
      <span class="badge absolute top-1 left-1 bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ${isSelected ? '' : 'hidden'}"></span>
    `;
    
    div.onclick = () => {
      const idx = selectedItems.findIndex(s => s.id === item.id);
      if (idx > -1) {
        selectedItems.splice(idx, 1);
      } else {
        if (selectedItems.length >= 4) return alert("Maksimal 4!");
        selectedItems.push({...item, selectedFoto: 'foto1'});
      }
      renderKolaseList();
    };

    // Klik gambar untuk ganti foto1/foto2
    div.querySelector(`#img-${item.id}`).onclick = (e) => {
      e.stopPropagation();
      currentSelectItem = item;
      document.getElementById("fotoSelectOptions").innerHTML = `
        <label><input type="radio" name="fc" value="foto1" checked> <img src="${item.foto1}" class="w-20 h-20 object-cover"></label>
        <label><input type="radio" name="fc" value="foto2"> <img src="${item.foto2 || item.foto1}" class="w-20 h-20 object-cover"></label>
      `;
      document.getElementById("fotoSelectModal").classList.remove("hidden");
    };

    kolaseList.appendChild(div);
  });
  updateBadges();
}

function updateBadges() {
    selectedItems.forEach((item, i) => {
        const el = kolaseList.querySelector(`[id="img-${item.id}"]`)?.parentElement.querySelector('.badge');
        if(el) { el.textContent = i + 1; el.classList.remove('hidden'); }
    });
}

// Event Listeners
buatKolaseBtn?.addEventListener("click", () => {
  if (selectedItems.length !== 4) return alert("Pilih tepat 4 item!");
  kolasePreview.innerHTML = "";
  selectedItems.forEach(item => {
    const src = item.selectedFoto === 'foto2' ? item.foto2 : item.foto1;
    const wrap = document.createElement("div");
    wrap.className = "relative";
    wrap.innerHTML = `<img src="${src}" crossorigin="anonymous" class="w-full h-full object-cover">
      <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] p-1 rounded">
        ${formatTanggalHari(item.tanggal)} ${item.jam || ''}<br>SPPG Naila Jasmin 📍
      </div>`;
    kolasePreview.appendChild(wrap);
  });
  kolasePreview.className = "grid grid-cols-2 grid-rows-2 w-[400px] h-[400px] hidden"; // Hidden but rendered for canvas
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
});

downloadKolaseBtn?.addEventListener("click", async () => {
    const canvas = await html2canvas(kolasePreview, { useCORS: true });
    const link = document.createElement("a");
    link.download = `${document.getElementById("kolaseFileName").value || 'kolase'}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

// Init
onSnapshot(collection(db, "barang"), (snap) => {
  barangData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  applyFilters();
});

searchInput?.addEventListener("input", applyFilters);
kolaseBtn?.addEventListener("click", () => { kolaseModal.classList.replace("hidden", "flex"); renderKolaseList(); });
closeKolase?.addEventListener("click", () => { kolaseModal.classList.replace("flex", "hidden"); selectedItems = []; });
document.getElementById("kolaseFilterTanggal")?.addEventListener("change", (e) => { kolaseSelectedDate = e.target.value; renderKolaseList(); });
document.getElementById("fotoSelectOk")?.addEventListener("click", () => {
    const choice = document.querySelector('input[name="fc"]:checked').value;
    const itm = selectedItems.find(s => s.id === currentSelectItem.id);
    if(itm) itm.selectedFoto = choice;
    document.getElementById("fotoSelectModal").classList.add("hidden");
    renderKolaseList();
});
document.getElementById("fotoSelectCancel")?.addEventListener("click", () => document.getElementById("fotoSelectModal").classList.add("hidden"));
