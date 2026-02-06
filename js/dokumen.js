// dokumen.js
// Data dokumen sementara (bisa diganti dengan Firestore)
import { db } from "./firebase.js";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const dokumenTable = document.getElementById("dokumenTable");
const tambahDokumenBtn = document.getElementById("tambahDokumenBtn");
const dokumenModal = document.getElementById("dokumenModal");
const closeDokumenModal = document.getElementById("closeDokumenModal");
const cardSPP = document.getElementById("cardSPP");
const cardRAB = document.getElementById("cardRAB");
let selectedImages = []; // Menampung base64 gambar yang dipilih
let selectedImagesEdit = []; // Menampung base64 gambar yang dipilih di modal edit
// aktifkan table module

let listBarang = [];
let dokumenToDelete = null;
const allowedRoles = ["akuntan", "ka_sppg", "super_admin"];

function openConfirmDelete(docId) {
  dokumenToDelete = docId;
  document.getElementById("modalConfirmDelete").classList.remove("hidden");
}

async function loadKolaseHistoryEdit(existingPhotos = []) {
  const container = document.getElementById("kolaseContainerEdit");
  container.innerHTML = "<p class='text-xs text-gray-500'>Memuat daftar...</p>";
  
  // Set state awal sesuai dengan foto yang sudah ada di dokumen tersebut
  selectedImagesEdit = [...existingPhotos];

  try {
    const querySnapshot = await getDocs(collection(db, "kolase_history"));
    container.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const photoId = docSnap.id;
      const data = docSnap.data();
      const base64Str = data.gambar_base64;
      const namaFile = data.nama_file || "Gambar Tanpa Nama";

      // LOGIKA KUNCI: Cek apakah ID dari history ini ada di array foto_barang dokumen
      const isAlreadySelected = selectedImagesEdit.some(img => img.id === photoId);

      const nameCard = document.createElement("div");
      // Styling: jika terpilih beri warna indigo, jika tidak beri warna gray
      const selectedStyle = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600";
      const unselectedStyle = "border-gray-200 hover:bg-gray-50";
      
      nameCard.className = `cursor-pointer border-2 rounded-lg p-2 text-xs font-medium transition-all flex justify-between items-center ${isAlreadySelected ? selectedStyle : unselectedStyle}`;
      
      nameCard.innerHTML = `
        <span class="truncate pr-2">${namaFile}</span>
        <div class="check-icon ${isAlreadySelected ? '' : 'hidden'} text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      nameCard.addEventListener("click", () => {
        const foundIndex = selectedImagesEdit.findIndex(img => img.id === photoId);
        
        if (foundIndex > -1) {
          // Jika diklik lagi maka hapus (unselect)
          selectedImagesEdit.splice(foundIndex, 1);
          nameCard.className = `cursor-pointer border-2 rounded-lg p-2 text-xs font-medium transition-all flex justify-between items-center ${unselectedStyle}`;
          nameCard.querySelector(".check-icon").classList.add("hidden");
        } else {
          // Jika belum ada maka tambahkan ke array
          selectedImagesEdit.push({ id: photoId, base64: base64Str });
          nameCard.className = `cursor-pointer border-2 rounded-lg p-2 text-xs font-medium transition-all flex justify-between items-center ${selectedStyle}`;
          nameCard.querySelector(".check-icon").classList.remove("hidden");
        }
      });

      container.appendChild(nameCard);
    });
  } catch (err) {
    console.error("Gagal load history:", err);
    container.innerHTML = "Gagal memuat daftar foto.";
  }
}

async function loadKolaseHistory() {
  const container = document.getElementById("kolaseContainer");
  container.innerHTML = "<p class='text-sm text-gray-500'>Memuat daftar gambar...</p>";
  selectedImages = []; // Reset pilihan setiap buka modal baru

  try {
    const querySnapshot = await getDocs(collection(db, "kolase_history"));
    container.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const photoId = docSnap.id;
      const data = docSnap.data();
      const base64Str = data.gambar_base64;
      const namaFile = data.nama_file || "Gambar Tanpa Nama";

      const nameCard = document.createElement("div");
      nameCard.className = "cursor-pointer border-2 border-gray-200 rounded-lg p-3 text-sm font-medium transition-all hover:bg-indigo-50 flex justify-between items-center";
      nameCard.innerHTML = `
        <span class="truncate text-gray-700">${namaFile}</span>
        <div class="check-icon hidden text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      nameCard.addEventListener("click", () => {
        const foundIndex = selectedImages.findIndex(img => img.id === photoId);
        if (foundIndex > -1) {
          selectedImages.splice(foundIndex, 1);
          nameCard.classList.remove("border-indigo-600", "bg-indigo-50", "ring-1");
          nameCard.querySelector(".check-icon").classList.add("hidden");
        } else {
          // Simpan ID dan Base64
          selectedImages.push({ id: photoId, base64: base64Str });
          nameCard.classList.add("border-indigo-600", "bg-indigo-50", "ring-1", "ring-indigo-600");
          nameCard.querySelector(".check-icon").classList.remove("hidden");
        }
      });
      container.appendChild(nameCard);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "Gagal memuat.";
  }
}
async function confirmDeleteDokumen() {
  if (!dokumenToDelete) return;

  const btnText = document.getElementById("btnDeleteText");
  const btnSpinner = document.getElementById("btnDeleteSpinner");

  // tampilkan spinner
  btnText.textContent = "Menghapus...";
  btnSpinner.classList.remove("hidden");

  try {
    await deleteDoc(doc(db, "dokumenBarang", dokumenToDelete));

    // tutup modal konfirmasi
    document.getElementById("modalConfirmDelete").classList.add("hidden");

    // tampilkan modal sukses hapus
    const successModal = document.getElementById("successModal");
    const dialogText = document.getElementById("dialogText");
    dialogText.textContent = "Dokumen berhasil dihapus!";
    successModal.classList.remove("hidden");

    // auto-hide setelah 3 detik
    setTimeout(() => {
      successModal.classList.add("hidden");
    }, 3000);

    // reload tabel
    loadDokumen();
  } catch (err) {
    console.error("Error hapus:", err);
    alert("Gagal menghapus dokumen.");
  } finally {
    // reset tombol
    btnText.textContent = "Hapus";
    btnSpinner.classList.add("hidden");
    dokumenToDelete = null;
  }
}

