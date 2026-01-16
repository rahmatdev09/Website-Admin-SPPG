import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { openDetailModal } from "./detailBarang.js";
import {
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const barangTable = document.getElementById("barangTable");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const sortTanggalBtn = document.getElementById("sortTanggalBtn");

let barangData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 5;
let sortAscending = false;

const kolaseBtn = document.getElementById("kolaseBtn");
const kolaseModal = document.getElementById("kolaseModal");
const closeKolase = document.getElementById("closeKolase");
const kolaseList = document.getElementById("kolaseList");
const buatKolaseBtn = document.getElementById("buatKolaseBtn");
const kolasePreview = document.getElementById("kolasePreview");

let selectedItems = [];

kolaseBtn.addEventListener("click", () => {
  kolaseModal.classList.remove("hidden");
  kolaseModal.classList.add("flex");
  renderKolaseList();
});

closeKolase.addEventListener("click", () => {
  kolaseModal.classList.add("hidden");
  kolaseModal.classList.remove("flex");
  selectedItems = [];
  kolasePreview.innerHTML = "";
  kolasePreview.classList.add("hidden");
});

function sortByLatest() {
  filteredData.sort(
    (a, b) =>
      new Date(b.tanggal || "1970-01-01") - new Date(a.tanggal || "1970-01-01")
  );
}

function applyFilters() {
  const filterTanggal = document.getElementById("filterTanggal")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";

  filteredData = barangData.filter((item) => {
    let match = true;

    // ✅ filter tanggal
    if (filterTanggal) {
      match = match && item.tanggal === filterTanggal;
    }

    // ✅ filter status
    if (filterStatus === "diverifikasi") {
      match = match && item.verifikasi === true;
    } else if (filterStatus === "menunggu") {
      match = match && item.verifikasi === false;
    }

    return match;
  });

  // ✅ urutkan terbaru
  sortByLatest();

  currentPage = 1;
  renderTable();
  renderPagination(filteredData.length);
}

let currentSelectItem = null; // barang yang sedang dipilih fotonya

document.getElementById("fotoSelectCancel").addEventListener("click", () => {
  document.getElementById("fotoSelectModal").classList.add("hidden");
  currentSelectItem = null;
});

document.getElementById("fotoSelectOk").addEventListener("click", () => {
  const choice = document.querySelector(
    "input[name='fotoChoice']:checked"
  ).value;
  const newSrc =
    choice === "foto2" ? currentSelectItem.foto2 : currentSelectItem.foto1;

  // update thumbnail
  const thumb = document.getElementById(`thumb-${currentSelectItem.id}`);
  if (thumb) thumb.src = newSrc;

  // ✅ simpan pilihan ke item
  currentSelectItem.selectedFoto = choice;

  document.getElementById("fotoSelectModal").classList.add("hidden");
  currentSelectItem = null;
});

buatKolaseBtn.addEventListener("click", () => {
  if (selectedItems.length !== 4) {
    alert("Harus pilih tepat 4 item diverifikasi!");
    return;
  }

  kolasePreview.innerHTML = "";
  selectedItems.forEach((item) => {
    const choice = item.selectedFoto || "foto1";
    const imgSrc = choice === "foto2" ? item.foto2 : item.foto1;

    const img = document.createElement("img");
    img.src = imgSrc || "";
    img.className =
      "w-full h-full object-cover m-0 p-0 border-none rounded-none";
    kolasePreview.appendChild(img);
  });

  kolasePreview.className =
    "grid grid-cols-2 grid-rows-2 w-full h-[400px] gap-0 m-0 p-0 overflow-hidden";
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
});

function openFotoSelectModal(item) {
  const options = document.getElementById("fotoSelectOptions");
  options.innerHTML = `
    <label class="flex flex-col items-center cursor-pointer">
      <input type="radio" name="fotoChoice" value="foto1" checked>
      <img src="${
        item.foto1 || ""
      }" class="w-24 h-24 object-cover rounded border">
      <span class="text-xs mt-1">Foto 1</span>
    </label>
    <label class="flex flex-col items-center cursor-pointer">
      <input type="radio" name="fotoChoice" value="foto2">
      <img src="${
        item.foto2 || ""
      }" class="w-24 h-24 object-cover rounded border">
      <span class="text-xs mt-1">Foto 2</span>
    </label>
  `;
  document.getElementById("fotoSelectModal").classList.remove("hidden");
}

function renderKolaseList() {
  kolaseList.innerHTML = "";

  let verifiedItems = barangData.filter(
    (item) => item.verifikasi && item.verifikasiAdmin
  );

  // 🔑 filter sesuai tanggal yang dipilih
  if (kolaseSelectedDate) {
    verifiedItems = verifiedItems.filter((item) => {
      const itemDate = toISODateOnly(item.tanggal);
      return itemDate === kolaseSelectedDate;
    });
  }

  // urutkan terbaru
  verifiedItems.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  if (verifiedItems.length === 0) {
    kolaseList.innerHTML = `<p class="text-gray-500 text-center col-span-2">Tidak ada barang pada tanggal yang dipilih.</p>`;
    return;
  }

  verifiedItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "border rounded-lg p-2 hover:bg-blue-50 relative";

    const hari = new Date(item.tanggal).toLocaleDateString("id-ID", {
      weekday: "long",
    });
    const tglFormat = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    div.innerHTML = `
      <img src="${
        item.foto1 || ""
      }" class="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer" id="thumb-${
      item.id
    }">
      <p class="text-sm font-medium text-gray-700">${item.nama}</p>
      <p class="text-xs text-gray-500">${hari}, ${tglFormat}</p>
      <span class="orderBadge absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full hidden"></span>
    `;

    div.querySelector(`#thumb-${item.id}`).addEventListener("click", () => {
      currentSelectItem = item;
      openFotoSelectModal(item);
    });

    div.addEventListener("click", () => toggleSelect(item, div));
    kolaseList.appendChild(div);
  });
}

