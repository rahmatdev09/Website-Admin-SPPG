import { db } from "./firebase.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ambil total barang hari ini
async function getTotalBarangHariIni() {
  const snapshot = await getDocs(collection(db, "barang"));

  // ambil tanggal hari ini dalam format YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  // filter dokumen yang field "tanggal" sama dengan today
  const total = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.tanggal === today;
  }).length;

  document.getElementById("totalBarang").textContent = total;
}

// ambil total dokumen
async function getTotalDokumen() {
  const snapshot = await getDocs(collection(db, "dokumenBarang"));
  document.getElementById("totalDokumen").textContent = snapshot.size;
}

// jalankan saat halaman load
getTotalBarangHariIni();
getTotalDokumen();
