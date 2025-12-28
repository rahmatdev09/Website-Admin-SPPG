// Import modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Konfigurasi project Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyBC598epFdcqsFp9cg3y9-Fi40PvpGX44I",
  authDomain: "nailajasmin-c3d98.firebaseapp.com",
  projectId: "nailajasmin-c3d98",
  storageBucket: "nailajasmin-c3d98.firebasestorage.app",
  messagingSenderId: "179905162603",
  appId: "1:179905162603:web:f39f966d49b4719eeb302e",
  measurementId: "G-V7220VWRK2",
};
// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// Data global
let dataSekolah = [];
// Deklarasi state

// Expose ke global agar bisa dipanggil dari HTML
window.dataSekolah = dataSekolah;

let totalPM = 0,
  totalPorsiBesar = 0,
  totalPorsiKecil = 0,
  totalSiswa = 0,
  totalB3 = 0,
  totalPIC = 0;

document.getElementById("btnTambahPM").onclick = () => {
  document.getElementById("modalTambahPM").classList.remove("hidden");
};

// Helper Spinner Global
function showSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  spinner.classList.remove("opacity-0", "pointer-events-none");
}
function hideSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  spinner.classList.add("opacity-0", "pointer-events-none");
}

// Toast Notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  let colorClass = "bg-green-600";
  if (type === "error") colorClass = "bg-red-600";
  if (type === "info") colorClass = "bg-blue-600";

  toast.textContent = message;
  toast.className = `fixed bottom-5 right-5 ${colorClass} text-white px-4 py-2 rounded shadow-lg transition-opacity duration-500`;
  toast.classList.remove("opacity-0", "pointer-events-none");

  setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none");
  }, 3000);
}

// Update ringkasan
function updateRingkasan() {
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

  document.getElementById("totalPM").textContent = totalPM;
  document.getElementById("porsiBesar").textContent = totalPorsiBesar;
  document.getElementById("porsiKecil").textContent = totalPorsiKecil;
  document.getElementById("totalSiswa").textContent = totalSiswa;
  document.getElementById("totalB3").textContent = totalB3;
  document.getElementById("totalPIC").textContent = totalPIC;
}

document.getElementById("listSekolah").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const index = Number(btn.dataset.index);
  if (btn.classList.contains("btn-status")) {
    openStatusModal(dataSekolah[index], index);
  } else if (btn.classList.contains("btn-hapus")) {
    hapusCard(index);
  }
});

// Render card sekolah/B3
function renderSekolah() {
  const list = document.getElementById("listSekolah");
  list.innerHTML = "";
  dataSekolah.forEach((s, index) => {
    const card = document.createElement("div");
    card.className = "rounded-lg bg-white p-4 fade-transition relative";
    card.classList.add(
      s.active === false ? "card-nonaktif" : "card-active",
      "shadow"
    );

    let statusLabel =
      s.active === false
        ? "<span class='text-gray-500 font-semibold'>(Nonaktif)</span>"
        : "<span class='text-green-600 font-semibold'>(Aktif)</span>";

    if (s.jenis === "SD") {
      card.innerHTML = `
        <h4 class="text-lg font-bold">${s.nama} (SD) ${statusLabel}</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div class="text-center"><p class="font-semibold">Kelas 1-3</p><p>${
            s.k13
          }</p></div>
          <div class="text-center"><p class="font-semibold">Kelas 4-6</p><p>${
            s.k46
          }</p></div>
          <div class="text-center"><p class="font-semibold">Total</p><p>${
            s.k13 + s.k46
          }</p></div>
          <div class="text-center"><p class="font-semibold">Total PIC</p><p>${
            s.pic
          }</p></div>
        </div>
        <div id="spinner-${index}" class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm hidden">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      <div class="mt-3 flex justify-end gap-2">
    <button class="btn-status bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" data-index="${index}">
      Status
    </button>
    <button class="btn-hapus bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-index="${index}">
      Hapus
    </button>
  </div>

      `;
    } else if (s.jenis === "B3") {
      card.innerHTML = `
        <h4 class="text-lg font-bold">${s.nama} (B3) ${statusLabel}</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div class="text-center"><p class="font-semibold">Busui</p><p>${s.busui}</p></div>
          <div class="text-center"><p class="font-semibold">Bumil</p><p>${s.bumil}</p></div>
          <div class="text-center"><p class="font-semibold">Balita</p><p>${s.balita}</p></div>
          <div class="text-center"><p class="font-semibold">Total</p><p>${s.total}</p></div>
        </div>
        <div id="spinner-${index}" class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm hidden">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      <div class="mt-3 flex justify-end gap-2">
    <button class="btn-status bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" data-index="${index}">
      Status
    </button>
    <button class="btn-hapus bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-index="${index}">
      Hapus
    </button>
  </div>

      `;
    } else {
      card.innerHTML = `
        <h4 class="text-lg font-bold">${s.nama} (${s.jenis}) ${statusLabel}</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div class="text-center"><p class="font-semibold">Total</p><p>${s.total}</p></div>
          <div class="text-center"><p class="font-semibold">Total PIC</p><p>${s.pic}</p></div>
        </div>
        <div id="spinner-${index}" class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm hidden">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      <div class="mt-3 flex justify-end gap-2">
    <button class="btn-status bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" data-index="${index}">
      Status
    </button>
    <button class="btn-hapus bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" data-index="${index}">
      Hapus
    </button>
  </div>

      `;
    }

    list.appendChild(card);
  });
}