// ✅ fungsi tutup pilihan
function closeChoice(id) {
  document.getElementById(`fotoChoice-${id}`).classList.add("hidden");
}

// ✅ event filter tanggal
let kolaseSelectedDate = ""; // simpan tanggal yang dipilih (format YYYY-MM-DD)

// event listener untuk input tanggal
document
  .getElementById("kolaseFilterTanggal")
  .addEventListener("change", (e) => {
    kolaseSelectedDate = e.target.value; // contoh: "2025-12-14"
    renderKolaseList();
  });

function toISODateOnly(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toggleSelect(item, div) {
  const idx = selectedItems.findIndex((i) => i.id === item.id);
  const badge = div.querySelector(".orderBadge");

  if (idx >= 0) {
    // Hapus dari selected
    selectedItems.splice(idx, 1);
    div.classList.remove("bg-blue-100");
    badge.classList.add("hidden");
    updateOrderBadges();
  } else {
    if (selectedItems.length >= 4) {
      alert("Maksimal 4 item!");
      return;
    }
    selectedItems.push(item);
    div.classList.add("bg-blue-100");
    badge.classList.remove("hidden");
    updateOrderBadges();
  }
}

function updateOrderBadges() {
  // Loop semua item yang dipilih dan update nomor urutan
  selectedItems.forEach((item, index) => {
    const div = [...kolaseList.children].find(
      (child) => child.querySelector("p").textContent === item.nama
    );
    if (div) {
      const badge = div.querySelector(".orderBadge");
      badge.textContent = index + 1; // urutan 1–4
    }
  });
}

// Pastikan html2canvas di-load di index.html
// <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

const downloadKolaseBtn = document.getElementById("downloadKolaseBtn");
buatKolaseBtn.addEventListener("click", () => {
  if (selectedItems.length !== 4) {
    alert("Harus pilih tepat 4 item diverifikasi!");
    return;
  }

  kolasePreview.innerHTML = "";

  selectedItems.forEach((item) => {
    const choice = item.selectedFoto || "foto1";
    const imgSrc = choice === "foto2" ? item.foto2 : item.foto1;

    // ✅ format tanggal dari database
    const dateObj = new Date(item.tanggal);
    const hari = dateObj.toLocaleDateString("id-ID", { weekday: "long" });
    const tglFormat = dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // ✅ jam langsung dari database
    const jam = item.jam || "-";

    // ✅ koordinat + nama lokasi
    const lokasiNama = "SPPG Naila Jasmin";
    const koordinat = "3.2072668,104.6433144,17";
    const mapsUrl = `https://www.google.com/maps?q=${koordinat}&hl=en`;

    const timestamp = `${hari}, ${tglFormat} ${jam}`;

    // ✅ wrapper foto + overlay timestamp + lokasi
    const wrapper = document.createElement("div");
    wrapper.className = "relative w-full h-full";

    const img = document.createElement("img");
    img.src = imgSrc || "";
    img.className = "w-full h-full object-cover";

    const overlay = document.createElement("div");
    overlay.className =
      "absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-[10px] px-1 rounded max-w-[95%]";
    overlay.innerHTML = `
      ${timestamp}<br>
      ${lokasiNama} <a href="${mapsUrl}" target="_blank" class="underline text-blue-300">📍</a>
    `;

    wrapper.appendChild(img);
    wrapper.appendChild(overlay);
    kolasePreview.appendChild(wrapper);
  });

  kolasePreview.className =
    "grid grid-cols-2 grid-rows-2 w-full h-[400px] gap-0 overflow-hidden";
  kolasePreview.classList.remove("hidden");
  downloadKolaseBtn.classList.remove("hidden");
});

function showToast(message, type = "warning") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded shadow z-50 whitespace-pre-line ${
    type === "warning" ? "bg-yellow-600 text-white" : "bg-red-600 text-white"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 6000);
}

