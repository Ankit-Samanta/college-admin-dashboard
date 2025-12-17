document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");
  if (!role) {
    window.location.href = "login.html";
    return;
  }

  const sidebarLinks = document.querySelectorAll(".sidebar ul li a");
  const sections = document.querySelectorAll(".section");

  /* ================= NAVIGATION ================= */
  function showSection(hash) {
    sections.forEach(sec => sec.classList.add("hidden"));

    const target = document.querySelector(hash);
    if (target) target.classList.remove("hidden");
  }

  showSection(window.location.hash || "#dashboard");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const hash = link.getAttribute("href");
      history.pushState(null, "", hash);
      showSection(hash);
    });
  });

  window.addEventListener("popstate", () => {
    showSection(window.location.hash || "#dashboard");
  });

  /* ================= DASHBOARD COUNTS ================= */
  fetch(`${BASE_URL}/dashboard/counts`, {
    headers: { "x-role": role }
  })
    .then(res => res.json())
    .then(data => {
      setText("total-students", data.students);
      setText("total-teachers", data.teachers);
      setText("total-employees", data.employees);
      setText("total-announcements", data.announcements);
    })
    .catch(err => {
      console.error("Dashboard count error:", err);
    });

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value ?? 0;
  }

});
