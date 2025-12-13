const BASE_URL = "https://college-admin-dashboard-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
  const employeeTableBody = document.querySelector("#employee-table tbody");
  const addEmployeeBtn = document.getElementById("add-employee");

  function loadEmployees() {
    fetch(`${BASE_URL}/employees`)
      .then((res) => res.json())
      .then((data) => {
        employeeTableBody.innerHTML = "";
        data.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.role}</td>
            <td>${item.email}</td>
            <td>${item.phone}</td>
            <td>
              <button onclick="editEmployee(${item.id})" class="action-btn edit">Edit</button>
              <button onclick="deleteEmployee(${item.id})" class="action-btn delete">Delete</button>
            </td>
          `;
          employeeTableBody.appendChild(row);
        });
      });
  }

  addEmployeeBtn.addEventListener("click", () => {
    const name = prompt("Enter employee name:");
    const role = prompt("Enter employee role:");
    const email = prompt("Enter employee email:");
    const phone = prompt("Enter employee phone:");

    if (!name || !role || !email || !phone) {
      alert("All fields are required.");
      return;
    }

    fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, email, phone }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadEmployees();
        } else {
          alert("Failed to add employee.");
        }
      });
  });

  window.deleteEmployee = function (id) {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    fetch(`${BASE_URL}/employees/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadEmployees();
        } else {
          alert("Delete failed.");
        }
      });
  };

  window.editEmployee = function (id) {
    const name = prompt("Enter new name:");
    const role = prompt("Enter new role:");
    const email = prompt("Enter new email:");
    const phone = prompt("Enter new phone:");

    if (!name || !role || !email || !phone) {
      alert("All fields are required.");
      return;
    }

    fetch(`${BASE_URL}/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, email, phone }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadEmployees();
        } else {
          alert("Update failed.");
        }
      });
  };

  loadEmployees();
});