// Expose ke global window
window.hapusCard = async function hapusCard(index) {
  const s = dataSekolah[index];
  if (!confirm(`Yakin ingin menghapus ${s.nama}?`)) return;

  // Hapus di Firestore
  await deleteDoc(doc(db, "penerimaManfaat", s.id));

  // Hapus dari array lokal (UI akan tetap konsisten karena onSnapshot jalan)
  dataSekolah.splice(index, 1);
  updateRingkasan();
  renderSekolah();
  showToast("Data PM berhasil dihapus ❌", "error");
};

window.openStatusModal = function openStatusModalWrapper(s, index) {
  openStatusModal(s, index); // jika fungsi ini sudah ada
};

// Modal Status
function openStatusModal(s, index) {
  if (!s) {
    console.error("Data sekolah tidak ditemukan untuk index:", index);
    return;
  }

  const modal = document.getElementById("modalStatus");
  const options = document.getElementById("statusOptions");
  options.innerHTML = "";

  if (s.jenis === "SD") {
    options.innerHTML = `
      <label><input type="radio" name="status" value="aktif" ${
        s.active !== false ? "checked" : ""
      }/> Aktifkan Semua</label><br>
      <label><input type="radio" name="status" value="13"/> Nonaktifkan Kelas 1-3</label><br>
      <label><input type="radio" name="status" value="46"/> Nonaktifkan Kelas 4-6</label><br>
      <label><input type="radio" name="status" value="all"/> Nonaktifkan Semua</label>
    `;
  } else {
    options.innerHTML = `
      <label><input type="radio" name="status" value="aktif" ${
        s.active !== false ? "checked" : ""
      }/> Aktifkan</label><br>
      <label><input type="radio" name="status" value="all"/> Nonaktifkan</label>
    `;
  }

  modal.classList.remove("hidden");

  document.getElementById("formStatus").onsubmit = async (e) => {
    e.preventDefault();
    const pilihan = document.querySelector(
      'input[name="status"]:checked'
    ).value;
    await nonaktifkan(index, pilihan);
  };
}
// Tutup modal status
document.getElementById("closeStatus").onclick = () => {
  document.getElementById("modalStatus").classList.add("hidden");
};
document.getElementById("closeStatus2").onclick = () => {
  document.getElementById("modalStatus").classList.add("hidden");
};

// Tutup modal tambah PM
document.getElementById("closeTambahPM").onclick = () => {
  document.getElementById("modalTambahPM").classList.add("hidden");
};
document.getElementById("closeTambahPM2").onclick = () => {
  document.getElementById("modalTambahPM").classList.add("hidden");
};

// Dynamic fields untuk form tambah PM
const jenisSelect = document.getElementById("jenisPM");
const dynamicFields = document.getElementById("dynamicFields");

jenisSelect.addEventListener("change", () => {
  const jenis = jenisSelect.value;
  dynamicFields.innerHTML = "";

  if (jenis === "TK" || jenis === "SMP" || jenis === "SMA") {
    dynamicFields.innerHTML = `
      <label>Nama Sekolah</label>
      <input type="text" id="namaSekolah" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
      <label class="mt-2">Jumlah Siswa</label>
      <input type="number" id="jumlahTotal" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
    `;
  } else if (jenis === "SD") {
    dynamicFields.innerHTML = `
      <label>Nama Sekolah</label>
      <input type="text" id="namaSekolah" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
      <label class="mt-2">Jumlah Siswa Kelas 1-3</label>
      <input type="number" id="jumlahK13" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
      <label class="mt-2">Jumlah Siswa Kelas 4-6</label>
      <input type="number" id="jumlahK46" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
    `;
  } else if (jenis === "B3") {
    dynamicFields.innerHTML = `
      <label>Nama Wilayah</label>
      <input type="text" id="namaSekolah" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
      <label class="mt-2">Busui</label>
      <input type="number" id="jumlahBusui" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
      <label class="mt-2">Bumil</label>
      <input type="number" id="jumlahBumil" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
      <label class="mt-2">Balita</label>
      <input type="number" id="jumlahBalita" class="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm"/>
    `;
  }
});

