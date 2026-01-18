import { db } from "./firebase.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const tambahBarangBtn = document.getElementById("tambahBarangBtn");
const tambahBarangModal = document.getElementById("tambahBarangModal");
const closeTambahBarang = document.getElementById("closeTambahBarang");
const tambahBarangForm = document.getElementById("tambahBarangForm");

tambahBarangBtn.addEventListener("click", () =>
  tambahBarangModal.classList.remove("hidden")
);

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
  const tambahan = document.getElementById("tambahanBaru").checked; // ✅ ambil status tambahan

  await addDoc(collection(db, "barang"), {
    nama: namaBarang,
    jumlahKebutuhan,
    jumlahDatang: 0,
    satuan: "",
    tanggal: new Date().toISOString().split("T")[0],
    jam: new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    verifikasi: false,
    verifikasiAdmin: false,
    tambahan, // ✅ simpan ke Firestore
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Simpan";
  tambahBarangModal.classList.add("hidden");
  showSuccess();
});

