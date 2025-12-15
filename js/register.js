import { db } from "./firebase"; // pastikan sudah setup firebase

import {
  addDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// convert file ke base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value;
    const email = document.getElementById("email").value;
    const role = document.getElementById("role").value;
    const password = document.getElementById("password").value;
    const fotoFile = document.getElementById("foto").files[0];

    if (!fotoFile) {
      alert("Foto wajib diupload!");
      return;
    }

    try {
      // ubah foto ke base64
      const fotoBase64 = await fileToBase64(fotoFile);

      // simpan ke Firestore
      await addDoc(collection(db, "users"), {
        nama,
        email,
        role,
        password, // ⚠️ sebaiknya di-hash (bcrypt) sebelum simpan
        foto: fotoBase64,
        createdAt: new Date().toISOString(),
      });

      alert("User berhasil diregister!");
      e.target.reset();
    } catch (err) {
      console.error("Error register:", err);
      alert("Gagal register user.");
    }
  });
