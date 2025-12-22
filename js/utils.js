document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggleBtn = document.getElementById("btnSidebarToggle");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("-translate-x-full");
    overlay.classList.toggle("hidden");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  });
});

// Pastikan fungsi global
window.toggleUserCard = function () {
  const card = document.getElementById("userCard");
  if (card) {
    card.classList.toggle("hidden");
  } else {
    console.error("Modal userCard tidak ditemukan!");
  }
};
