document.addEventListener("DOMContentLoaded", () => {
  loadTeachers();
  document.getElementById("add-teacher").addEventListener("click", addTeacher);
});

function loadTeachers() {
  fetch("/teachers")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#teacher-table tbody");
      tbody.innerHTML = "";

      data.forEach(teacher => {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${teacher.name}</td>
          <td>${teacher.email}</td>
          <td>${teacher.phone || ""}</td>
          <td>${teacher.department}</td>
          <td>
            <button class="action-btn edit" onclick="editTeacher(${teacher.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteTeacher(${teacher.id})">Delete</button>
          </td>
        `;
      });
    });
}

function addTeacher() {
  const name = prompt("Enter name:");
  const email = prompt("Enter email:");
  const phone = prompt("Enter phone number:");
  const department = prompt("Enter department:");
  const password = prompt("Enter password for login:");

  fetch("/teachers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, department, password })
  })
    .then(() => {
      alert("Teacher added.");
      loadTeachers();
    });
}

function editTeacher(id) {
  fetch("/teachers")
    .then(res => res.json())
    .then(data => {
      const t = data.find(t => t.id === id);

      const name = prompt("Edit name:", t.name);
      const email = prompt("Edit email:", t.email);
      const phone = prompt("Edit phone:", t.phone);
      const department = prompt("Edit department:", t.department);
      const password = prompt("Edit password (leave blank to keep unchanged):");

      fetch(`/teachers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, department, password })
      }).then(() => {
        alert("Updated.");
        loadTeachers();
      });
    });
}

function deleteTeacher(id) {
  if (confirm("Delete this teacher?")) {
    fetch(`/teachers/${id}`, { method: "DELETE" })
      .then(() => {
        alert("Deleted.");
        loadTeachers();
      });
  }
}
