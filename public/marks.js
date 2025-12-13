const BASE_URL = "https://college-admin-dashboard-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");

  const deptFilter = document.getElementById("marks-filter-dept");
  const yearFilter = document.getElementById("marks-filter-year");
  const subjectFilter = document.getElementById("marks-filter-subject");
  const loadBtn = document.getElementById("load-marks-btn"); 
  const marksTableBody = document.querySelector("#marks-table tbody");

  let selectedDepartment = "";
  let selectedYear = "";
  let selectedSubject = "";

  fetch(`${BASE_URL}/departments`)
    .then(res => res.json())
    .then(data => {
      data.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.name;
        opt.textContent = d.name;
        deptFilter.appendChild(opt);
      });
    });

  [deptFilter, yearFilter].forEach(f => {
    f.addEventListener("change", () => {
      selectedDepartment = deptFilter.value;
      selectedYear = yearFilter.value;
      loadSubjects();
    });
  });

  subjectFilter.addEventListener("change", () => {
    selectedSubject = subjectFilter.value;
  });

  function loadSubjects() {
    subjectFilter.innerHTML = `<option value="">Select Subject</option>`;

    if (!selectedDepartment || !selectedYear) return;

    fetch(`${BASE_URL}/courses?department=${selectedDepartment}&year=${selectedYear}`)
      .then(res => res.json())
      .then(subjects => {
        subjects.forEach(course => {
          const opt = document.createElement("option");
          opt.value = course.name;
          opt.textContent = course.name;
          subjectFilter.appendChild(opt);
        });
      });
  }

  loadBtn.addEventListener("click", () => {
    selectedDepartment = deptFilter.value;
    selectedYear = yearFilter.value;
    selectedSubject = subjectFilter.value;

    if (!selectedDepartment || !selectedYear || !selectedSubject) {
      alert("Select Department, Year & Subject");
      return;
    }

    loadMarksTable();
  });

  function loadMarksTable() {
    marksTableBody.innerHTML = "";

    fetch(`${BASE_URL}/marks/students?department=${selectedDepartment}&year=${selectedYear}`)
      .then(res => res.json())
      .then(students => {

        if (students.length === 0) {
          marksTableBody.innerHTML = `<tr><td colspan="6">No students found</td></tr>`;
          return;
        }

        students.forEach(std => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${std.name}</td>
            <td>${selectedSubject}</td>
            <td contenteditable="${role === 'admin' || role === 'teacher'}">0</td>
            <td>${std.department}</td>
            <td>${std.year}</td>
            ${
              role === "admin" || role === "teacher"
                ? `<td><button class="save-mark-btn">Save</button></td>`
                : `<td></td>`
            }
          `;
          marksTableBody.appendChild(row);
        });

        fetch(`${BASE_URL}/marks?department=${selectedDepartment}&year=${selectedYear}&subject=${selectedSubject}`)
          .then(res => res.json())
          .then(existing => {

            const rows = marksTableBody.querySelectorAll("tr");

            existing.forEach(m => {
              rows.forEach(r => {
                if (r.children[0].textContent === m.student_name) {
                  r.children[2].textContent = m.marks;
                  r.dataset.id = m.id;
                }
              });
            });
          });
      });
  }

  marksTableBody.addEventListener("click", (e) => {

    if (!e.target.classList.contains("save-mark-btn")) return;

    const row = e.target.closest("tr");

    const student_name = row.children[0].textContent;
    const subject = row.children[1].textContent;
    const marks = row.children[2].textContent.trim();
    const department = row.children[3].textContent;
    const year = row.children[4].textContent;

    const payload = { student_name, subject, marks, department, year };

    fetch(`${BASE_URL}/marks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(msg => {
        alert(msg.message);
        loadMarksTable();
      });
  });

  if (role === "student") {
    loadBtn.style.display = "none";
  }

});
