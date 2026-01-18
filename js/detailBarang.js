import { db } from "./firebase.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const detailModal = document.getElementById("detailModal");
const closeDetail = document.getElementById("closeDetail");

// Input Fields
const detailNama = document.getElementById("detailNama");
const detailKebutuhan = document.getElementById("detailKebutuhan");
const detailDatang = document.getElementById("detailDatang");
const detailSatuan = document.getElementById("detailSatuan");
const detailJam = document.getElementById("detailJam");
const detailTambahan = document.getElementById("detailTambahan");

// Buttons
const updateBtn = document.getElementById("updateBtn");
const verifikasiBtn = document.getElementById("verifikasiBtn");

// Images
const detailFoto1 = document.getElementById("detailFoto1");
const detailFoto2 = document.getElementById("detailFoto2");

let currentDetailId = null;

export function openDetailModal(data) {
  currentDetailId = data.id;

  // Isi data ke input (Gunakan .value untuk input, .textContent untuk label)
  detailNama.value = data.nama || "";
  detailKebutuhan.value = data.jumlahKebutuhan || 0;
  detailDatang.value = data.jumlahDatang || "";
  detailSatuan.value = data.satuan || "";
  detailJam.value = data.jam || "";
  detailTambahan.textContent = data.tambahan ? "Tambahan" : "Utama";

  // Foto (Gunakan placeholder jika foto kosong)
  detailFoto1.src = data.foto1 || "https://via.placeholder.com/150?text=No+Image";
  detailFoto2.src = data.foto2 || "https://via.placeholder.com/150?text=No+Image";

  detailModal.classList.remove("hidden");
  detailModal.classList.add("flex");
}

closeDetail.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
});

// Update data barang
updateBtn.addEventListener("click", async () => {
  if (!currentDetailId) return;
  
  try {
    const docRef = doc(db, "barang", currentDetailId);
    await updateDoc(docRef, {
      jumlahDatang: detailDatang.value,
      satuan: detailSatuan.value,
      jam: detailJam.value,
    });
    
    alert("Data berhasil diperbarui!");
    detailModal.classList.add("hidden");
  } catch (error) {
    console.error("Gagal update:", error);
    alert("Terjadi kesalahan saat memperbarui data.");
  }
});

// Verifikasi oleh Admin
verifikasiBtn.addEventListener("click", async () => {
  if (!currentDetailId) return;

  const confirmVerif = confirm("Verifikasi barang ini sebagai Admin?");
  if (!confirmVerif) return;

  try {
    const now = new Date();
    await updateDoc(doc(db, "barang", currentDetailId), {
      verifikasiAdmin: true,
      verifikasiTanggal: now.toISOString().split('T')[0], // Format YYYY-MM-DD
      verifikasiJam: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    alert("Barang berhasil diverifikasi oleh Admin!");
    detailModal.classList.add("hidden");
  } catch (error) {
    console.error("Gagal verifikasi:", error);
    alert("Gagal memverifikasi barang.");
  }
});
