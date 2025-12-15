import { db } from "./firebase.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const detailModal = document.getElementById("detailModal");
const closeDetail = document.getElementById("closeDetail");
const detailNama = document.getElementById("detailNama");
const detailKebutuhan = document.getElementById("detailKebutuhan");
const detailDatang = document.getElementById("detailDatang");
const newJam = document.getElementById("detailJam");

const detailSatuan = document.getElementById("detailSatuan");
const updateBtn = document.getElementById("updateBtn");
const verifikasiBtn = document.getElementById("verifikasiBtn");

let currentDetailId = null;

const detailFoto = document.getElementById("detailFoto");

export function openDetailModal(data) {
  currentDetailId = data.id;

  document.getElementById("detailNama").value = data.nama;
  document.getElementById("detailKebutuhan").value = data.jumlahKebutuhan;
  document.getElementById("detailDatang").value = data.jumlahDatang || "";
  document.getElementById("detailSatuan").value = data.satuan || "";
  document.getElementById("detailTambahan").textContent = data.tambahan
    ? "Tambahan"
    : "Utama";

  // ✅ isi jam dari database
  document.getElementById("detailJam").value = data.jam || "";

  document.getElementById("detailFoto1").src = data.foto1 || "";
  document.getElementById("detailFoto2").src = data.foto2 || "";

  document.getElementById("detailModal").classList.remove("hidden");
  document.getElementById("detailModal").classList.add("flex");
}

closeDetail.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
});

// Update barang
updateBtn.addEventListener("click", async () => {
  if (!currentDetailId) return;
  await updateDoc(doc(db, "barang", currentDetailId), {
    jumlahDatang: detailDatang.value,
    satuan: detailSatuan.value,
    jam: newJam.value,
  });
  detailModal.classList.add("hidden");
});

// Verifikasi barang
verifikasiBtn.addEventListener("click", async () => {
  if (!currentDetailId) return;
  await updateDoc(doc(db, "barang", currentDetailId), {
    verifikasiAdmin: true, // ✅ admin verifikasi
    verifikasiTanggal: new Date().toLocaleDateString("id-ID"),
    verifikasiJam: new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  detailModal.classList.add("hidden");
});
