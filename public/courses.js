document.addEventListener("DOMContentLoaded", () => {
  const courseTable = document.querySelector("#course-table tbody");
  const addBtn = document.getElementById("add-course");
  const deptFilter = document.getElementById("course-filter-dept");
  const yearFilter = document.getElementById("course-filter-year");
  const role = localStorage.getItem("role");

  let COURSES = [];

  function formatYear(y) {
    if (y === "1" || y === "1st") return "1st";
    if (y === "2" || y === "2nd") return "2nd";
    if (y === "3" || y === "3rd") return "3rd";
    if (y === "4" || y === "4th") return "4th";
    return y;
  }

  /* ================= LOAD DEPARTMENTS ================= */
  function loadDepartments() {
    fetch(`${BASE_URL}/departments`)
      .then(res => res.json())
      .then(depts => {
        deptFilter.innerHTML = `<option value="">All Departments</option>`;
        depts.forEach(d => {
          deptFilter.innerHTML += `<option value="${d.name}">${d.name}</option>`;
        });
      });
  }

  /* ================= LOAD COURSES ================= */
  function loadCourses() {
    fetch(`${BASE_URL}/courses`)
      .then(res => res.json())
      .then(rows => {
        COURSES = Array.isArray(rows) ? rows : [];
        renderCourses();
      });
  }

  function renderCourses() {
    courseTable.innerHTML = "";

    const dept = deptFilter.value;
    const year = yearFilter.value;

    const filtered = COURSES.filter(c =>
      (!dept || c.department === dept) &&
      (!year || formatYear(c.year) === formatYear(year))
    );

    if (filtered.length === 0) {
      courseTable.innerHTML = `<tr><td colspan="5">No courses found</td></tr>`;
      return;
    }

    filtered.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.name}</td>
        <td>${c.department}</td>
        <td>${formatYear(c.year)}</td>
        <td>${c.credits}</td>
        <td>
          ${
            role === "admin"
              ? `<button class="edit" onclick="editCourse(${c.id})">Edit</button>
                 <button class="delete" onclick="deleteCourse(${c.id})">Delete</button>`
              : ""
          }
        </td>
      `;
      courseTable.appendChild(tr);
    });
  }

  /* ================= ADD COURSE ================= */
  window.addCourse = function () {
    if (role !== "admin") return;

    const name = prompt("Course name:");
    const credits = prompt("Credits:");
    const department = prompt("Department (EXACT name):");
    const year = formatYear(prompt("Year (1–4):"));

    if (!name || !credits || !department || !year) {
      alert("All fields are required");
      return;
    }

    fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": "admin"
      },
      body: JSON.stringify({ name, credits, department, year })
    })
      .then(res => res.json())
      .then(r => {
        alert(r.message || "Course added");
        loadCourses();
      });
  };

  /* ================= EDIT ================= */
  window.editCourse = function (id) {
    const c = COURSES.find(x => x.id === id);
    if (!c) return;

    const name = prompt("Course name:", c.name);
    const credits = prompt("Credits:", c.credits);

    if (!name || !credits) return;

    fetch(`${BASE_URL}/courses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-role": "admin"
      },
      body: JSON.stringify({
        name,
        credits,
        department: c.department,
        year: c.year
      })
    })
      .then(res => res.json())
      .then(r => {
        alert(r.message || "Updated");
        loadCourses();
      });
  };

  /* ================= DELETE ================= */
  window.deleteCourse = function (id) {
    if (!confirm("Delete this course?")) return;

    fetch(`${BASE_URL}/courses/${id}`, {
      method: "DELETE",
      headers: { "x-role": "admin" }
    })
      .then(res => res.json())
      .then(r => {
        alert(r.message || "Deleted");
        loadCourses();
      });
  };

  deptFilter.addEventListener("change", renderCourses);
  yearFilter.addEventListener("change", renderCourses);

  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.onclick = addCourse;
  } else {
    addBtn.style.display = "none";
  }

  loadDepartments();
  loadCourses();
});
