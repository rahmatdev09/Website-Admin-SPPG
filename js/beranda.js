import { db } from "./firebase.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let dataSekolah = [];

// Expose ke global agar bisa dipanggil dari HTML
window.dataSekolah = dataSekolah;

let totalPM = 0,
  totalPorsiBesar = 0,
  totalPorsiKecil = 0,
  totalSiswa = 0,
  totalB3 = 0,
  totalPIC = 0;

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

// ambil total dokumen
async function getTotalPm() {
  totalPM =
    totalPorsiBesar =
    totalPorsiKecil =
    totalSiswa =
    totalB3 =
    totalPIC =
      0;

  dataSekolah.forEach((s) => {
    if (!s.active) return;

    if (s.jenis === "SD") {
      totalPM += s.k13 + s.k46 + (s.pic || 0);
      totalSiswa += s.k13 + s.k46;
      totalPorsiKecil += s.k13;
      totalPorsiBesar += s.k46 + (s.pic || 0);
      totalPIC += s.pic || 0;
    } else if (s.jenis === "TK") {
      totalPM += s.total + (s.pic || 0);
      totalSiswa += s.total;
      totalPorsiKecil += s.total;
      totalPorsiBesar += s.pic || 0;
      totalPIC += s.pic || 0;
    } else if (s.jenis === "SMP" || s.jenis === "SMA") {
      totalPM += s.total + (s.pic || 0);
      totalSiswa += s.total;
      totalPorsiBesar += s.total + (s.pic || 0);
      totalPIC += s.pic || 0;
    } else if (s.jenis === "B3") {
      totalPM += s.total;
      totalB3 += s.total;
      totalPorsiBesar += s.total;
    }
  });

  document.getElementById("totalPm").textContent = totalPM;
}

async function loadDataSekolah() {
  const snapshot = await getDocs(collection(db, "penerimaManfaat"));
  dataSekolah = snapshot.docs.map((doc) => doc.data());
  window.dataSekolah = dataSekolah;

  console.log("Data sekolah:", dataSekolah); // cek isi
  getTotalPm();
}
document.addEventListener("DOMContentLoaded", () => {
  getTotalBarangHariIni();
  getTotalDokumen();
  loadDataSekolah();
});