async function loadImgModulePaksa() {
    if (window.ImageModule) return window.ImageModule;
    
    const response = await fetch("https://cdn.skypack.dev/pin/docxtemplater-image-module-free@v1.1.1-KYSHFVZNjTq5xJ91HYka/mode=raw/build/imageloader.js");
    const scriptText = await response.text();
    
    // Menjalankan script secara manual di scope window
    const script = document.createElement("script");
    script.text = scriptText;
    document.head.appendChild(script);
    
    return window.ImageModule;
}

window.openConfirmDelete = openConfirmDelete;
window.confirmDeleteDokumen = confirmDeleteDokumen;

const jumlahBarang = document.getElementById("jumlahBarang");
const inputJumlahBayar = document.getElementById("hargaBarang");
const totalHarga = document.getElementById("totalHarga");

const jumlahBarangEdit = document.getElementById("jumlahBarangEdit");
const hargaBarangEdit = document.getElementById("hargaBarangEdit");
const totalHargaEdit = document.getElementById("totalHargaEdit");

function updateTotalEdit() {
  const jumlah = parseFloat(jumlahBarangEdit.value) || 0;

  // ambil hanya digit dari input harga
  const rawHarga = hargaBarangEdit.value.replace(/\D/g, "");
  const harga = parseFloat(rawHarga) || 0;

  const total = jumlah * harga;
  totalHargaEdit.value = total.toLocaleString("id-ID");
}

jumlahBarangEdit.addEventListener("input", updateTotalEdit);

hargaBarangEdit.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "");
  if (value) {
    e.target.value = parseInt(value, 10).toLocaleString("id-ID");
  } else {
    e.target.value = "";
  }
  updateTotalEdit(); // panggil setelah format harga
});

function getImageModule() {
  // Cek kemungkinan 1: window.ImageModule (Standar)
  if (typeof window.ImageModule === "function") {
    return window.ImageModule;
  }
  // Cek kemungkinan 2: window.ImageModule.default (ES Module build)
  if (window.ImageModule && typeof window.ImageModule.default === "function") {
    return window.ImageModule.default;
  }
  // Cek kemungkinan 3: Terkadang library terdaftar sebagai ImageLoader
  if (typeof window.ImageLoader === "function") {
    return window.ImageLoader;
  }
  // Cek kemungkinan 4: Cek di dalam namespace Docxtemplater (Beberapa versi)
  if (window.docxtemplater && window.docxtemplater.ImageModule) {
    return window.docxtemplater.ImageModule;
  }
  
  return null;
}

