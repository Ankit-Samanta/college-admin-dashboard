document.addEventListener("DOMContentLoaded", () => {
  const courseTable = document.querySelector("#course-table tbody");
  const addBtn = document.getElementById("add-course");
  const deptFilter = document.getElementById("course-filter-dept");
  const yearFilter = document.getElementById("course-filter-year");
  const role = localStorage.getItem("role");

  function formatYear(value) {
    switch (value) {
      case "1": case "1st": return "1st";
      case "2": case "2nd": return "2nd";
      case "3": case "3rd": return "3rd";
      case "4": case "4th": return "4th";
      default: return value;
    }
  }

  function loadDepartments() {
    fetch(`${BASE_URL}/departments`)
      .then(res => res.json())
      .then(depts => {
        deptFilter.innerHTML = `<option value="">All Departments</option>`;
        depts.forEach(dept => {
          const opt = document.createElement("option");
          opt.value = dept.name;
          opt.textContent = dept.name;
          deptFilter.appendChild(opt);
        });
      })
      .catch(err => console.error("❌ Failed to load departments:", err));
  }

  function loadCourses() {
    fetch(`${BASE_URL}/courses`, {
      headers: {
        "x-role": role
      }
    })
      .then(res => res.json())
      .then(data => {
        courseTable.innerHTML = "";
        const selectedDept = deptFilter.value;
        const selectedYear = yearFilter.value;

        data
          .filter(course =>
            (!selectedDept || course.department === selectedDept) &&
            (!selectedYear || formatYear(course.year) === formatYear(selectedYear))
          )
          .forEach(course => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${course.name}</td>
              <td>${course.department}</td>
              <td>${formatYear(course.year)}</td>
              <td>${course.credits}</td>
              <td>
                ${role === "admin" ? `
                  <button class="action-btn edit" onclick="editCourse(${course.id})">Edit</button>
                  <button class="action-btn delete" onclick="deleteCourse(${course.id})">Delete</button>
                ` : ""}
              </td>
            `;
            courseTable.appendChild(row);
          });
      });
  }

  function addCourse() {
    const name = prompt("Enter course name:");
    const department = prompt("Enter department:");
    let year = prompt("Enter year (1, 2, 3, 4):");
    const credits = prompt("Enter credits:");

    year = formatYear(year);

    if (!name || !department || !year || !credits) {
      alert("All fields are required.");
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
      .then(result => {
        alert(result.success ? "Course added." : "Failed to add course.");
        loadCourses();
      });
  }

  window.editCourse = function (id) {
    fetch(`${BASE_URL}/courses`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(courses => {
        const course = courses.find(c => c.id === id);
        if (!course) return alert("Course not found.");

        const name = prompt("Edit course name:", course.name);
        const department = prompt("Edit department:", course.department);
        let year = prompt("Edit year (1, 2, 3, 4):", course.year);
        const credits = prompt("Edit credits:", course.credits);

        year = formatYear(year);

        if (!name || !department || !year || !credits) {
          alert("All fields are required.");
          return;
        }

        fetch(`${BASE_URL}/courses/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-role": role
          },
          body: JSON.stringify({ name, department, year, credits })
        })
          .then(res => res.json())
          .then(result => {
            alert(result.success ? "Course updated." : "Update failed.");
            loadCourses();
          });
      });
  };

  window.deleteCourse = function (id) {
    if (!confirm("Delete this course?")) return;

    fetch(`${BASE_URL}/courses/${id}`, {
      method: "DELETE",
      headers: {
        "x-role": role
      }
    })
      .then(res => res.json())
      .then(result => {
        alert(result.success ? "Course deleted." : "Delete failed.");
        loadCourses();
      });
  };

  deptFilter.addEventListener("change", loadCourses);
  yearFilter.addEventListener("change", loadCourses);

  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.addEventListener("click", addCourse);
  } else {
    addBtn.style.display = "none";
  }

  loadDepartments();
  loadCourses();
});
