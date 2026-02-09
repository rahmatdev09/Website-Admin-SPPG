import { db } from "./firebase.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- 1. SELEKSI ELEMEN UI ---
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

// --- ELEMEN MODAL CUSTOM (MODAL CONFIRM & SUCCESS) ---
const confirmModal = document.getElementById("confirmModal");
const successModal = document.getElementById("successModal");
const okConfirmBtn = document.getElementById("okConfirm");
const cancelConfirmBtn = document.getElementById("cancelConfirm");
const closeSuccessBtn = document.getElementById("closeSuccess");

let currentDetailId = null;

// Helper Fungsi Sukses
const showSuccess = (msg) => {
  document.getElementById("successMessage").innerText = msg;
  successModal.classList.remove("hidden");
};

// --- 2. FUNGSI BUKA MODAL ---
export function openDetailModal(data) {
  currentDetailId = data.id;

  if (detailNama) detailNama.value = data.nama || "";
  if (detailKebutuhan) detailKebutuhan.value = data.jumlahKebutuhan || 0;
  if (detailDatang) detailDatang.value = data.jumlahDatang || "";
  if (detailSatuan) detailSatuan.value = data.satuan || "";
  if (detailJam) detailJam.value = data.jam || "";

  if (detailTambahan) {
    detailTambahan.textContent = data.tambahan
      ? "BARANG TAMBAHAN"
      : "BARANG UTAMA";
    detailTambahan.className = data.tambahan
      ? "bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold"
      : "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold";
  }

  const noImage = "https://via.placeholder.com/400x300?text=Tidak+Ada+Foto";
  if (detailFoto1) detailFoto1.src = data.foto1 || noImage;
  if (detailFoto2) detailFoto2.src = data.foto2 || noImage;

  detailModal.classList.remove("hidden");
  detailModal.classList.add("flex");
}

// --- 3. EVENT LISTENER: UPDATE DATA ---
updateBtn.addEventListener("click", async () => {
  if (!currentDetailId) return;

  const originalText = updateBtn.innerText;
  updateBtn.disabled = true;
  updateBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...`;

  try {
    const docRef = doc(db, "barang", currentDetailId);
    await updateDoc(docRef, {
      jumlahDatang: detailDatang.value,
      satuan: detailSatuan.value,
      jam: detailJam.value,
      jumlahKebutuhan: detailKebutuhan.value,
    });

    detailModal.classList.replace("flex", "hidden");
    showSuccess("Data barang berhasil diperbarui!");
  } catch (error) {
    console.error("Gagal update:", error);
  } finally {
    updateBtn.disabled = false;
    updateBtn.innerText = originalText;
  }
});

// --- 4. EVENT LISTENER: VERIFIKASI ADMIN (DENGAN MODAL KONFIRMASI) ---
verifikasiBtn.addEventListener("click", () => {
  if (!currentDetailId) return;

  // Sesuaikan tampilan modal konfirmasi untuk APPROVE (Bukan Hapus)
  const confirmTitle = confirmModal.querySelector("h3");
  const confirmDesc = confirmModal.querySelector("p");
  const confirmIcon = confirmModal.querySelector(".fa-trash-can");
  const confirmIconContainer = confirmIcon?.parentElement;

  if (confirmTitle) confirmTitle.innerText = "KONFIRMASI APPROVAL";
  if (confirmDesc)
    confirmDesc.innerText =
      "Apakah Anda yakin ingin memberikan persetujuan (Approve) pada barang ini?";
  if (okConfirmBtn) {
    okConfirmBtn.innerText = "YA, APPROVE";
    okConfirmBtn.classList.replace("bg-red-600", "bg-green-600");
  }
  // Ubah icon tong sampah menjadi check
  if (confirmIcon)
    confirmIcon.className = "fa-solid fa-file-circle-check text-2xl";
  if (confirmIconContainer)
    confirmIconContainer.classList.replace("bg-red-50", "bg-green-50");
  if (confirmIconContainer)
    confirmIconContainer.classList.replace("text-red-500", "text-green-500");

  confirmModal.classList.remove("hidden");

  // Aksi saat klik "YA, APPROVE"
  okConfirmBtn.onclick = async () => {
    confirmModal.classList.add("hidden");

    verifikasiBtn.disabled = true;
    verifikasiBtn.innerHTML = `<i class="fa-solid fa-check-double animate-pulse"></i> Memproses...`;

    try {
      const now = new Date();
      const docRef = doc(db, "barang", currentDetailId);

      await updateDoc(docRef, {
        verifikasiAdmin: true,
        verifikasiTanggalAdmin: now.toISOString().split("T")[0],
        verifikasiJamAdmin: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      detailModal.classList.replace("flex", "hidden");
      showSuccess("Barang BERHASIL diverifikasi (Approved)!");
    } catch (error) {
      console.error("Gagal verifikasi:", error);
    } finally {
      verifikasiBtn.disabled = false;
      verifikasiBtn.innerText = "Verifikasi Sekarang";

      // Kembalikan desain modal konfirmasi ke default (Hapus) agar tidak merusak fungsi hapus di barang.js
      setTimeout(resetConfirmModal, 500);
    }
  };
});

// Fungsi Reset Modal Konfirmasi ke tema "Hapus" (Default)
function resetConfirmModal() {
  const confirmTitle = confirmModal.querySelector("h3");
  const confirmDesc = confirmModal.querySelector("p");
  const confirmIcon = confirmModal.querySelector(".fa-file-circle-check");
  const confirmIconContainer = confirmModal.querySelector(".bg-green-50");

  if (confirmTitle) confirmTitle.innerText = "Konfirmasi Hapus";
  if (confirmDesc)
    confirmDesc.innerText =
      "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.";
  if (okConfirmBtn) {
    okConfirmBtn.innerText = "Ya, Hapus";
    okConfirmBtn.classList.replace("bg-green-600", "bg-red-600");
  }
  if (confirmIcon) confirmIcon.className = "fa-solid fa-trash-can text-2xl";
  if (confirmIconContainer) {
    confirmIconContainer.classList.replace("bg-green-50", "bg-red-50");
    confirmIconContainer.classList.replace("text-green-500", "text-red-500");
  }
}

cancelConfirmBtn.onclick = () => {
  confirmModal.classList.add("hidden");
  resetConfirmModal();
};

closeSuccessBtn.onclick = () => {
  successModal.classList.add("hidden");
};

// --- 5. TUTUP MODAL ---
closeDetail.onclick = () => {
  detailModal.classList.replace("flex", "hidden");
  currentDetailId = null;
};

detailModal.onclick = (e) => {
  if (e.target === detailModal) {
    detailModal.classList.replace("flex", "hidden");
  }
};
