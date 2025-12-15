document.addEventListener("DOMContentLoaded", () => {
  const departmentTableBody = document.querySelector("#department-table tbody");
  const addDepartmentBtn = document.getElementById("add-department");
  const role = localStorage.getItem("role");

  function loadDepartments() {
    fetch(`${BASE_URL}/departments`, {
      headers: {
        "x-role": role
      }
    })
      .then(res => res.json())
      .then(data => {
        departmentTableBody.innerHTML = "";
        data.forEach(dept => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.head}</td>
            <td>${dept.phone}</td>
            <td>${dept.email}</td>
            <td>${dept.strength}</td>
            <td>
              <button class="action-btn edit" data-id="${dept.id}">Edit</button>
              <button class="action-btn delete" data-id="${dept.id}">Delete</button>
            </td>
          `;
          departmentTableBody.appendChild(row);
        });
      });
  }

  loadDepartments();

  addDepartmentBtn.addEventListener("click", () => {
    const name = prompt("Enter Department Name:");
    const head = prompt("Enter Department Head:");
    const phone = prompt("Enter Department Phone:");
    const email = prompt("Enter Department Email:");
    const strength = prompt("Enter Department Strength:");

    if (!name || !head || !phone || !email || !strength) {
      alert("All fields are required.");
      return;
    }

    fetch(`${BASE_URL}/departments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ name, head, phone, email, strength }),
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Department added successfully.");
        loadDepartments();
      })
      .catch(err => {
        alert("Error adding department.");
        console.error(err);
      });
  });

  departmentTableBody.addEventListener("click", (e) => {
    const id = e.target.dataset.id;

    if (e.target.classList.contains("edit")) {
      const row = e.target.closest("tr");
      const name = prompt("Edit Department Name:", row.children[0].textContent);
      const head = prompt("Edit Department Head:", row.children[1].textContent);
      const phone = prompt("Edit Department Phone:", row.children[2].textContent);
      const email = prompt("Edit Department Email:", row.children[3].textContent);
      const strength = prompt("Edit Department Strength:", row.children[4].textContent);

      if (!name || !head || !phone || !email || !strength) {
        alert("All fields are required.");
        return;
      }

      fetch(`${BASE_URL}/departments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ name, head, phone, email, strength }),
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Department updated successfully.");
          loadDepartments();
        })
        .catch(err => {
          alert("Error updating department.");
          console.error(err);
        });
    }

    if (e.target.classList.contains("delete")) {
      if (confirm("Are you sure you want to delete this department?")) {
        fetch(`${BASE_URL}/departments/${id}`, {
          method: "DELETE",
          headers: {
            "x-role": role
          }
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message || "Department deleted successfully.");
            loadDepartments();
          })
          .catch(err => {
            alert("Error deleting department.");
            console.error(err);
          });
      }
    }
  });
});
