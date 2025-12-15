import { db } from "./firebase.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ambil userId dari localStorage (saat login disimpan)
const userId = localStorage.getItem("userId");

// preview foto dari file komputer
document.getElementById("editImageFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById("previewImage");

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      preview.style.backgroundImage = `url(${reader.result})`;
      preview.style.backgroundSize = "cover";
      preview.style.backgroundPosition = "center";
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.backgroundImage = "";
  }
});

// fungsi load data user
async function loadUserProfile() {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();

    // navbar
    document.getElementById("userName").textContent = data.nama;
    document.getElementById(
      "userPhotoWrapper"
    ).style.backgroundImage = `url(${data.foto})`;
    document.getElementById("userPhotoWrapper").style.backgroundSize = "cover";

    // modal
    document.getElementById("userNameModal").textContent = data.nama;
    document.getElementById("userEmailModal").textContent = data.email;
    document.getElementById(
      "userPhotoModal"
    ).style.backgroundImage = `url(${data.foto})`;
    document.getElementById("userPhotoModal").style.backgroundSize = "cover";

    // form edit
    document.getElementById("editName").value = data.nama;
    document.getElementById("editEmail").value = data.email;
    document.getElementById("editImage").value = data.foto;
  }
}

// toggle modal user card
function toggleUserCard() {
  document.getElementById("userCard").classList.toggle("hidden");
}
window.toggleUserCard = toggleUserCard;

// toggle modal edit profile
function toggleEditProfile(show = true) {
  const modal = document.getElementById("modalEditProfile");
  if (show) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}
window.toggleEditProfile = toggleEditProfile;

// simpan edit profil
document
  .getElementById("formEditProfile")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = document.getElementById("editName").value;
    const fotoFile = document.getElementById("editImageFile").files[0];

    try {
      let fotoBase64 = null;
      if (fotoFile) {
        const reader = new FileReader();
        fotoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fotoFile);
        });
      }

      // update Firestore
      await updateDoc(doc(db, "users", userId), {
        nama,
        ...(fotoBase64 && { foto: fotoBase64 }),
      });

      toggleEditProfile(false);
      loadUserProfile();
      showAlert("Profil berhasil diperbarui!", "success");
    } catch (err) {
      console.error(err);
      showAlert("Gagal update profil!", "error");
    }
  });

// logout
document.getElementById("btnLogoutModal").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  window.location.href = "login.html";
});

function showAlert(message, type = "success") {
  const dialog = document.getElementById("alertDialog");
  const box = document.getElementById("alertBox");
  const title = document.getElementById("alertTitle");
  const msg = document.getElementById("alertMessage");
  const icon = document.getElementById("alertIcon");

  msg.textContent = message;

  // set warna & ikon sesuai type
  if (type === "success") {
    title.textContent = "Sukses";
    title.className = "text-lg font-bold mb-2 text-green-600";
    icon.innerHTML = `
      <svg class="w-12 h-12 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M5 13l4 4L19 7" />
      </svg>`;
  } else if (type === "error") {
    title.textContent = "Error";
    title.className = "text-lg font-bold mb-2 text-red-600";
    icon.innerHTML = `
      <svg class="w-12 h-12 text-red-500 animate-ping" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M6 18L18 6M6 6l12 12" />
      </svg>`;
  } else if (type === "warning") {
    title.textContent = "Peringatan";
    title.className = "text-lg font-bold mb-2 text-yellow-600";
    icon.innerHTML = `
      <svg class="w-12 h-12 text-yellow-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01M12 5a7 7 0 100 14a7 7 0 000-14z" />
      </svg>`;
  }

  // tampilkan dialog dengan animasi
  dialog.classList.remove("hidden");
  setTimeout(() => {
    box.classList.remove("scale-95", "opacity-0");
    box.classList.add("scale-100", "opacity-100");
  }, 50);

  // auto hide setelah 2.5 detik
  setTimeout(() => {
    box.classList.remove("scale-100", "opacity-100");
    box.classList.add("scale-95", "opacity-0");
    setTimeout(() => dialog.classList.add("hidden"), 300);
  }, 2500);
}

// jalankan saat halaman load
loadUserProfile();
