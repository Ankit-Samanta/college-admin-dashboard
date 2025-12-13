
document.addEventListener("DOMContentLoaded", () => {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { username: "User" };

  if (!role) {
    window.location.replace("login.html");
    return;
  }


  const welcomeEl = document.getElementById("welcome-user");
  if (welcomeEl) welcomeEl.textContent = `Welcome, ${user.username}`;

  const allowed = {
    admin: ["#dashboard", "#students", "#teachers", "#employees", "#departments", "#courses", "#marks", "#attendance", "#studymaterials", "#library", "#announcements", "#settings", "#help"],
    teacher: ["#dashboard", "#marks", "#attendance", "#studymaterials", "#library", "#announcements", "#help"],
    student: ["#dashboard", "#marks", "#attendance", "#courses", "#studymaterials", "#library", "#announcements", "#help"]
  };


  const sidebarLinks = document.querySelectorAll(".sidebar ul li a");
  sidebarLinks.forEach(a => {
    const href = a.getAttribute("href");
    const parentLi = a.parentElement;

    if (a.id === "logout" || a.getAttribute("id") === "logout" || href === "login.html") {
      parentLi.style.display = "";
      return;
    }
    if (allowed[role] && allowed[role].includes(href)) {
      parentLi.style.display = "";
    } else {
      parentLi.style.display = "none";
    }
  });


  document.querySelectorAll("[data-admin]").forEach(el => {
    if (role !== "admin") el.style.display = "none";
  });


  const adminSelectors = [
    "#add-student",
    "#add-teacher",
    "#add-employee",
    "#add-department",
    "#add-course",
    "#add-book",
    "#add-announcement"
  ];
  adminSelectors.forEach(sel => {
    const el = document.querySelector(sel);
    if (el && role !== "admin") el.style.display = "none";
  });


  const studyForm = document.getElementById("studyMaterialForm");
  if (studyForm) {
    if (role === "student") {
      studyForm.style.display = "none";
    } else {
      studyForm.style.display = "";
    }
  }


  const loadMarks = document.getElementById("load-marks-btn");
  const loadAttendance = document.getElementById("load-attendance");
  if (loadMarks) loadMarks.style.display = "";
  if (loadAttendance) loadAttendance.style.display = "";


  function removeActionColumnFromTable(table) {
    const headers = Array.from(table.querySelectorAll("thead th"));
    const actionsIndex = headers.findIndex(h => h.textContent.trim().toLowerCase() === "actions");

    if (actionsIndex === -1) return;


    if (role !== "admin") {
      headers[actionsIndex].style.display = "none";
    } else {
      headers[actionsIndex].style.display = "";
    }


    table.querySelectorAll("tbody tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells[actionsIndex]) {
        if (role !== "admin") {

          cells[actionsIndex].innerHTML = "";
          cells[actionsIndex].style.display = "none";
        } else {
          cells[actionsIndex].style.display = "";
        }
      }
    });
  }


  document.querySelectorAll("table").forEach(t => removeActionColumnFromTable(t));


  const tableObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === "childList") {

        document.querySelectorAll("table").forEach(t => removeActionColumnFromTable(t));
      }
    });
  });


  document.querySelectorAll("table tbody").forEach(tb => {
    tableObserver.observe(tb, { childList: true, subtree: true });
  });


  const mainContainer = document.querySelector("main") || document.body;
  const mainObserver = new MutationObserver(() => {
    document.querySelectorAll("table").forEach(t => removeActionColumnFromTable(t));

    document.querySelectorAll("table tbody").forEach(tb => {
      tableObserver.observe(tb, { childList: true, subtree: true });
    });
  });
  mainObserver.observe(mainContainer, { childList: true, subtree: true });


  function zapActionButtons() {
    if (role !== "admin") {
      document.querySelectorAll(".action-btn").forEach(btn => btn.remove());
    }
  }
  zapActionButtons();


  if (role !== "admin") {
    document.querySelectorAll("[data-action]").forEach(el => el.remove());
  }


  const links = document.querySelectorAll(".sidebar ul li a");
  const sections = document.querySelectorAll(".section");

  function showHash(hash) {
    sections.forEach(s => s.classList.add("hidden"));
    const target = document.querySelector(hash) || document.querySelector("#dashboard");
    if (target) target.classList.remove("hidden");

    document.querySelectorAll("table").forEach(t => removeActionColumnFromTable(t));
  }


  showHash(window.location.hash || "#dashboard");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      e.preventDefault();
      history.pushState(null, null, href);
      showHash(href);
    });
  });

  window.addEventListener("popstate", () => {
    showHash(window.location.hash || "#dashboard");
  });


  const logoutAnchor = document.getElementById("logout") || document.querySelector('a[href="login.html"]');
  if (logoutAnchor) {
    logoutAnchor.addEventListener("click", (e) => {

      e.preventDefault();
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });

    const li = logoutAnchor.parentElement;
    if (li) li.style.display = "";
  }
});
