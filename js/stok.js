import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* =========================
   Firebase configuration
   ========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBC598epFdcqsFp9cg3y9-Fi40PvpGX44I",
  authDomain: "nailajasmin-c3d98.firebaseapp.com",
  projectId: "nailajasmin-c3d98",
  storageBucket: "nailajasmin-c3d98.firebasestorage.app",
  messagingSenderId: "179905162603",
  appId: "1:179905162603:web:f39f966d49b4719eeb302e",
  measurementId: "G-V7220VWRK2",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let stokBarang = [];
let lastVisible = null;
const pageSize = 10;
let loading = false;
let hasMore = true;

/* =========================
   Render Cards
   ========================= */
function renderCards() {
  const container = document.getElementById("stokContainer");
  container.innerHTML = "";
  stokBarang.forEach((barang, idx) => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow p-4 hover:shadow-md";
    card.innerHTML = `
      <h3 class="text-lg font-bold">${barang.nama}</h3>
      <p class="text-gray-600">Jumlah: ${barang.jumlah}</p>
      <p class="text-xs text-gray-400">Terakhir update: ${
        barang.riwayat?.length
          ? formatTanggal(barang.riwayat[barang.riwayat.length - 1].tanggal)
          : "-"
      }</p>
      <div class="mt-2 flex space-x-2">
        <button class="bg-primary text-white px-2 py-1 rounded text-xs btnRiwayat">Riwayat</button>
        <button class="bg-yellow-500 text-white px-2 py-1 rounded text-xs btnEdit">Edit</button>
      </div>
    `;
    // pasang listener langsung
    card.querySelector(".btnRiwayat").onclick = () => openRiwayat(idx);
    card.querySelector(".btnEdit").onclick = () => openEditBarang(idx);

    container.appendChild(card);
  });
}

/* =========================
   Infinite Scroll
   ========================= */
async function loadBarangInfinite(initial = false) {
  if (loading || !hasMore) return;
  loading = true;
  document.getElementById("loadingSpinner").classList.remove("hidden");
  document.getElementById("endMessage").classList.add("hidden");

  let q;
  if (initial || !lastVisible) {
    q = query(collection(db, "stokBarang"), orderBy("nama"), limit(pageSize));
  } else {
    q = query(
      collection(db, "stokBarang"),
      orderBy("nama"),
      startAfter(lastVisible),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    hasMore = false;
    document.getElementById("loadingSpinner").classList.add("hidden");
    document.getElementById("endMessage").classList.remove("hidden");
    return;
  }

  snapshot.forEach((docSnap) => {
    stokBarang.push({ id: docSnap.id, ...docSnap.data() });
  });

  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  renderCards();
  document.getElementById("loadingSpinner").classList.add("hidden");
  loading = false;
}

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadBarangInfinite();
  }
});

/* =========================
   Tambah Barang
   ========================= */
document.getElementById("btnTambahBarang").addEventListener("click", () => {
  document.getElementById("tambahBarangModal").classList.remove("hidden");
});

function formatTanggal(t) {
  // kalau Firestore Timestamp → convert ke Date
  if (t && typeof t.toDate === "function") {
    return t.toDate().toLocaleString("id-ID");
  }
  // kalau sudah Date biasa
  if (t instanceof Date) {
    return t.toLocaleString("id-ID");
  }
  return "-";
}

document.getElementById("closeTambahBarang").addEventListener("click", () => {
  document.getElementById("tambahBarangModal").classList.add("hidden");
});

document
  .getElementById("formTambahBarang")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = document.getElementById("namaBarangTambah").value.trim();
    const jumlah = parseInt(
      document.getElementById("jumlahBarangTambah").value,
      10
    );

    if (!nama || isNaN(jumlah)) {
      alert("❌ Nama dan jumlah barang wajib diisi.");
      return;
    }

    const snapshot = await getDocs(collection(db, "stokBarang"));
    const exists = snapshot.docs.some(
      (d) => d.data().nama.toLowerCase() === nama.toLowerCase()
    );
    if (exists) {
      alert("⚠️ Barang dengan nama tersebut sudah ada di stok.");
      return;
    }

    await addDoc(collection(db, "stokBarang"), {
      nama,
      jumlah,
      riwayat: [{ jumlah, tipe: "masuk", tanggal: new Date() }],
      createdAt: new Date(),
    });

    showSuccess("✅ Barang baru berhasil ditambahkan!");
    document.getElementById("tambahBarangModal").classList.add("hidden");
    e.target.reset();
  });

/* =========================
   Edit Barang
   ========================= */
function openEditBarang(index) {
  const barang = stokBarang[index];
  document.getElementById("editIndex").value = index;
  document.getElementById("editNamaBarang").value = barang.nama;
  document.getElementById("editJumlahBarang").value = barang.jumlah;
  document.getElementById("editBarangModal").classList.remove("hidden");
}

document.getElementById("closeEditBarang").addEventListener("click", () => {
  document.getElementById("editBarangModal").classList.add("hidden");
});