function updateTotal() {
  const jumlah = parseFloat(jumlahBarang.value) || 0;

  // ambil hanya digit dari input harga
  const rawHarga = inputJumlahBayar.value.replace(/\D/g, "");
  const harga = parseFloat(rawHarga) || 0;

  const total = jumlah * harga;
  totalHarga.value = total.toLocaleString("id-ID");
}

jumlahBarang.addEventListener("input", updateTotal);

inputJumlahBayar.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "");
  if (value) {
    e.target.value = parseInt(value, 10).toLocaleString("id-ID");
  } else {
    e.target.value = "";
  }
  updateTotal(); // panggil setelah format harga
});

// 🔑 Ambil angka murni untuk simpan ke DB
function getJumlahBayarRaw() {
  return parseInt(totalHarga.value.replace(/\./g, ""), 10) || 0;
}

function getJumlahBayarRawEdit() {
  return parseInt(totalHargaEdit.value.replace(/\./g, ""), 10) || 0;
}

// Load dokumen dari Firestore
let currentPage = 1;
const itemsPerPage = 10;
let allDocs = [];

async function loadDokumen(page = 1) {
  const querySnapshot = await getDocs(collection(db, "dokumenBarang"));
  allDocs = [];
  querySnapshot.forEach((docSnap) => {
    allDocs.push({ id: docSnap.id, data: docSnap.data() });
  });

  renderPage(page);
}

function renderPage(page) {
  const dokumenBody = document.getElementById("dokumenBody");
  dokumenBody.innerHTML = "";

  if (allDocs.length === 0) {
    dokumenBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-10">
          <p class="text-gray-500">Tidak ada data dokumen</p>
        </td>
      </tr>
    `;
    return;
  }

  currentPage = page;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const docsToShow = allDocs.slice(start, end);

  let index = start + 1;
  docsToShow.forEach(({ id, data }) => {
    const row = document.createElement("tr");
    row.className = "cursor-pointer hover:bg-gray-100";

    const downloadBtn =
      data.status === "Publish"
        ? `<button class="bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-700 text-sm"
             onclick="downloadDokumen('${id}')">Download</button>`
        : "";

    const deleteBtn = `
      <button class="bg-red-600 text-white px-3 py-2 rounded shadow hover:bg-red-700 text-sm"
        onclick="openConfirmDelete('${id}')">Hapus</button>
    `;

    row.innerHTML = `
      <td class="px-4 py-2 text-sm text-gray-700">${index}</td>
      <td class="px-4 py-2 text-sm text-gray-700">${data.namaDokumen}</td>
      <td class="px-4 py-2 text-sm text-gray-700">${data.createdAt}</td>
      <td class="px-4 py-2 text-sm text-gray-700">
        ${data.dibuatOleh?.nama || "-"} - ${data.dibuatOleh?.role || "-"}
      </td>
      <td class="px-4 py-2 text-sm text-gray-700">${data.status || "Draft"}</td>
      <td class="px-4 py-2 text-center space-x-2">
        ${downloadBtn}
        ${deleteBtn}
      </td>
    `;

    // klik baris → buka modal
    row.addEventListener("click", (ev) => {
      if (ev.target.tagName.toLowerCase() === "button") return;

      document.getElementById("editDokumenId").value = id;
      document.getElementById("namaDokumenEdit").value = data.namaDokumen || "";
      document.getElementById("tanggalDokumenEdit").value =
        data.createdAt || "";
      document.getElementById("statusDokumenEdit").value =
        data.status || "Draft";

 // Ambil array foto dari dokumen (pastikan field di Firestore namanya 'foto_barang')
  const existingPhotos = data.foto_barang || []; 
  
  loadKolaseHistoryEdit(existingPhotos);
      
      const tableBody = document.getElementById("tableBodyEdit");
      tableBody.innerHTML = "";
      let i = 1;
      if (data.suppliers) {
        data.suppliers.forEach((supplierNode) => {
          supplierNode.barang.forEach((barang) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td class="px-4 py-2">${i++}</td>
              <td class="px-4 py-2">${barang.namaBarang}</td>
              <td class="px-4 py-2">${barang.jumlahBayar}</td>
              <td class="px-4 py-2">${supplierNode.supplier}</td>
              <td class="px-4 py-2">${barang.nomorRekening || "-"}</td>
              <td class="px-4 py-2">${barang.namaBank || "-"}</td>
            `;
            tableBody.appendChild(tr);
          });
        });
      }

      document.getElementById("editModal").classList.remove("hidden");
    });

    dokumenBody.appendChild(row);
    index++;
  });

  renderPagination();
}

