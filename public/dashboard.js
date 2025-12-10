document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".sidebar ul li a");
  const sections = document.querySelectorAll(".dashboard-section");

  function showSection(hash) {
    sections.forEach(section => {
      section.style.display = "none";
    });

    const targetSection = document.querySelector(hash);
    if (targetSection) {
      targetSection.style.display = "block";
    }
  }

 
  const initialHash = window.location.hash || "#students";
  showSection(initialHash);

  
  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const hash = link.getAttribute("href");

      history.pushState(null, null, hash); 
      showSection(hash);
    });
  });

  window.addEventListener("popstate", () => {
    showSection(window.location.hash || "#students");
  });

  
  fetch("/dashboard/counts")
    .then(res => res.json())
    .then(data => {
      document.getElementById("total-students").innerText = data.students || 0;
      document.getElementById("total-teachers").innerText = data.teachers || 0;
      document.getElementById("total-employees").innerText = data.employees || 0;
      document.getElementById("total-announcements").innerText = data.announcements || 0;
    })
    .catch(err => console.error("Failed to load dashboard counts:", err));
});