function checkReminderBarang() {
  const now = new Date();
  const jam = now.getHours();
  const menit = now.getMinutes();

  // ✅ hanya jalan sekali tepat jam 21:00
  if (jam === 21 && menit === 0) {
    const belumVerifikasi = barangData.filter((item) => !item.verifikasi);

    if (belumVerifikasi.length > 0) {
      // buat daftar nama barang
      const listNama = belumVerifikasi
        .map((item) => `• ${item.nama}`)
        .join("\n");

      showToast(
        `Reminder: Ada ${belumVerifikasi.length} barang belum diverifikasi!\n${listNama}`,
        "warning"
      );
    }
  }
}

// cek setiap menit
setInterval(checkReminderBarang, 60000);

// Download hasil persis dengan preview
downloadKolaseBtn.addEventListener("click", async () => {
  const canvas = await html2canvas(kolasePreview, { useCORS: true });

  // Ambil nama file dari input
  let fileName = document.getElementById("kolaseFileName").value.trim();
  if (!fileName) {
    fileName = "kolase-barang"; // default jika kosong
  }

  const link = document.createElement("a");
  link.download = `${fileName}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

function sortData() {
  filteredData.sort((a, b) => {
    const dateA = new Date(a.tanggal || "1970-01-01");
    const dateB = new Date(b.tanggal || "1970-01-01");
    return sortAscending ? dateA - dateB : dateB - dateA;
  });
}

function renderPagination(totalItems) {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return; // tidak perlu pagination

  // Tombol Sebelumnya
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "« Prev";
  prevBtn.className = `px-3 py-1 rounded ${
    currentPage === 1
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-gray-200 hover:bg-gray-300"
  }`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPagination(filteredData.length);
    }
  });
  pagination.appendChild(prevBtn);

  // Batasi jumlah nomor (misalnya 5)
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `px-3 py-1 rounded ${
      i === currentPage
        ? "bg-primary text-white"
        : "bg-gray-200 hover:bg-gray-300"
    }`;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable();
      renderPagination(filteredData.length);
    });
    pagination.appendChild(btn);
  }

  // Tombol Berikutnya
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next »";
  nextBtn.className = `px-3 py-1 rounded ${
    currentPage === totalPages
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-gray-200 hover:bg-gray-300"
  }`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      renderPagination(filteredData.length);
    }
  });
  pagination.appendChild(nextBtn);
}

async function deleteBarang(id) {
  try {
    await deleteDoc(doc(db, "barang", id));
    alert("Barang berhasil dihapus!");
  } catch (err) {
    console.error("Error hapus barang:", err);
    alert("Gagal menghapus barang.");
  }
}

async function updateTambahan(id, isTambahan) {
  try {
    await updateDoc(doc(db, "barang", id), {
      tambahan: isTambahan,
    });
    console.log("Status tambahan diperbarui:", id, isTambahan);
  } catch (err) {
    console.error("Error update tambahan:", err);
  }
}

function renderTable() {
  barangTable.innerHTML = "";
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach((data, index) => {
    const tr = document.createElement("tr");
    tr.className = data.verifikasi
      ? "bg-green-50 hover:bg-green-100 cursor-pointer"
      : "bg-white hover:bg-gray-50 cursor-pointer";

    tr.innerHTML = `
      <td class="px-4 py-2">${start + index + 1}</td>
      <td class="px-4 py-2">
        ${
          data.foto1
            ? `<img src="${data.foto1}" class="w-16 h-16 object-cover rounded border">`
            : "❌"
        }
      </td>
      <td class="px-4 py-2">
        <div class="font-medium">${data.nama}</div>
        <div class="text-xs text-gray-500">${formatTanggalHari(
          data.tanggal
        )}</div>
      </td>
      <td class="px-4 py-2">${data.jumlahKebutuhan}</td>
      <td class="px-4 py-2">${data.jumlahDatang}</td>
      <td class="px-4 py-2">${data.satuan || "-"}</td>
      <td class="px-4 py-2">${
        data.verifikasi ? "✅ Diverifikasi" : "⏳ Menunggu"
      }</td>
      <td class="px-4 py-2">${
        data.verifikasiAdmin ? "👨‍💼 Admin ✔️" : "❌ Belum"
      }</td>
      <td class="px-4 py-2">
        ${
          data.tambahan
            ? "<span class='text-blue-600 font-semibold'>Tambahan</span>"
            : "<span class='text-gray-500'>Utama</span>"
        }
      </td>
      <td class="px-4 py-2">
        <button class="hapusBtn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-id="${
          data.id
        }">
          Hapus
        </button>
      </td>
    `;

    // klik baris buka detail, kecuali tombol hapus
    tr.addEventListener("click", (e) => {
      if (!e.target.classList.contains("hapusBtn")) {
        openDetailModal(data);
      }
    });

    barangTable.appendChild(tr);
  });

  // Event listener tombol hapus
  document.querySelectorAll(".hapusBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (confirm("Yakin ingin menghapus barang ini?")) {
        await deleteBarang(id);
      }
    });
  });
}

// Firestore listener
onSnapshot(collection(db, "barang"), (snapshot) => {
  barangData = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  applyFilters(); // ✅ langsung pakai filter + sort terbaru
});

// Search filter
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  filteredData = barangData.filter((item) =>
    item.nama.toLowerCase().includes(keyword)
  );
  sortData();
  currentPage = 1;
  renderTable();
  renderPagination(filteredData.length);
});

// // Sort toggle
// sortTanggalBtn.addEventListener("click", () => {
//   sortAscending = !sortAscending;
//   sortData();
//   currentPage = 1;
//   renderTable();
//   renderPagination(filteredData.length);
//   sortTanggalBtn.textContent = sortAscending ? "⬆️" : "⬇️";
// });

document
  .getElementById("filterTanggal")
  .addEventListener("change", applyFilters);
document
  .getElementById("filterStatus")
  .addEventListener("change", applyFilters);

function formatTanggalHari(tanggalStr) {
  if (!tanggalStr) return "-";
  const date = new Date(tanggalStr);
  const hari = date.toLocaleDateString("id-ID", { weekday: "long" });
  const tglFormat = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${hari}, ${tglFormat}`;
}
ini barang js nya