function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(allDocs.length / itemsPerPage);

  // tombol Prev
  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Sebelumnya";
    prevBtn.className = "px-3 py-1 bg-gray-200 rounded mx-1";
    prevBtn.onclick = () => renderPage(currentPage - 1);
    pagination.appendChild(prevBtn);
  }

  // nomor halaman
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.className =
      "px-3 py-1 rounded mx-1 " +
      (i === currentPage ? "bg-indigo-600 text-white" : "bg-gray-200");
    pageBtn.onclick = () => renderPage(i);
    pagination.appendChild(pageBtn);
  }

  // tombol Next
  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Selanjutnya";
    nextBtn.className = "px-3 py-1 bg-gray-200 rounded mx-1";
    nextBtn.onclick = () => renderPage(currentPage + 1);
    pagination.appendChild(nextBtn);
  }
}

// Tombol Tutup modal
document.getElementById("sppCloseBtn").addEventListener("click", () => {
  document.getElementById("sppModal").classList.add("hidden");
});

document.getElementById("updateCloseBtn").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

function openEditModal(docId, data) {
  document.getElementById("editDokumenId").value = docId;
  document.getElementById("namaDokumen").value = data.namaDokumen || "";
  document.getElementById("tanggalDokumen").value = data.createdAt || "";
  document.getElementById("statusDokumen").value = data.status || "Draft";
  document.getElementById("sppModal").classList.remove("hidden");
}

const supplierData = {
  koperasi: {
    supplier: "Koperasi AGUNA SAKTI SEJAHTERA",
    namaBank: "BRI",
    nomorRekening:
      "227201000908562 A.n Koperasi Konsumen Aguna Sakti Sejahterah",
  },
  yuliati: {
    supplier: "Yuliati",
    namaBank: "BRI",
    nomorRekening: "563701020004501",
  },
  ika: {
    supplier: "IKA VEBRIANA",
    namaBank: "BRI",
    nomorRekening: "770701004777535",
  },
};

let counter = 1;

