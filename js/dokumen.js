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
// aktifkan table module

let listBarang = [];
let dokumenToDelete = null;
const allowedRoles = ["akuntan", "ka_sppg", "super_admin"];

function openConfirmDelete(docId) {
  dokumenToDelete = docId;
  document.getElementById("modalConfirmDelete").classList.remove("hidden");
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

window.openConfirmDelete = openConfirmDelete;
window.confirmDeleteDokumen = confirmDeleteDokumen;

const inputJumlahBayar = document.getElementById("jumlahBayar");

inputJumlahBayar.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, ""); // ambil hanya digit
  if (value) {
    e.target.value = parseInt(value, 10).toLocaleString("id-ID");
  } else {
    e.target.value = "";
  }
});

// 🔑 Ambil angka murni untuk simpan ke DB
function getJumlahBayarRaw() {
  return parseInt(inputJumlahBayar.value.replace(/\./g, ""), 10) || 0;
}

// Load dokumen dari Firestore
async function loadDokumen() {
  const querySnapshot = await getDocs(collection(db, "dokumenBarang"));
  const dokumenBody = document.getElementById("dokumenBody");
  dokumenBody.innerHTML = "";

  let index = 1; // 🔑 nomor urut manual

  if (querySnapshot.empty) {
    dokumenBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-10">
          <div class="flex flex-col items-center justify-center">
           
                
            <p class="text-gray-500">Tidak ada data dokumen</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="px-4 py-2 text-sm text-gray-700">${index}</td>
      <td class="px-4 py-2 text-sm text-gray-700">${data.namaDokumen}</td>
      <td class="px-4 py-2 text-sm text-gray-700">${data.createdAt}</td>
      <td class="px-4 py-2 text-sm text-gray-700">
        ${data.dibuatOleh?.nama || "-"} - ${data.dibuatOleh?.role || "-"}
      </td>
      <td class="px-4 py-2 text-center space-x-2">
        <button class="bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-700 text-sm"
          onclick="downloadDokumen('${doc.id}')">Download</button>
        <button class="bg-red-600 text-white px-3 py-2 rounded shadow hover:bg-red-700 text-sm"
          onclick="openConfirmDelete('${doc.id}')">Hapus</button>
      </td>
    `;

    dokumenBody.appendChild(row);
    index++;
  });
}
const supplierData = {
  koperasi: {
    supplier: "Koperasi AGUNA SAKTI SEJAHTERA",
    namaBank: "BRI",
    nomorRekening: "227201000908562 A.n ANTONI",
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
    <td>${listBarang.length}</td>
    <td>${namaBarang}</td>
    <td>Rp. ${jumlahBayar}</td>
    <td>${supplierInfo.supplier}</td>
    <td>${supplierInfo.nomorRekening}</td>
    <td>${supplierInfo.namaBank}</td>
  `;
  tableBody.appendChild(row);

  e.target.reset();
});

async function downloadDokumen(docId) {
  try {
    // 1. Ambil dokumen induk dari Firestore
    const docSnap = await getDoc(doc(db, "dokumenBarang", docId));
    if (!docSnap.exists()) {
      alert("Dokumen tidak ditemukan");
      return;
    }
    const data = docSnap.data();

    // 2. Format createdAt agar bisa ditampilkan
    const createdAt = data.createdAt?.seconds
      ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
      : "";

    // 3. Ambil suppliers tree dari dokumen

    // 4. Load template Word
    const response = await fetch(
      "templates/SURAT_PERMINTAAN_PEMBAYARAN_TEMPLATE.docx"
    );
    const content = await response.arrayBuffer();

    const zip = new window.PizZip(content);

    const docx = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    let counter = 1;

    const suppliers = data.suppliers.map((s) => {
      const totalSupplier = s.barang.reduce((sum, b) => sum + b.jumlahBayar, 0);

      return {
        supplier: s.supplier,
        barang: s.barang.map((b, idx) => ({
          ...b,
          no: String(counter++), // nomor global
          supplier: idx === 0 ? s.supplier : "", // supplier sekali saja
          namaBank: idx === 0 ? b.namaBank : "",
          nomorRekening: idx === 0 ? b.nomorRekening : "",
          jumlahBayarFormatted: "Rp. " + b.jumlahBayar.toLocaleString("id-ID"),
        })),
        totalSupplierFormatted: "Rp. " + totalSupplier.toLocaleString("id-ID"), // 🔑 untuk row jumlah manual
      };
    });

    docx.setData({
      namaDokumen: data.namaDokumen,
      createdAt: data.createdAt,
      totalBayar: "Rp. " + data.totalBayar.toLocaleString("id-ID"),
      suppliers,
    });

    // 6. Render dan download
    docx.render();

    const out = docx.getZip().generate({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(out);
    link.download = `${data.namaDokumen}.docx`;
    link.click();
  } catch (err) {
    console.error("Error generate Word:", err);
    alert("Gagal membuat dokumen Word");
  }
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

  try {
    // 1. Bentuk tree suppliers → barang
    const suppliersTree = [];

    items.forEach((item) => {
      let supplierNode = suppliersTree.find(
        (s) => s.supplier === item.supplier
      );
      if (!supplierNode) {
        supplierNode = { supplier: item.supplier, barang: [] };
        suppliersTree.push(supplierNode);
      }
      supplierNode.barang.push({
        namaBarang: item.namaBarang,
        jumlahBayar: item.jumlahBayar,
        namaBank: item.namaBank,
        nomorRekening: item.nomorRekening,
        createdAt: item.createdAt,
      });
    });

    const namaDokumen = document.getElementById("namaDokumen").value;
    const tanggalInput = document.getElementById("tanggalDokumen").value; // "2025-11-06"
    const tanggalFormatted = formatTanggalDokumen(tanggalInput);

    // 🔑 Nomor dokumen otomatis (misalnya timestamp + counter)
    const nomorDokumen = Date.now(); // atau bisa pakai counter dari Firestore

    const userId = localStorage.getItem("userId");

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      // 🔑 User role (misalnya dari session/login)
      // Pastikan kamu punya variabel global currentUserRole yang di-set saat login
      const userRole = data.role || "unknown";
      const userName = data.nama || "anonymous"; // bisa ambil dari auth

      // 2. Simpan dokumen induk dengan tree suppliers
      const docRef = await addDoc(collection(db, "dokumenBarang"), {
        nomorDokumen: nomorDokumen,
        namaDokumen: namaDokumen,
        createdAt: tanggalFormatted,
        dibuatOleh: {
          nama: userName,
          role: userRole, // admin, akuntan, ahli gizi, super admin
        },
        totalBayar: items.reduce(
          (sum, item) => sum + parseInt(item.jumlahBayar, 10),
          0
        ),
        suppliers: suppliersTree, // 🔑 simpan tree supplier → barang
      });

      alert("Dokumen & tree supplier-barang berhasil disimpan!");

      // reset list & tabel preview
      listBarang = [];
      document.getElementById("tableBody").innerHTML = "";
    }
  } catch (err) {
    console.error("Error simpan:", err);
    alert("Gagal menyimpan dokumen.");
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
