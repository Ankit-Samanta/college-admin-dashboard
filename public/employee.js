document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#employee-table tbody");
  const addBtn = document.getElementById("add-employee");
  const role = localStorage.getItem("role");

  let EMPLOYEES = []; // ✅ cache

  /* ================= LOAD ================= */
  function loadEmployees() {
    fetch(`${BASE_URL}/employees`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(data => {
        EMPLOYEES = Array.isArray(data) ? data : [];
        renderEmployees();
      })
      .catch(err => {
        console.error("Employee load failed:", err);
        tbody.innerHTML = `<tr><td colspan="5">Failed to load</td></tr>`;
      });
  }

  function renderEmployees() {
    tbody.innerHTML = "";

    const valid = EMPLOYEES.filter(e =>
      e &&
      e.id &&
      e.name
    );

    if (valid.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No employees found</td></tr>`;
      return;
    }

    valid.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.name}</td>
        <td>${e.role || ""}</td>
        <td>${e.email || ""}</td>
        <td>${e.phone || ""}</td>
        <td>
          ${role === "admin" ? `
            <button class="action-btn edit" data-id="${e.id}">Edit</button>
            <button class="action-btn delete" data-id="${e.id}">Delete</button>
          ` : ""}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ================= ADD ================= */
  function addEmployee() {
    const name = prompt("Employee name:");
    const empRole = prompt("Employee role:");
    const email = prompt("Email:");
    const phone = prompt("Phone:");

    if (!name || !empRole || !email || !phone) {
      alert("All fields required");
      return;
    }

    fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ name, role: empRole, email, phone })
    })
      .then(res => res.json())
      .then(r => {
        if (!r.success) throw new Error();
        alert("Employee added");
        loadEmployees();
      })
      .catch(() => alert("Add failed"));
  }

  /* ================= EDIT / DELETE ================= */
  tbody.addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;

    const emp = EMPLOYEES.find(x => String(x.id) === id);
    if (!emp) return alert("Invalid employee");

    /* -------- EDIT -------- */
    if (e.target.classList.contains("edit")) {
      const name = prompt("Edit name:", emp.name);
      const empRole = prompt("Edit role:", emp.role);
      const email = prompt("Edit email:", emp.email);
      const phone = prompt("Edit phone:", emp.phone);

      if (!name || !empRole || !email || !phone) return;

      fetch(`${BASE_URL}/employees/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ name, role: empRole, email, phone })
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Employee updated");
          loadEmployees();
        })
        .catch(() => alert("Update failed"));
    }

    /* -------- DELETE -------- */
    if (e.target.classList.contains("delete")) {
      if (!confirm("Delete this employee?")) return;

      fetch(`${BASE_URL}/employees/${id}`, {
        method: "DELETE",
        headers: { "x-role": role }
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Employee deleted");
          loadEmployees();
        })
        .catch(() => alert("Delete failed"));
    }
  });

  /* ================= ROLE CONTROL ================= */
  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.onclick = addEmployee;
  } else {
    addBtn.style.display = "none";
  }

  loadEmployees();
});