document.getElementById("formBarang").addEventListener("submit", (e) => {
  e.preventDefault();

  const supplierKey = document.getElementById("supplier").value;
  const supplierInfo = supplierData[supplierKey];
  const namaBarang = document.getElementById("namaBarang").value;
  const jumlahBayar = getJumlahBayarRaw();
  const itemData = {
    namaBarang,
    jumlahBayar,
    supplier: supplierInfo.supplier,
    namaBank: supplierInfo.namaBank,
    nomorRekening: supplierInfo.nomorRekening,
    createdAt: new Date(),
  };

  // ✅ cek duplikat
  const exists = listBarang.some(
    (b) => b.namaBarang === namaBarang && b.supplier === supplierInfo.supplier
  );
  if (exists) {
    alert("Barang sudah ada di list.");
    return;
  }

  listBarang.push(itemData);

  // render ke tabel preview
  const tableBody = document.getElementById("tableBody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="text-center">${listBarang.length}</td>
    <td class="text-center">${namaBarang}</td>
    <td class="text-center">Rp. ${jumlahBayar}</td>
    <td class="text-center">${supplierInfo.supplier}</td>
    <td class="text-center">${supplierInfo.nomorRekening}</td>
    <td class="text-center">${supplierInfo.namaBank}</td>
  `;
  tableBody.appendChild(row);

  e.target.reset();
});

// array khusus barang edit
let listBarangEdit = [];

document.getElementById("formBarangEdit").addEventListener("submit", (e) => {
  e.preventDefault();

  const supplierKey = document.getElementById("supplierEdit").value;
  const supplierInfo = supplierData[supplierKey];
  const namaBarang = document.getElementById("namaBarangEdit").value;
  const jumlahBayar = getJumlahBayarRawEdit("Edit"); // bisa buat fungsi khusus untuk ambil jumlah dari form edit
  const itemData = {
    namaBarang,
    jumlahBayar,
    supplier: supplierInfo.supplier,
    namaBank: supplierInfo.namaBank,
    nomorRekening: supplierInfo.nomorRekening,
    createdAt: new Date(),
  };

  // ✅ cek duplikat
  const exists = listBarangEdit.some(
    (b) => b.namaBarang === namaBarang && b.supplier === supplierInfo.supplier
  );
  if (exists) {
    alert("Barang sudah ada di list edit.");
    return;
  }

  listBarangEdit.push(itemData);

  // render ke tabel edit
  const tableBody = document.getElementById("tableBodyEdit");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${listBarangEdit.length}</td>
    <td>${namaBarang}</td>
    <td>Rp. ${jumlahBayar}</td>
    <td>${supplierInfo.supplier}</td>
    <td>${supplierInfo.nomorRekening}</td>
    <td>${supplierInfo.namaBank}</td>
  `;
  tableBody.appendChild(row);

  e.target.reset();
});

document
  .getElementById("updateDatabase")
  .addEventListener("click", async () => {
    const docId = document.getElementById("editDokumenId").value;
    const namaDokumen = document.getElementById("namaDokumenEdit").value.trim();
    const tanggalDokumen = formatTanggalDokumen(
      document.getElementById("tanggalDokumenEdit").value
    );
    const statusDokumen = document.getElementById("statusDokumenEdit").value;

    try {
      const docRef = doc(db, "dokumenBarang", docId);
      const oldSnap = await getDoc(docRef);
      let oldSuppliers = [];
      if (oldSnap.exists()) {
        oldSuppliers = oldSnap.data().suppliers || [];
      }

      // gabungkan barang baru ke supplier lama
      listBarangEdit.forEach((item) => {
        let supplierNode = oldSuppliers.find(
          (s) => s.supplier === item.supplier
        );
        if (!supplierNode) {
          supplierNode = { supplier: item.supplier, barang: [] };
          oldSuppliers.push(supplierNode);
        }
        supplierNode.barang.push({
          namaBarang: item.namaBarang,
          jumlahBayar: item.jumlahBayar,
          namaBank: item.namaBank,
          nomorRekening: item.nomorRekening,
          createdAt: item.createdAt,
        });
      });

      // 🔑 ambil user info untuk role
      const userId = localStorage.getItem("userId");
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      let dibuatOleh = { nama: "anonymous", role: "unknown" };
      if (userSnap.exists()) {
        const dataUser = userSnap.data();
        dibuatOleh = {
          nama: dataUser.nama || "anonymous",
          role: dataUser.role || "unknown",
        };
      }

      await updateDoc(docRef, {
        namaDokumen,
        createdAt: tanggalDokumen,
        status: statusDokumen,
        suppliers: oldSuppliers,
   foto_barang: selectedImagesEdit,
        totalBayar: oldSuppliers.reduce(
          (sum, s) =>
            sum +
            s.barang.reduce(
              (subSum, b) => subSum + parseInt(b.jumlahBayar || 0, 10),
              0
            ),
          0
        ),
        dibuatOleh, // ✅ tambahkan role & nama pembuat
      });

      document.getElementById("editModal").classList.add("hidden");
      loadDokumen();
      listBarangEdit = [];
      document.getElementById("tableBodyEdit").innerHTML = "";

      alert("✅ Dokumen berhasil diupdate, termasuk role pembuat!");
      location.reload(); // 🔄 langsung refresh halaman
    } catch (err) {
      console.error("Error update:", err);
      alert("❌ Gagal update dokumen.");
    }
  });

async function downloadDokumen(docId) {
  try {
    const docSnap = await getDoc(doc(db, "dokumenBarang", docId));
    if (!docSnap.exists()) {
      alert("Dokumen tidak ditemukan");
      return;
    }
    const data = docSnap.data();

    // Fungsi pembersih untuk menghapus header data:image/xxx;base64,
    const cleanBase64 = (base64String) => {
        if (!base64String) return "";
        return base64String.includes(',') ? base64String.split(',')[1] : base64String;
    };

    const listFoto = data.foto_barang || []; 
    const fotoGrid = [];

    // Mapping ke dalam struktur Baris & Kolom
    for (let i = 0; i < listFoto.length; i += 2) {
        const barisData = [];
        
        // Foto 1 - PERBAIKAN DI SINI (Gunakan cleanBase64)
        if (listFoto[i]) {
            const raw = listFoto[i].base64 || listFoto[i];
            barisData.push({ imgData: cleanBase64(raw) });
        }
        
        // Foto 2 - PERBAIKAN DI SINI (Gunakan cleanBase64)
        if (listFoto[i + 1]) {
            const raw = listFoto[i+1].base64 || listFoto[i+1];
            barisData.push({ imgData: cleanBase64(raw) });
        }
        
        fotoGrid.push({ baris: barisData });
    }

    const response = await fetch("templates/SURAT_PERMINTAAN_PEMBAYARAN_TEMPLATE.docx");
    const content = await response.arrayBuffer();
    const zip = new window.PizZip(content);
    
  // SESUAI REFERENSI: Handler untuk ImageModule
 // SESUAI REFERENSI: Handler untuk ImageModule
    const imageOptions = {
        centered: false,
        getImage: function (tagValue) {
            // tagValue adalah string base64 dari imgData
            const base64Part = tagValue.split(",")[1] || tagValue;
            const binaryString = window.atob(base64Part);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        },
        getSize: function () {
            return [200, 150]; // [Lebar, Tinggi] dalam pixel
        }
    };

    const imageModule = new ImageModule(imageOptions);
    
    const docx = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule],
    });

