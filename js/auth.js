import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Ambil userId dari localStorage
const userId = localStorage.getItem("userId");

/**
 * 1. PREVIEW FOTO PROFIL
 * Menangani perubahan pada input file dan menampilkan preview secara instan.
 */
const editImageFile = document.getElementById("editImageFile");
if (editImageFile) {
  editImageFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("previewImage");

    if (file && preview) {
      const reader = new FileReader();
      reader.onload = () => {
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.style.backgroundSize = "cover";
        preview.style.backgroundPosition = "center";
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      preview.style.backgroundImage = "";
    }
  });
}

/**
 * 2. LOAD DATA USER
 * Mengambil data dari Firestore dan memperbarui UI di berbagai tempat.
 */
async function loadUserProfile() {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const userImg = data.foto || 'https://ui-avatars.com/api/?name=' + data.nama;

      // Update UI Navbar & Welcome
      const nameEl = document.getElementById("userName");
      if (nameEl) nameEl.textContent = data.nama;

      const welcomeEl = document.getElementById("welcomeName");
      if (welcomeEl) welcomeEl.textContent = data.nama;

      const photoWrapper = document.getElementById("userPhotoWrapper");
      if (photoWrapper) {
        photoWrapper.style.backgroundImage = `url(${userImg})`;
        photoWrapper.style.backgroundSize = "cover";
        photoWrapper.classList.remove('animate-pulse', 'bg-gray-200'); // Hapus loading state
      }

      // Update UI Modal Detail
      const modalName = document.getElementById("userNameModal");
      if (modalName) modalName.textContent = data.nama;

      const modalEmail = document.getElementById("userEmailModal");
      if (modalEmail) modalEmail.textContent = data.email;

      const photoModal = document.getElementById("userPhotoModal");
      if (photoModal) {
        photoModal.style.backgroundImage = `url(${userImg})`;
        photoModal.style.backgroundSize = "cover";
      }

      // Update Form Edit
      const editName = document.getElementById("editName");
      if (editName) editName.value = data.nama;

      const editEmail = document.getElementById("editEmail");
      if (editEmail) editEmail.value = data.email;

      const editImage = document.getElementById("editImage");
      if (editImage) editImage.value = data.foto || "";
    }
  } catch (error) {
    console.error("Gagal memuat profil:", error);
  }
}

/**
 * 3. INTERAKSI MODAL
 * Mengekspos fungsi ke objek window agar bisa dipanggil dari HTML (onclick).
 */
window.toggleUserCard = () => {
  const card = document.getElementById("userCard");
  if (card) card.classList.toggle("hidden");
};

window.toggleEditProfile = (show = true) => {
  const modal = document.getElementById("modalEditProfile");
  if (modal) {
    show ? modal.classList.remove("hidden") : modal.classList.add("hidden");
  }
  // Tutup user card saat buka edit profile
  if (show) window.toggleUserCard();
};

/**
 * 4. SIMPAN PERUBAHAN PROFIL
 */
const formEditProfile = document.getElementById("formEditProfile");
if (formEditProfile) {
  formEditProfile.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Animasi tombol loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    const nama = document.getElementById("editName").value;
    const fotoFile = document.getElementById("editImageFile")?.files[0];

    try {
      let updateData = { nama };

      // Jika ada file foto baru, konversi ke Base64
      if (fotoFile) {
        const reader = new FileReader();
        const base64String = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fotoFile);
        });
        updateData.foto = base64String;
      }

      // Update ke Firestore
      await updateDoc(doc(db, "users", userId), updateData);

      window.toggleEditProfile(false);
      await loadUserProfile();
      showAlert("Profil berhasil diperbarui!", "success");
    } catch (err) {
      console.error(err);
      showAlert("Gagal memperbarui profil!", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

/**
 * 5. LOGOUT
 */
const btnLogout = document.getElementById("btnLogoutModal");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userId");
    window.location.href = "login.html";
  });
}

/**
 * 6. ALERT SYSTEM
 */
function showAlert(message, type = "success") {
  const dialog = document.getElementById("alertDialog");
  const box = document.getElementById("alertBox");
  const title = document.getElementById("alertTitle");
  const msg = document.getElementById("alertMessage");
  const icon = document.getElementById("alertIcon");

  if (!dialog || !box) return;

  msg.textContent = message;

  if (type === "success") {
    title.textContent = "Berhasil";
    title.className = "text-xl font-bold mb-2 text-green-600";
    icon.innerHTML = `<i class="fa-solid fa-circle-check text-5xl text-green-500 animate-bounce"></i>`;
  } else {
    title.textContent = "Gagal";
    title.className = "text-xl font-bold mb-2 text-red-600";
    icon.innerHTML = `<i class="fa-solid fa-circle-xmark text-5xl text-red-500 animate-shake"></i>`;
  }

  dialog.classList.remove("hidden");
  setTimeout(() => {
    box.classList.remove("scale-95", "opacity-0");
    box.classList.add("scale-100", "opacity-100");
  }, 10);

  setTimeout(() => {
    box.classList.remove("scale-100", "opacity-100");
    box.classList.add("scale-95", "opacity-0");
    setTimeout(() => dialog.classList.add("hidden"), 300);
  }, 2500);
}

// Jalankan load data saat halaman siap
loadUserProfile();
