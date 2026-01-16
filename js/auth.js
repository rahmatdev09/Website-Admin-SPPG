import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Ambil userId dari localStorage
const userId = localStorage.getItem("userId");

/**
 * 1. FUNGSI LOAD PROFILE (FIRESTORE)
 */
async function loadUserProfile() {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const userImg = data.foto || `https://ui-avatars.com/api/?name=${data.nama}&background=random`;

      // Update Nama & Foto di Navbar
      const elName = document.getElementById("userName");
      if (elName) elName.textContent = data.nama;

      const elWelcome = document.getElementById("welcomeName");
      if (elWelcome) elWelcome.textContent = data.nama;

      const elPhotoWrap = document.getElementById("userPhotoWrapper");
      if (elPhotoWrap) {
        elPhotoWrap.style.backgroundImage = `url(${userImg})`;
        elPhotoWrap.style.backgroundSize = "cover";
        elPhotoWrap.innerHTML = ''; // Hapus loader
      }

      // Update Modal Detail
      const elNameModal = document.getElementById("userNameModal");
      if (elNameModal) elNameModal.textContent = data.nama;

      const elEmailModal = document.getElementById("userEmailModal");
      if (elEmailModal) elEmailModal.textContent = data.email;

      const elPhotoModal = document.getElementById("userPhotoModal");
      if (elPhotoModal) {
        elPhotoModal.style.backgroundImage = `url(${userImg})`;
        elPhotoModal.style.backgroundSize = "cover";
      }

      // Update Form Edit
      const elEditName = document.getElementById("editName");
      if (elEditName) elEditName.value = data.nama;

      const elEditEmail = document.getElementById("editEmail");
      if (elEditEmail) elEditEmail.value = data.email;
    }
  } catch (err) {
    console.error("Gagal memuat profil:", err);
  }
}

/**
 * 2. PREVIEW FOTO (LOCAL)
 */
const inputFoto = document.getElementById("editImageFile");
if (inputFoto) {
  inputFoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("previewImage");
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = () => {
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.style.backgroundSize = "cover";
      };
      reader.readAsDataURL(file);
    }
  });
}

/**
 * 3. SIMPAN EDIT PROFIL
 */
const formEdit = document.getElementById("formEditProfile");
if (formEdit) {
  formEdit.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Menyimpan...";

    const namaBaru = document.getElementById("editName").value;
    const fileFoto = document.getElementById("editImageFile").files[0];

    try {
      let dataUpdate = { nama: namaBaru };

      if (fileFoto) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(fileFoto);
        });
        dataUpdate.foto = base64;
      }

      await updateDoc(doc(db, "users", userId), dataUpdate);
      if (window.toggleEditProfile) window.toggleEditProfile(false);
      loadUserProfile();
      alert("Profil diperbarui!"); 
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui profil");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Simpan";
    }
  });
}

/**
 * 4. LOGOUT (PENYEBAB ERROR TADI)
 * Menggunakan pengecekan IF agar tidak error jika tombol tidak ada
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
 * 5. FUNGSI GLOBAL (Agar bisa dipanggil dari HTML onclick)
 */
window.toggleUserCard = () => {
  const card = document.getElementById("userCard");
  if (card) card.classList.toggle("hidden");
};

window.toggleEditProfile = (show) => {
  const modal = document.getElementById("modalEditProfile");
  if (modal) {
    show ? modal.classList.remove("hidden") : modal.classList.add("hidden");
  }
};

// Jalankan load profile saat startup
loadUserProfile();
