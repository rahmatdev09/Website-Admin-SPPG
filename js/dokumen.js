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
async function loadDokumen() {
  const querySnapshot = await getDocs(collection(db, "dokumenBarang"));
  const dokumenBody = document.getElementById("dokumenBody");
  dokumenBody.innerHTML = "";

  let index = 1;

  if (querySnapshot.empty) {
    dokumenBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-10">
          <p class="text-gray-500">Tidak ada data dokumen</p>
        </td>
      </tr>
    `;
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = document.createElement("tr");
    row.className = "cursor-pointer hover:bg-gray-100";

    // 🔑 tombol download hanya jika status Publish
    const downloadBtn =
      data.status === "Publish"
        ? `<button class="bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-700 text-sm"
             onclick="downloadDokumen('${docSnap.id}')">Download</button>`
        : "";

    // 🔑 tombol hapus selalu ada
    const deleteBtn = `
      <button class="bg-red-600 text-white px-3 py-2 rounded shadow hover:bg-red-700 text-sm"
        onclick="openConfirmDelete('${docSnap.id}')">Hapus</button>
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

    // 🔑 klik baris → buka modal dengan data terisi
    row.addEventListener("click", (ev) => {
      if (ev.target.tagName.toLowerCase() === "button") return;

      // isi hidden id
      document.getElementById("editDokumenId").value = docSnap.id;

      // isi input dokumen
      document.getElementById("namaDokumenEdit").value = data.namaDokumen || "";
      document.getElementById("tanggalDokumenEdit").value =
        data.createdAt || "";
      document.getElementById("statusDokumenEdit").value =
        data.status || "Draft";

      // isi tabel barang
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

      // tampilkan modal
      document.getElementById("editModal").classList.remove("hidden");
    });

    dokumenBody.appendChild(row);
    index++;
  });
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
          no: String(counter++),
          supplier: idx === 0 ? s.supplier : "",
          namaBank: idx === 0 ? b.namaBank : "",
          nomorRekening: idx === 0 ? b.nomorRekening : "",
          jumlahBayarFormatted: "Rp. " + b.jumlahBayar.toLocaleString("id-ID"),
        })),
        // 🔑 total per supplier
        totalSupplierFormatted: "Rp. " + totalSupplier.toLocaleString("id-ID"),
      };
    });

    docx.setData({
      namaDokumen: data.namaDokumen,
      createdAt: data.createdAt,
      totalBayar: "Rp. " + data.totalBayar.toLocaleString("id-ID"),
      suppliers,
    });

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
