document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");

  const deptFilter = document.getElementById("marks-filter-dept");
  const yearFilter = document.getElementById("marks-filter-year");
  const subjectFilter = document.getElementById("marks-filter-subject");
  const loadBtn = document.getElementById("load-marks-btn");
  const tbody = document.querySelector("#marks-table tbody");

  let STUDENTS = [];
  let MARKS = [];

  /* ================= DEPARTMENTS ================= */
  fetch(`${BASE_URL}/departments`, {
    headers: { "x-role": role }
  })
    .then(res => res.json())
    .then(res => {
      const depts = res.data || res; // safety
      deptFilter.innerHTML = `<option value="">Select Department</option>`;
      depts.forEach(d => {
        deptFilter.innerHTML += `<option value="${d.name}">${d.name}</option>`;
      });
    });

  /* ================= SUBJECTS ================= */
  function loadSubjects() {
    subjectFilter.innerHTML = `<option value="">Select Subject</option>`;

    if (!deptFilter.value || !yearFilter.value) return;

    fetch(`${BASE_URL}/courses?department=${deptFilter.value}&year=${yearFilter.value}`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(res => {
        const courses = res.data || res;
        courses.forEach(c => {
          subjectFilter.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
      });
  }

  deptFilter.addEventListener("change", loadSubjects);
  yearFilter.addEventListener("change", loadSubjects);

  /* ================= LOAD TABLE ================= */
  loadBtn.addEventListener("click", () => {
    if (!deptFilter.value || !yearFilter.value || !subjectFilter.value) {
      alert("Select Department, Year and Subject");
      return;
    }
    loadMarksTable();
  });

  function loadMarksTable() {
    tbody.innerHTML = "";

    /* ---- students ---- */
    fetch(`${BASE_URL}/marks/students?department=${deptFilter.value}&year=${yearFilter.value}`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(res => {
        if (!Array.isArray(res.data)) {
          throw new Error("Students not array");
        }

        STUDENTS = res.data;

        if (STUDENTS.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6">No students found</td></tr>`;
          return;
        }

        /* ---- existing marks ---- */
        fetch(`${BASE_URL}/marks?department=${deptFilter.value}&year=${yearFilter.value}&subject=${subjectFilter.value}`, {
          headers: { "x-role": role }
        })
          .then(res => res.json())
          .then(res => {
            MARKS = Array.isArray(res.data) ? res.data : [];
            renderRows();
          });
      })
      .catch(err => {
        console.error("Marks load error:", err);
        tbody.innerHTML = `<tr><td colspan="6">Failed to load marks</td></tr>`;
      });
  }

  function renderRows() {
    tbody.innerHTML = "";

    STUDENTS.forEach(s => {
      const markRow = MARKS.find(
        m => m.student_name === s.name && m.subject === subjectFilter.value
      );

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${subjectFilter.value}</td>
        <td contenteditable="${role !== 'student'}">
          ${markRow ? markRow.marks : ""}
        </td>
        <td>${s.department}</td>
        <td>${s.year}</td>
        ${
          role === "admin" || role === "teacher"
            ? `<td><button class="save-mark-btn">Save</button></td>`
            : `<td></td>`
        }
      `;

      tbody.appendChild(tr);
    });
  }

  /* ================= SAVE ================= */
  tbody.addEventListener("click", e => {
    if (!e.target.classList.contains("save-mark-btn")) return;

    const row = e.target.closest("tr");
    const marks = row.children[2].textContent.trim();

    if (marks === "" || isNaN(marks)) {
      alert("Enter valid marks");
      return;
    }

    const payload = {
      student_name: row.children[0].textContent,
      subject: row.children[1].textContent,
      marks,
      department: row.children[3].textContent,
      year: row.children[4].textContent
    };

    fetch(`${BASE_URL}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(r => {
        if (!r.success) throw new Error();
        alert("Marks saved");
        loadMarksTable();
      })
      .catch(() => alert("Save failed"));
  });

  /* ================= STUDENT VIEW ================= */
  if (role === "student") {
    loadBtn.style.display = "none";
  }

});
