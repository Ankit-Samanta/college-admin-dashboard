document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");

  loadTeachers();

  const addBtn = document.getElementById("add-teacher");

  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.addEventListener("click", addTeacher);
  } else {
    addBtn.style.display = "none";
  }
});

function loadTeachers() {
  const role = localStorage.getItem("role");

  fetch(`${BASE_URL}/teachers`, {
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#teacher-table tbody");
      tbody.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No teachers found</td></tr>`;
        return;
      }

      data.forEach(teacher => {
        const row = document.createElement("tr");

        const actionButtons =
          role === "admin"
            ? `
              <button class="action-btn edit" onclick="editTeacher(${teacher.id})">Edit</button>
              <button class="action-btn delete" onclick="deleteTeacher(${teacher.id})">Delete</button>
            `
            : "";

        row.innerHTML = `
          <td>${teacher.name}</td>
          <td>${teacher.email}</td>
          <td>${teacher.phone || "-"}</td>
          <td>${teacher.department}</td>
          <td>${actionButtons}</td>
        `;

        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error("❌ Failed to load teachers:", err);
    });
}

function addTeacher() {
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    alert("Only admins can add teachers.");
    return;
  }

  const name = prompt("Enter name:");
  const email = prompt("Enter email:");
  const phone = prompt("Enter phone number:");
  const department = prompt("Enter department:");
  const password = prompt("Enter password:");

  if (!name || !email || !department || !password) {
    alert("Name, Email, Department and Password are required.");
    return;
  }

  fetch(`${BASE_URL}/teachers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-role": role
    },
    body: JSON.stringify({ name, email, phone, department, password })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Teacher added.");
      loadTeachers();
    })
    .catch(err => {
      console.error("❌ Failed to add teacher:", err);
      alert("Failed to add teacher.");
    });
}

function editTeacher(id) {
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    alert("Only admins can edit teachers.");
    return;
  }

  fetch(`${BASE_URL}/teachers`, {
    headers: { "x-role": role }
  })
    .then(res => res.json())
    .then(data => {
      const t = data.find(x => x.id === id);
      if (!t) return alert("Teacher not found.");

      const name = prompt("Edit name:", t.name);
      const email = prompt("Edit email:", t.email);
      const phone = prompt("Edit phone:", t.phone);
      const department = prompt("Edit department:", t.department);
      const password = prompt("New password (leave blank to keep old):");

      if (!name || !email || !department) {
        alert("Name, Email and Department are required.");
        return;
      }

      fetch(`${BASE_URL}/teachers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ name, email, phone, department, password })
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Teacher updated.");
          loadTeachers();
        });
    });
}

function deleteTeacher(id) {
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    alert("Only admins can delete teachers.");
    return;
  }

  if (!confirm("Delete this teacher?")) return;

  fetch(`${BASE_URL}/teachers/${id}`, {
    method: "DELETE",
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Teacher deleted.");
      loadTeachers();
    })
    .catch(err => {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete teacher.");
    });
}