document
  .getElementById("formEditBarang")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById("editIndex").value, 10);
    const barang = stokBarang[index];
    const nama = document.getElementById("editNamaBarang").value.trim();
    const jumlah = parseInt(
      document.getElementById("editJumlahBarang").value,
      10
    );

    if (!nama || isNaN(jumlah)) {
      alert("❌ Nama dan jumlah wajib diisi.");
      return;
    }

    const snapshot = await getDocs(collection(db, "stokBarang"));
    const exists = snapshot.docs.some(
      (d) =>
        d.id !== barang.id && d.data().nama.toLowerCase() === nama.toLowerCase()
    );
    if (exists) {
      alert("⚠️ Nama barang sudah ada di stok.");
      return;
    }

    const docRef = doc(db, "stokBarang", barang.id);
    await updateDoc(docRef, {
      nama,
      jumlah,
      riwayat: [
        ...barang.riwayat,
        { jumlah, tipe: "edit", tanggal: new Date() },
      ],
    });

    showSuccess("✅ Barang berhasil diperbarui!");
    document.getElementById("editBarangModal").classList.add("hidden");
  });

/* =========================
   Hapus Barang
   ========================= */
document.getElementById("hapusBarang").addEventListener("click", async () => {
  const index = parseInt(document.getElementById("editIndex").value, 10);
  const barang = stokBarang[index];
  if (confirm("⚠️ Apakah Anda yakin ingin menghapus barang ini?")) {
    await deleteDoc(doc(db, "stokBarang", barang.id));
    showSuccess("✅ Barang berhasil dihapus!");
    document.getElementById("editBarangModal").classList.add("hidden");
  }
});

/* =========================
   Update Riwayat Barang
   ========================= */
document
  .getElementById("formUpdateBarang")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById("editIndex").value, 10);
    const barang = stokBarang[index];
    const jumlah = parseInt(document.getElementById("jumlahUpdate").value, 10);
    const tipe = document.getElementById("tipeUpdate").value;

    let newJumlah = barang.jumlah;
    if (tipe === "masuk") {
      newJumlah += jumlah;
    } else {
      newJumlah -= jumlah;
    }

    const docRef = doc(db, "stokBarang", barang.id);
    await updateDoc(docRef, {
      jumlah: newJumlah,
      riwayat: [...barang.riwayat, { jumlah, tipe, tanggal: new Date() }],
    });

    showSuccess("✅ Riwayat berhasil ditambahkan!");

    document.getElementById("updateModal").classList.add("hidden");
    document.getElementById("riwayatModal").classList.add("hidden");
  });

function openRiwayat(index) {
  const barang = stokBarang[index];
  const riwayatList = document.getElementById("riwayatList");
  riwayatList.innerHTML = "";

  // render riwayat barang
  barang.riwayat?.forEach((r, riwayatIndex) => {
    const div = document.createElement("div");
    div.className = "border p-2 rounded flex justify-between items-center";
    div.innerHTML = `
      <div>
        <p>${r.tipe === "masuk" ? "➕ Masuk" : "➖ Keluar"}: ${r.jumlah}</p>
  <p class="text-xs text-gray-500">${formatTanggal(r.tanggal)}</p>

      </div>
      <button class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
        Hapus
      </button>
    `;

    // tombol hapus riwayat
    div.querySelector("button").onclick = async () => {
      // rollback jumlah
      if (r.tipe === "masuk") {
        barang.jumlah -= r.jumlah;
      } else {
        barang.jumlah += r.jumlah;
      }

      // hapus riwayat dari array
      barang.riwayat.splice(riwayatIndex, 1);

      // update Firestore
      const docRef = doc(db, "stokBarang", barang.id);
      await updateDoc(docRef, {
        jumlah: barang.jumlah,
        riwayat: barang.riwayat,
      });

      // render ulang
      openRiwayat(index);
      renderCards();
    };

    riwayatList.appendChild(div);
  });

  // tampilkan modal riwayat
  document.getElementById("riwayatModal").classList.remove("hidden");

  // tombol update barang → buka modal update
  document.getElementById("btnUpdateBarang").onclick = () => {
    document.getElementById("updateModal").classList.remove("hidden");
    document.getElementById("formUpdateBarang").onsubmit = async (e) => {
      e.preventDefault();
      const jumlah = parseInt(
        document.getElementById("jumlahUpdate").value,
        10
      );
      const tipe = document.getElementById("tipeUpdate").value;

      if (tipe === "masuk") {
        barang.jumlah += jumlah;
      } else {
        barang.jumlah -= jumlah;
      }

      barang.riwayat.push({ jumlah, tipe, tanggal: new Date() });

      const docRef = doc(db, "stokBarang", barang.id);
      await updateDoc(docRef, {
        jumlah: barang.jumlah,
        riwayat: barang.riwayat,
      });

      document.getElementById("updateModal").classList.add("hidden");
      document.getElementById("riwayatModal").classList.add("hidden");
      renderCards();
    };
  };
}
function showSuccess(message) {
  const modal = document.getElementById("successModal");
  const msg = document.getElementById("successMessage");
  const progress = document.getElementById("successProgress");

  msg.textContent = message;
  modal.classList.remove("hidden");

  let width = 0;
  const interval = setInterval(() => {
    width += 5; // naik 5% tiap 100ms
    progress.style.width = width + "%";

    if (width >= 100) {
      clearInterval(interval);
      // sembunyikan modal
      modal.classList.add("hidden");
      // refresh halaman
      location.reload();
    }
  }, 100); // 100ms → total 2 detik
}

// tombol tutup riwayat
document.getElementById("closeRiwayat").addEventListener("click", () => {
  document.getElementById("riwayatModal").classList.add("hidden");
});
/* =========================
   Init
   ========================= */
loadBarangInfinite(true);
