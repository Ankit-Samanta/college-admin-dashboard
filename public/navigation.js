document.addEventListener("DOMContentLoaded", () => {

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!role) {
    window.location.replace("login.html");
    return;
  }

  /* ================= WELCOME ================= */
  const welcomeEl = document.getElementById("welcome-user");
  if (welcomeEl) {
    welcomeEl.textContent = `Welcome, ${user.username || "User"}`;
  }

  /* ================= ROLE BASED SIDEBAR ================= */
  const allowedLinks = {
    admin: [
      "#dashboard", "#students", "#teachers", "#employees",
      "#departments", "#courses", "#marks", "#attendance",
      "#studymaterials", "#library", "#announcements"
    ],
    teacher: [
      "#dashboard", "#marks", "#attendance",
      "#studymaterials", "#library", "#announcements"
    ],
    student: [
      "#dashboard", "#marks", "#attendance",
      "#courses", "#studymaterials", "#library", "#announcements"
    ]
  };

  document.querySelectorAll(".sidebar ul li a").forEach(link => {
    const href = link.getAttribute("href");
    const li = link.parentElement;

    if (link.id === "logout" || href === "login.html") {
      li.style.display = "";
      return;
    }

    if (allowedLinks[role]?.includes(href)) {
      li.style.display = "";
    } else {
      li.style.display = "none";
    }
  });

  /* ================= ADMIN ONLY UI ================= */
  document.querySelectorAll("[data-admin]").forEach(el => {
    if (role !== "admin") el.style.display = "none";
  });

  /* ================= HASH NAVIGATION ================= */
  const sections = document.querySelectorAll(".section");

  function showSection(hash) {
    sections.forEach(s => s.classList.add("hidden"));
    const target = document.querySelector(hash) || document.querySelector("#dashboard");
    if (target) target.classList.remove("hidden");
  }

  showSection(window.location.hash || "#dashboard");

  document.querySelectorAll(".sidebar ul li a").forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) return;

      e.preventDefault();
      history.pushState(null, "", href);
      showSection(href);
    });
  });

  window.addEventListener("popstate", () => {
    showSection(window.location.hash || "#dashboard");
  });

  /* ================= LOGOUT ================= */
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", e => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

});
