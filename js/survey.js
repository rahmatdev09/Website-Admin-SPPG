import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
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
// Init
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/* =========================
   DOM references
   ========================= */
// Table
const surveyTable = document.getElementById("surveyTable");

// Add modal
const addModal = document.getElementById("addModal");
const openAddModal = document.getElementById("openAddModal");
const closeAddModal = document.getElementById("closeAddModal");
const addSurveyForm = document.getElementById("addSurveyForm");
const fotoInput = document.getElementById("fotoInput");
const fotoPreview = document.getElementById("fotoPreview");
const tanggalInput = document.getElementById("tanggalInput");
const saveBtn = document.getElementById("saveBtn");

// Edit modal (click row to open)
const editModal = document.getElementById("editModal");
const editSurveyForm = document.getElementById("editSurveyForm");
const editId = document.getElementById("editId");
const editFotoInput = document.getElementById("editFotoInput");
const editFotoPreview = document.getElementById("editFotoPreview");
const editTanggalInput = document.getElementById("editTanggalInput");
const closeEditModal = document.getElementById("closeEditModal");
const saveEditBtn = document.getElementById("saveEditBtn");
const spinnerEdit = saveEditBtn.querySelector(".spinner");
const btnTextEdit = saveEditBtn.querySelector(".btnText");

/* =========================
   State
   ========================= */
let base64AddFoto = "";
let base64EditFoto = "";

/* =========================
   Utilities
   ========================= */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openModal(el) {
  el.classList.remove("hidden");
}

function closeModal(el) {
  el.classList.add("hidden");
}

function resetAddForm() {
  addSurveyForm.reset();
  fotoPreview.src = "";
  fotoPreview.classList.add("hidden");
  base64AddFoto = "";
}

function resetEditForm() {
  editSurveyForm.reset();
  editFotoPreview.src = "";
  editFotoPreview.classList.add("hidden");
  base64EditFoto = "";
}

/* =========================
   Add survey (Base64 to Firestore)
   ========================= */
openAddModal.addEventListener("click", () => openModal(addModal));
closeAddModal.addEventListener("click", () => {
  closeModal(addModal);
  resetAddForm();
});

fotoInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  base64AddFoto = await fileToBase64(file);
  fotoPreview.src = base64AddFoto;
  fotoPreview.classList.remove("hidden");
});

addSurveyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tanggal = tanggalInput.value;

  if (!base64AddFoto || !tanggal) {
    alert("Lengkapi foto dan tanggal!");
    return;
  }

  try {
    // Loading button
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Menyimpan...";

    await addDoc(collection(db, "surveyPasar"), {
      foto: base64AddFoto,
      tanggal,
    });

    alert("✅ Survey berhasil disimpan!");
    closeModal(addModal);
    resetAddForm();
    loadSurveys();
  } catch (err) {
    alert("❌ Error: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan";
  }
});

/* =========================
   Edit survey (click row)
   ========================= */
editFotoInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  base64EditFoto = await fileToBase64(file);
  editFotoPreview.src = base64EditFoto;
  editFotoPreview.classList.remove("hidden");
});

closeEditModal.addEventListener("click", () => {
  closeModal(editModal);
  resetEditForm();
});

editSurveyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = editId.value;
  const tanggal = editTanggalInput.value;

  if (!id || !tanggal) {
    alert("Tanggal wajib diisi!");
    return;
  }

  try {
    // Spinner loading
    saveEditBtn.disabled = true;
    spinnerEdit.classList.remove("hidden");
    btnTextEdit.textContent = "Menyimpan...";

    const docRef = doc(db, "surveyPasar", id);
    await updateDoc(docRef, {
      tanggal,
      ...(base64EditFoto && { foto: base64EditFoto }),
    });

    alert("✅ Survey berhasil diupdate!");
    closeModal(editModal);
    resetEditForm();
    loadSurveys();
  } catch (err) {
    alert("❌ Error: " + err.message);
  } finally {
    saveEditBtn.disabled = false;
    spinnerEdit.classList.add("hidden");
    btnTextEdit.textContent = "Simpan";
  }
});

/* =========================
   Delete survey
   ========================= */
window.deleteSurvey = async (id) => {
  if (!confirm("Yakin hapus survey ini?")) return;
  try {
    await deleteDoc(doc(db, "surveyPasar", id));
    alert("✅ Survey dihapus!");
    loadSurveys();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
};

/* =========================
   Load & render table
   ========================= */
async function loadSurveys() {
  surveyTable.innerHTML = "";
  const snapshot = await getDocs(collection(db, "surveyPasar"));
  let i = 1;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.className = "cursor-pointer hover:bg-gray-100";

    tr.innerHTML = `
      <td class="px-4 py-2">${i++}</td>
      <td class="px-4 py-2">
        <img src="${
          data.foto
        }" alt="foto" class="w-20 h-20 object-cover rounded"/>
      </td>
      <td class="px-4 py-2">${data.tanggal}</td>
      <td class="px-4 py-2">
        <button class="bg-red-600 text-white px-2 py-1 rounded"
          onclick="deleteSurvey('${docSnap.id}')">Hapus</button>
      </td>
    `;

    // Click row to edit
    tr.addEventListener("click", (ev) => {
      // Avoid triggering when clicking delete button
      if (ev.target.tagName.toLowerCase() === "button") return;

      editId.value = docSnap.id;
      editTanggalInput.value = data.tanggal || "";
      editFotoPreview.src = data.foto || "";
      if (data.foto) editFotoPreview.classList.remove("hidden");
      base64EditFoto = ""; // reset, only set when user selects new file
      openModal(editModal);
    });

    surveyTable.appendChild(tr);
  });
}

// Initial load
loadSurveys();
