document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  console.log("🔓 Logged in as:", role);

  loadStudentDepartments();
  loadStudents();

  document.getElementById("student-filter-dept")
    .addEventListener("change", loadStudents);
  document.getElementById("student-filter-year")
    .addEventListener("change", loadStudents);

  const addBtn = document.getElementById("add-student");
  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.addEventListener("click", addStudent);
  } else {
    addBtn.style.display = "none";
  }
});

function loadStudentDepartments() {
  fetch(`${BASE_URL}/departments`, {
    headers: { "x-role": localStorage.getItem("role") }
  })
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("student-filter-dept");
      if (!dropdown) return;

      dropdown.innerHTML = `<option value="">All Departments</option>`;
      data.forEach(dept => {
        if (dept && dept.name) {
          const opt = document.createElement("option");
          opt.value = dept.name;
          opt.textContent = dept.name;
          dropdown.appendChild(opt);
        }
      });
    })
    .catch(err => console.error("❌ Failed to load departments:", err));
}

function loadStudents() {
  const department = document.getElementById("student-filter-dept").value;
  const year = document.getElementById("student-filter-year").value;
  const role = localStorage.getItem("role");

  let url = `${BASE_URL}/students?role=${role}`;
  if (department) url += `&department=${encodeURIComponent(department)}`;
  if (year) url += `&year=${encodeURIComponent(year)}`;

  fetch(url, {
    headers: { "x-role": role }
  })
    .then(res => res.json())
    .then(students => {
      const tbody = document.querySelector("#student-table tbody");
      tbody.innerHTML = "";

      students.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${student.name}</td>
          <td>${student.roll}</td>
          <td>${student.email}</td>
          <td>${student.department}</td>
          <td>${formatYear(student.year)}</td>
          <td class="actions">
            ${role === "admin" ? `
              <button class="action-btn edit" onclick="editStudent('${student.roll}')">Edit</button>
              <button class="action-btn delete" onclick="deleteStudent('${student.roll}')">Delete</button>
            ` : ""}
          </td>
        `;
        tbody.appendChild(row);
      });
    });
}

function formatYear(value) {
  switch (value) {
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

function addStudent() {
  const name = prompt("Enter student name:");
  const roll = prompt("Enter roll number:");
  const email = prompt("Enter email:");
  const department = prompt("Enter department:");
  let year = prompt("Enter year (1, 2, 3, 4):");
  year = formatYear(year);
  const password = prompt("Enter password:");

  if (!name || !roll || !email || !department || !year || !password) {
    alert("All fields are required!");
    return;
  }

  fetch(`${BASE_URL}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-role": localStorage.getItem("role"),
    },
    body: JSON.stringify({ name, roll, email, department, year, password })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadStudents();
    })
    .catch(err => {
      console.error("❌ Failed to add student:", err);
      alert("Failed to add student");
    });
}

function editStudent(roll) {
  const name = prompt("Enter updated name:");
  const email = prompt("Enter updated email:");
  const department = prompt("Enter updated department:");
  let year = prompt("Enter updated year (1, 2, 3, 4):");
  year = formatYear(year);
  const password = prompt("Enter new password (or leave blank to keep current):");

  if (!name || !email || !department || !year) {
    alert("All fields (except password) are required.");
    return;
  }

  fetch(`${BASE_URL}/students/${roll}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-role": localStorage.getItem("role"),
    },
    body: JSON.stringify({ name, email, department, year, password })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadStudents();
    })
    .catch(err => {
      console.error("❌ Failed to update student:", err);
      alert("Failed to update student");
    });
}

function deleteStudent(roll) {
  if (!confirm("Are you sure you want to delete this student?")) return;

  fetch(`${BASE_URL}/students/${roll}`, {
    method: "DELETE",
    headers: {
      "x-role": localStorage.getItem("role"),
    }
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadStudents();
    })
    .catch(err => {
      console.error("❌ Failed to delete student:", err);
      alert("Failed to delete student");
    });
}