// Submit form tambah PM
document.getElementById("formTambahPM").onsubmit = async (e) => {
  e.preventDefault();
  const jenis = jenisSelect.value;
  let docData = { jenis, active: true, createdAt: new Date() };

  if (jenis === "TK" || jenis === "SMP" || jenis === "SMA") {
    docData = {
      jenis,
      nama: document.getElementById("namaSekolah").value,
      total: parseInt(document.getElementById("jumlahTotal").value, 10) || 0,
      pic: 2,
      active: true,
      createdAt: new Date(),
    };
  } else if (jenis === "SD") {
    const k13 = parseInt(document.getElementById("jumlahK13").value, 10) || 0;
    const k46 = parseInt(document.getElementById("jumlahK46").value, 10) || 0;
    docData = {
      jenis,
      nama: document.getElementById("namaSekolah").value,
      k13,
      k46,
      total: k13 + k46,
      pic: 2,
      active: true,
      createdAt: new Date(),
    };
  } else if (jenis === "B3") {
    const busui =
      parseInt(document.getElementById("jumlahBusui").value, 10) || 0;
    const bumil =
      parseInt(document.getElementById("jumlahBumil").value, 10) || 0;
    const balita =
      parseInt(document.getElementById("jumlahBalita").value, 10) || 0;
    docData = {
      jenis,
      nama: document.getElementById("namaSekolah").value,
      busui,
      bumil,
      balita,
      total: busui + bumil + balita,
      active: true,
      createdAt: new Date(),
    };
  }

  // Simpan ke Firestore v9
  await addDoc(collection(db, "penerimaManfaat"), docData);

  // docData.id = docRef.id;
  // dataSekolah.push(docData);

  updateRingkasan();
  // renderSekolah();

  document.getElementById("modalTambahPM").classList.add("hidden");
  e.target.reset();
  showToast("Data PM berhasil ditambahkan ✅", "success");
};

async function nonaktifkan(index, tipe) {
  const s = dataSekolah[index];
  const spinner = document.getElementById(`spinner-${index}`);
  spinner.classList.remove("hidden");

  let updateData = {};

  if (s.jenis === "SD") {
    if (tipe === "13") {
      s.k13 = 0;
      updateData.k13 = 0;
    } else if (tipe === "46") {
      s.k46 = 0;
      updateData.k46 = 0;
    } else if (tipe === "all") {
      s.active = false;
      updateData.active = false;
    } else if (tipe === "aktif") {
      s.k13 = s.originalK13 || 0;
      s.k46 = s.originalK46 || 0;
      s.active = true;
      updateData = { k13: s.k13, k46: s.k46, active: true };
    }
  } else {
    if (tipe === "all") {
      s.active = false;
      updateData.active = false;
    } else if (tipe === "aktif") {
      s.total = s.originalTotal || 0;
      s.active = true;
      updateData = { total: s.total, active: true };
    }
  }

  await updateDoc(doc(db, "penerimaManfaat", s.id), updateData);

  updateRingkasan();
  renderSekolah();
  spinner.classList.add("hidden");
  document.getElementById("modalStatus").classList.add("hidden");
  showToast("Status berhasil diperbarui ✅", "success");
}

async function listenData() {
  showSpinner();

  onSnapshot(collection(db, "penerimaManfaat"), async (snapshot) => {
    dataSekolah = [];
    const temp = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let sekolah = { id: docSnap.id, ...data };

      temp.push(sekolah);

      if (data.jenis === "SD") {
        // Ambil subcollection kelas
        const kelasSnap = await getDocs(
          collection(db, "penerimaManfaat", docSnap.id, "kelas")
        );

        sekolah.k13 =
          kelasSnap.docs.find((k) => k.id === "k13")?.data().jumlah || 0;
        sekolah.k46 =
          kelasSnap.docs.find((k) => k.id === "k46")?.data().jumlah || 0;
        sekolah.total = sekolah.k13 + sekolah.k46;
        sekolah.originalK13 = sekolah.k13;
        sekolah.originalK46 = sekolah.k46;
        sekolah.originalTotal = sekolah.total;
      } else if (data.jenis === "B3") {
        // Ambil subcollection kategori
        const kategoriSnap = await getDocs(
          collection(db, "penerimaManfaat", docSnap.id, "kategori")
        );

        sekolah.busui =
          kategoriSnap.docs.find((k) => k.id === "busui")?.data().jumlah || 0;
        sekolah.bumil =
          kategoriSnap.docs.find((k) => k.id === "bumil")?.data().jumlah || 0;
        sekolah.balita =
          kategoriSnap.docs.find((k) => k.id === "balita")?.data().jumlah || 0;
        sekolah.total = sekolah.busui + sekolah.bumil + sekolah.balita;
        sekolah.originalTotal = sekolah.total;
      } else {
        sekolah.total = data.total || 0;
        sekolah.originalTotal = sekolah.total;
      }

      dataSekolah.length = 0;
      dataSekolah.push(...temp);
    }

    updateRingkasan();
    renderSekolah();
    hideSpinner();
  });
}

// Load data awal
window.onload = () => {
  listenData(); // realtime listener
};
