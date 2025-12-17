document.addEventListener("DOMContentLoaded", () => {
  const courseTable = document.querySelector("#course-table tbody");
  const addBtn = document.getElementById("add-course");
  const deptFilter = document.getElementById("course-filter-dept");
  const yearFilter = document.getElementById("course-filter-year");
  const role = localStorage.getItem("role");

  let COURSES = []; // ✅ cache courses

  function formatYear(value) {
    if (!value) return "";
    switch (String(value)) {
      case "1":
      case "1st": return "1st";
      case "2":
      case "2nd": return "2nd";
      case "3":
      case "3rd": return "3rd";
      case "4":
      case "4th": return "4th";
      default: return value;
    }
  }

  /* ================= LOAD DEPARTMENTS ================= */
  function loadDepartments() {
    fetch(`${BASE_URL}/departments`)
      .then(res => res.json())
      .then(depts => {
        deptFilter.innerHTML = `<option value="">All Departments</option>`;
        depts.forEach(d => {
          if (!d || !d.name) return;
          deptFilter.innerHTML += `<option value="${d.name}">${d.name}</option>`;
        });
      })
      .catch(err => console.error("Departments load failed:", err));
  }

  /* ================= LOAD COURSES ================= */
  function loadCourses() {
    fetch(`${BASE_URL}/courses`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(data => {
        COURSES = Array.isArray(data) ? data : [];
        renderCourses();
      })
      .catch(err => console.error("Courses load failed:", err));
  }

  function renderCourses() {
    courseTable.innerHTML = "";

    const selectedDept = deptFilter.value;
    const selectedYear = yearFilter.value;

    const filtered = COURSES.filter(c =>
      c &&
      c.id &&
      c.name &&
      c.department &&
      c.year &&
      (!selectedDept || c.department === selectedDept) &&
      (!selectedYear || formatYear(c.year) === formatYear(selectedYear))
    );

    if (filtered.length === 0) {
      courseTable.innerHTML = `<tr><td colspan="5">No courses found</td></tr>`;
      return;
    }

    filtered.forEach(course => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${course.name}</td>
        <td>${course.department}</td>
        <td>${formatYear(course.year)}</td>
        <td>${course.credits}</td>
        <td>
          ${role === "admin" ? `
            <button class="action-btn edit" data-id="${course.id}">Edit</button>
            <button class="action-btn delete" data-id="${course.id}">Delete</button>
          ` : ""}
        </td>
      `;
      courseTable.appendChild(tr);
    });
  }

  /* ================= ADD COURSE ================= */
  function addCourse() {
    const name = prompt("Enter course name:");
    const department = deptFilter.value;
    const year = formatYear(yearFilter.value);
    const credits = prompt("Enter credits:");

    if (!name || !department || !year || !credits) {
      alert("Fill name, department, year, credits");
      return;
    }

    fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ name, department, year, credits })
    })
      .then(res => res.json())
      .then(r => {
        if (!r.success) throw new Error();
        alert("Course added");
        loadCourses();
      })
      .catch(() => alert("Add failed"));
  }

  /* ================= EDIT COURSE ================= */
  courseTable.addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit")) {
      const course = COURSES.find(c => String(c.id) === id);
      if (!course) return alert("Course not found");

      const name = prompt("Edit name:", course.name);
      const credits = prompt("Edit credits:", course.credits);

      if (!name || !credits) return;

      fetch(`${BASE_URL}/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({
          name,
          department: course.department,
          year: course.year,
          credits
        })
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Course updated");
          loadCourses();
        })
        .catch(() => alert("Update failed"));
    }

    /* ================= DELETE COURSE ================= */
    if (e.target.classList.contains("delete")) {
      if (!confirm("Delete this course?")) return;

      fetch(`${BASE_URL}/courses/${id}`, {
        method: "DELETE",
        headers: { "x-role": role }
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Course deleted");
          loadCourses();
        })
        .catch(() => alert("Delete failed"));
    }
  });

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
