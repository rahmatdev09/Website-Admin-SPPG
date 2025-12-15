const berandaSection = document.getElementById("berandaSection");
const barangSection = document.getElementById("barangSection");
const dokumenSection = document.getElementById("dokumenSection"); // ✅ tambahkan section dokumen

const menuBeranda = document.getElementById("menuBeranda");
const menuBarang = document.getElementById("menuBarang");
const menuDokumen = document.getElementById("menuDokumen"); // ✅ tambahkan menu dokumen

function setActive(menu) {
  [menuBeranda, menuBarang, menuDokumen].forEach((m) => {
    m.classList.remove("bg-blue-600");
    m.classList.remove("font-semibold");
  });
  menu.classList.add("bg-blue-600");
  menu.classList.add("font-semibold");
}

menuBeranda.addEventListener("click", () => {
  berandaSection.classList.remove("hidden");
  barangSection.classList.add("hidden");
  dokumenSection.classList.add("hidden");

  setActive(menuBeranda);
});

menuBarang.addEventListener("click", () => {
  barangSection.classList.remove("hidden");
  berandaSection.classList.add("hidden");
  dokumenSection.classList.add("hidden");

  setActive(menuBarang);
});

menuDokumen.addEventListener("click", () => {
  dokumenSection.classList.remove("hidden");
  berandaSection.classList.add("hidden");
  barangSection.classList.add("hidden");
  setActive(menuDokumen);
});

// Default aktif di Beranda
setActive(menuBeranda);
