import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBC598epFdcqsFp9cg3y9-Fi40PvpGX44I",
  authDomain: "nailajasmin-c3d98.firebaseapp.com",
  projectId: "nailajasmin-c3d98",
  storageBucket: "nailajasmin-c3d98.firebasestorage.app",
  messagingSenderId: "179905162603",
  appId: "1:179905162603:web:f39f966d49b4719eeb302e",
  measurementId: "G-V7220VWRK2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sidebar navigation
const berandaSection = document.getElementById("berandaSection");
const barangSection = document.getElementById("barangSection");
document.getElementById("menuBeranda").addEventListener("click", () => {
  berandaSection.classList.remove("hidden");
  barangSection.classList.add("hidden");
});
document.getElementById("menuBarang").addEventListener("click", () => {
  barangSection.classList.remove("hidden");
  berandaSection.classList.add("hidden");
});

function sortByLatest() {
  filteredData.sort(
    (a, b) =>
      new Date(b.tanggal || "1970-01-01") - new Date(a.tanggal || "1970-01-01")
  );
}

// Modal Tambah Barang
const tambahBarangBtn = document.getElementById("tambahBarangBtn");
const tambahBarangModal = document.getElementById("tambahBarangModal");
const closeTambahBarang = document.getElementById("closeTambahBarang");
tambahBarangBtn.addEventListener("click", () =>
  tambahBarangModal.classList.remove("hidden")
);
closeTambahBarang.addEventListener("click", () =>
  tambahBarangModal.classList.add("hidden")
);

// Success modal
function showSuccess() {
  const box = document.getElementById("successModal").firstElementChild;
  document.getElementById("successModal").classList.remove("hidden");
  setTimeout(() => {
    box.classList.remove("opacity-0", "scale-90");
    box.classList.add("opacity-100", "scale-100");
  }, 50);
  setTimeout(() => {
    box.classList.remove("opacity-100", "scale-100");
    box.classList.add("opacity-0", "scale-90");
    setTimeout(
      () => document.getElementById("successModal").classList.add("hidden"),
      500
    );
  }, 3000);
}

// Tambah barang form
const tambahBarangForm = document.getElementById("tambahBarangForm");
tambahBarangForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = tambahBarangForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
  </svg>`;

  const namaBarang = document.getElementById("namaBarangBaru").value;
  const jumlahKebutuhan = document.getElementById("jumlahKebutuhanBaru").value;

  await addDoc(collection(db, "barang"), {
    nama: namaBarang,
    jumlahKebutuhan,
    jumlahDatang: 0,
    satuan: "",
    tanggal: "",
    jam: "",
    verifikasi: false,
    verifikasiAdmin: false,
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Simpan";
  tambahBarangModal.classList.add("hidden");
  showSuccess();
});

// Load barang ke tabel
const barangTable = document.getElementById("barangTable");
onSnapshot(collection(db, "barang"), (snapshot) => {
  barangTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const tr = document.createElement("tr");

    // Background berbeda sesuai status verifikasi
    tr.className = data.verifikasi
      ? "bg-green-100 cursor-pointer hover:bg-green-200"
      : "bg-white cursor-pointer hover:bg-gray-100";

    tr.innerHTML = `
      <td class="border p-2">${data.nama}</td>
      <td class="border p-2">${data.jumlahKebutuhan}</td>
      <td class="border p-2">${data.jumlahDatang}</td>
      <td class="border p-2">${data.satuan || "-"}</td>
      <td class="border p-2">${
        data.verifikasi ? "✅ Diverifikasi" : "⏳ Menunggu"
      }</td>
    `;

    // Klik item → tampilkan detail (bisa arahkan ke modal detail)
    tr.addEventListener("click", () => {
      alert(
        `Detail Barang:\nNama: ${data.nama}\nKebutuhan: ${data.jumlahKebutuhan}\nDatang: ${data.jumlahDatang}`
      );
    });

    barangTable.appendChild(tr);
  });
});