// --- 1. PROSES GRUP SUPPLIER (FIX) ---
 // --- PROSES GRUP SUPPLIER ---
const groupedSuppliers = (data.suppliers || []).map((s) => {
    // Hitung total harga HANYA untuk supplier ini
    const totalSatuSupplier = s.barang.reduce((sum, b) => sum + parseInt(b.jumlahBayar || 0), 0);

    return {
        // Data ini muncul sekali di bawah daftar barang
        totalSupplierFormatted: "Rp. " + totalSatuSupplier.toLocaleString("id-ID"),
        
        // Loop barang-barang
        barang: (s.barang || []).map((b, idx) => ({
            no: idx + 1,
            namaBarang: b.namaBarang,
            jumlahBayarFormatted: "Rp. " + parseInt(b.jumlahBayar || 0).toLocaleString("id-ID"),
            
            // Hanya isi di baris pertama (idx === 0)
            supplierCell: idx === 0 ? s.supplier : "",
            namaBankCell: idx === 0 ? (b.namaBank || "-") : "",
            nomorRekeningCell: idx === 0 ? (b.nomorRekening || "-") : ""
        }))
    };
});
    const dataKirim = {
    namaDokumen: data.namaDokumen,
    createdAt: data.createdAt,
    totalBayar: "Rp. " + (data.totalBayar || 0).toLocaleString("id-ID"),
    suppliers: groupedSuppliers,
    fotoGrid: fotoGrid 
};

    docx.setData(dataKirim);

    console.log("FINAL DATA TO WORD:", JSON.stringify(dataKirim, null, 2)); // Cek strukturnya di sini

    docx.render();

    const out = docx.getZip().generate({ type: "blob" });
    saveAs(out, `${data.namaDokumen}.docx`);

  } catch (err) {
    console.error("Error generate Word:", err);
    alert("Gagal membuat dokumen Word: " + err.message);
  }
}

