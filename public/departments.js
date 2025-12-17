document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#department-table tbody");
  const addBtn = document.getElementById("add-department");
  const role = localStorage.getItem("role");

  let DEPARTMENTS = []; // ✅ cache

  /* ================= LOAD DEPARTMENTS ================= */
  function loadDepartments() {
    fetch(`${BASE_URL}/departments`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(data => {
        DEPARTMENTS = Array.isArray(data) ? data : [];
        renderDepartments();
      })
      .catch(err => {
        console.error("Department load failed:", err);
        tbody.innerHTML = `<tr><td colspan="6">Failed to load</td></tr>`;
      });
  }

  function renderDepartments() {
    tbody.innerHTML = "";

    const valid = DEPARTMENTS.filter(d =>
      d &&
      d.id &&
      d.name
    );

    if (valid.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No departments found</td></tr>`;
      return;
    }

    valid.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.head || ""}</td>
        <td>${d.phone || ""}</td>
        <td>${d.email || ""}</td>
        <td>${d.strength || ""}</td>
        <td>
          ${role === "admin" ? `
            <button class="action-btn edit" data-id="${d.id}">Edit</button>
            <button class="action-btn delete" data-id="${d.id}">Delete</button>
          ` : ""}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ================= ADD DEPARTMENT ================= */
  function addDepartment() {
    const name = prompt("Department name:");
    const head = prompt("Department head:");
    const phone = prompt("Phone:");
    const email = prompt("Email:");
    const strength = prompt("Strength:");

    if (!name || !head || !phone || !email || !strength) {
      alert("All fields required");
      return;
    }

    fetch(`${BASE_URL}/departments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ name, head, phone, email, strength })
    })
      .then(res => res.json())
      .then(r => {
        if (!r.success) throw new Error();
        alert("Department added");
        loadDepartments();
      })
      .catch(() => alert("Add failed"));
  }

  /* ================= EDIT / DELETE ================= */
  tbody.addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;

    const dept = DEPARTMENTS.find(d => String(d.id) === id);
    if (!dept) return alert("Invalid department");

    /* -------- EDIT -------- */
    if (e.target.classList.contains("edit")) {
      const name = prompt("Edit name:", dept.name);
      const head = prompt("Edit head:", dept.head);
      const phone = prompt("Edit phone:", dept.phone);
      const email = prompt("Edit email:", dept.email);
      const strength = prompt("Edit strength:", dept.strength);

      if (!name || !head || !phone || !email || !strength) return;

      fetch(`${BASE_URL}/departments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ name, head, phone, email, strength })
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Department updated");
          loadDepartments();
        })
        .catch(() => alert("Update failed"));
    }

    /* -------- DELETE -------- */
    if (e.target.classList.contains("delete")) {
      if (!confirm("Delete this department?")) return;

      fetch(`${BASE_URL}/departments/${id}`, {
        method: "DELETE",
        headers: { "x-role": role }
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Department deleted");
          loadDepartments();
        })
        .catch(() => alert("Delete failed"));
    }
  });

  /* ================= ROLE CONTROL ================= */
  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.onclick = addDepartment;
  } else {
    addBtn.style.display = "none";
  }

  loadDepartments();
});
