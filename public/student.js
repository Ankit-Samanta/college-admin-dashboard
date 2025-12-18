document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  const addBtn = document.getElementById("add-student");

  loadStudentDepartments();

  // ONLY admin & teacher can load students
  if (role === "admin" || role === "teacher") {
    loadStudents();

    document
      .getElementById("student-filter-dept")
      ?.addEventListener("change", loadStudents);

    document
      .getElementById("student-filter-year")
      ?.addEventListener("change", loadStudents);
  }

  // admin-only add button
  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.addEventListener("click", addStudent);
  } else {
    addBtn.style.display = "none";
  }
});


/* ================= HELPERS ================= */
function formatYear(y) {
  if (y === "1" || y === "1st") return "1st";
  if (y === "2" || y === "2nd") return "2nd";
  if (y === "3" || y === "3rd") return "3rd";
  if (y === "4" || y === "4th") return "4th";
  return y;
}

/* ================= DEPARTMENTS ================= */
function loadStudentDepartments() {
  const filter = document.getElementById("student-filter-dept");

  fetch(`${BASE_URL}/departments`)
    .then(res => res.json())
    .then(depts => {
      filter.innerHTML = `<option value="">All Departments</option>`;
      depts.forEach(d => {
        filter.innerHTML += `<option value="${d.name}">${d.name}</option>`;
      });
    })
    .catch(err => console.error("Failed to load departments:", err));
}
/* ================= LOAD STUDENTS ================= */
function loadStudents() {
  const dept = document.getElementById("student-filter-dept").value;
  const year = document.getElementById("student-filter-year").value;
  const role = localStorage.getItem("role");

  let url = `${BASE_URL}/students`;
  const params = [];
  if (dept) params.push(`department=${encodeURIComponent(dept)}`);
  if (year) params.push(`year=${encodeURIComponent(year)}`);
  if (params.length) url += "?" + params.join("&");

  fetch(url, { headers: { "x-role": role } })
    .then(res => res.json())
    .then(students => {
      const tbody = document.querySelector("#student-table tbody");
      tbody.innerHTML = "";

      students.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${s.name}</td>
          <td>${s.roll}</td>
          <td>${s.email}</td>
          <td>${s.department}</td>
          <td>${formatYear(s.year)}</td>
          <td>
            ${
              role === "admin"
                ? `
                  <button class="action-btn edit" onclick="editStudent(${s.id})">Edit</button>
                  <button class="action-btn delete" onclick="deleteStudent(${s.id})">Delete</button>
                `
                : ""
            }
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

/* ================= ADD ================= */
function addStudent() {
  if (localStorage.getItem("role") !== "admin") return;

  const name = prompt("Student name:");
  const roll = prompt("Roll number:");
  const email = prompt("Email:");
  const department = prompt("Department (exact name):");
  let year = formatYear(prompt("Year (1–4):"));
  const password = prompt("Password:");

  if (!name || !roll || !email || !department || !year || !password) {
    alert("All fields are required");
    return;
  }

  fetch(`${BASE_URL}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-role": "admin"
    },
    body: JSON.stringify({ name, roll, email, department, year, password })
  })
    .then(res => res.json())
    .then(r => {
      alert(r.message || "Student added");
      loadStudents();
    });
}

/* ================= EDIT ================= */
function editStudent(id) {
  if (localStorage.getItem("role") !== "admin") return;

  fetch(`${BASE_URL}/students/${id}`, {
    headers: { "x-role": "admin" }
  })
    .then(res => res.json())
    .then(s => {
      const name = prompt("Name:", s.name);
      const email = prompt("Email:", s.email);
      const department = prompt("Department:", s.department);
      let year = formatYear(prompt("Year:", s.year));
      const password = prompt("New password (leave blank to keep)");

      if (!name || !email || !department || !year) {
        alert("Missing fields");
        return;
      }

      const payload = { name, email, department, year };
      if (password) payload.password = password;

      fetch(`${BASE_URL}/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": "admin"
        },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(r => {
          alert(r.message || "Student updated");
          loadStudents();
        });
    });
}

/* ================= DELETE ================= */
function deleteStudent(id) {
  if (localStorage.getItem("role") !== "admin") return;

  if (!confirm("Delete this student?")) return;

  fetch(`${BASE_URL}/students/${id}`, {
    method: "DELETE",
    headers: { "x-role": "admin" }
  })
    .then(res => res.json())
    .then(r => {
      alert(r.message || "Student deleted");
      loadStudents();
    });
}