// Helper untuk membersihkan string base64
function base64Parser(dataURL) {
  if (typeof dataURL !== "string" || !dataURL.includes(",")) return dataURL;
  const base64Part = dataURL.split(",")[1];
  const binaryString = window.atob(base64Part);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatRupiahWithTab(value) {
  return "Rp.   " + value.toLocaleString("id-ID");
}

window.downloadDokumen = downloadDokumen;

// // ✅ event listener tombol download
// document.addEventListener("click", (e) => {
//   if (e.target.classList.contains("downloadBtn")) {
//     const id = e.target.getAttribute("data-id");
//     downloadSPP(id);
//   }
// });

tambahDokumenBtn.addEventListener("click", () => {
  dokumenModal.classList.remove("hidden");
  dokumenModal.classList.add("flex");
  selectedImages = []; // Reset pilihan setiap buka modal
  loadKolaseHistory();
});

closeDokumenModal.addEventListener("click", () => {
  dokumenModal.classList.add("hidden");
  dokumenModal.classList.remove("flex");
});

// ✅ aksi klik card
// cardSPP.addEventListener("click", () => {
//   dokumenData.push({
//     nama: "Surat Permintaan Bayar",
//     url: "#",
//     tanggal: new Date().toISOString().split("T")[0],
//     penulis: "Admin",
//   });
//   renderDokumen();
//   dokumenModal.classList.add("hidden");
// });

cardRAB.addEventListener("click", () => {
  dokumenData.push({
    nama: "Rincian Anggaran Biaya (RAB)",
    url: "#",
    tanggal: new Date().toISOString().split("T")[0],
    penulis: "Admin",
  });
  renderDokumen();
  dokumenModal.classList.add("hidden");
});

const sppModal = document.getElementById("sppModal");
const sppNamaDokumen = document.getElementById("sppNamaDokumen");
const sppNamaBarang = document.getElementById("sppNamaBarang");
const sppJumlahBayar = document.getElementById("sppJumlahBayar");
const sppSupplier = document.getElementById("sppSupplier");
const sppBarangTable = document.getElementById("sppBarangTable");

let sppItems = [];

// ✅ buka modal SPP dengan validasi
document.getElementById("cardSPP").addEventListener("click", () => {
  console.log(hasAccess());
  if (hasAccess()) {
    sppModal.classList.remove("hidden");
    sppModal.classList.add("flex");
  } else {
    document.getElementById("noAccessDialog").classList.remove("hidden");
  }
});

const userId = localStorage.getItem("userId");

const userRef = doc(db, "users", userId);
const userSnap = await getDoc(userRef);

const data = userSnap.data();

// fungsi cek izin
function hasAccess() {
  console.log(data.role);
  return allowedRoles.includes(data.role);
}

// ✅ tutup modal
document.getElementById("sppCloseBtn").addEventListener("click", () => {
  sppModal.classList.add("hidden");
  sppModal.classList.remove("flex");
});

// tombol tutup dialog
document.getElementById("closeDialog").addEventListener("click", () => {
  document.getElementById("noAccessDialog").classList.add("hidden");
});

// ✅ tambah barang ke list

function renderSppItems() {
  sppBarangTable.innerHTML = "";
  sppItems.forEach((item) => {
    sppBarangTable.innerHTML += `
      <tr>
        <td class="border px-2 py-1">${item.namaBarang}</td>
        <td class="border px-2 py-1">${item.jumlahBayar}</td>
        <td class="border px-2 py-1">${item.supplier}</td>
      </tr>
    `;
  });
}

async function simpanDokumen(items) {
  if (items.length === 0) {
    alert("List barang masih kosong.");
    return;
  }

  const editId = document.getElementById("editDokumenId")?.value || "";
  const namaDokumen = document.getElementById("namaDokumen").value.trim();
  const tanggalInput = formatTanggalDokumen(
    document.getElementById("tanggalDokumen").value
  );
  const statusDokumen = document.getElementById("statusDokumen").value;
  const tanggalFormatted = formatTanggalDokumen(tanggalInput);
  

  try {
    // 🔑 ambil user info untuk role
    const userId = localStorage.getItem("userId");
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    let dibuatOleh = { nama: "anonymous", role: "unknown" };
    if (userSnap.exists()) {
      const dataUser = userSnap.data();
      dibuatOleh = {
        nama: dataUser.nama || "anonymous",
        role: dataUser.role || "unknown",
      };
    }

    // 🔑 Simpan dokumen baru
    await addDoc(collection(db, "dokumenBarang"), {
      namaDokumen,
      createdAt: tanggalFormatted,
      status: statusDokumen,
   foto_barang: selectedImages,
      dibuatOleh, // ✅ tambahkan nama & role pembuat
      suppliers: items.map((item) => ({
        supplier: item.supplier,
        barang: [
          {
            namaBarang: item.namaBarang,
            jumlahBayar: item.jumlahBayar,
            namaBank: item.namaBank,
            nomorRekening: item.nomorRekening,
            createdAt: item.createdAt,
          },
        ],
      })),
      totalBayar: items.reduce(
        (sum, item) => sum + parseInt(item.jumlahBayar, 10),
        0
      ),
    });

    alert("✅ Dokumen baru berhasil disimpan dengan role pembuat!");
    location.reload(); // 🔄 langsung refresh halaman
  } catch (err) {
    console.error("Error simpan:", err);
    alert("❌ Gagal menyimpan dokumen.");
  }
}
// Simpan dokumen ke Firestore
document.getElementById("saveDatabase").addEventListener("click", async () => {
  simpanDokumen(listBarang);
});

function formatTanggalDokumen(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// contoh penggunaan

// hasil: "06 November 2025"

// ✅ simpan ke Firestore

// ✅ Panggil render pertama kali
loadDokumen();










