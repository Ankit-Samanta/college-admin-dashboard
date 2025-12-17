document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");
  const tbody = document.querySelector("#teacher-table tbody");
  const addBtn = document.getElementById("add-teacher");

  if (addBtn) {
    if (role === "admin") {
      addBtn.style.display = "inline-block";
      addBtn.addEventListener("click", addTeacher);
    } else {
      addBtn.style.display = "none";
    }
  }

  loadTeachers();

  /* ================= LOAD ================= */
  function loadTeachers() {
    fetch(`${BASE_URL}/teachers`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(data => {
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5">No teachers found</td></tr>`;
          return;
        }

        data.forEach(t => {
          const actions =
            role === "admin"
              ? `
                <button class="action-btn edit" onclick="editTeacher(${t.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteTeacher(${t.id})">Delete</button>
              `
              : "";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${t.name}</td>
            <td>${t.email}</td>
            <td>${t.phone || "-"}</td>
            <td>${t.department}</td>
            <td>${actions}</td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Load teachers error:", err);
      });
  }

  /* ================= ADD ================= */
  function addTeacher() {
    if (role !== "admin") return alert("Access denied");

    const name = prompt("Enter name:");
    const email = prompt("Enter email:");
    const phone = prompt("Enter phone:");
    const department = prompt("Enter department:");
    const password = prompt("Enter password:");

    if (!name || !email || !department || !password) {
      alert("Name, Email, Department & Password are required.");
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
      .then(r => {
        alert(r.message || "Teacher added");
        loadTeachers();
      })
      .catch(err => {
        console.error("Add error:", err);
        alert("Failed to add teacher.");
      });
  }

  /* ================= EDIT ================= */
  window.editTeacher = function (id) {
    if (role !== "admin") return alert("Access denied");

    fetch(`${BASE_URL}/teachers`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(list => {
        const t = list.find(x => x.id === id);
        if (!t) return alert("Teacher not found");

        const name = prompt("Edit name:", t.name);
        const email = prompt("Edit email:", t.email);
        const phone = prompt("Edit phone:", t.phone);
        const department = prompt("Edit department:", t.department);
        const password = prompt("New password (leave blank to keep current):");

        if (!name || !email || !department) {
          alert("Name, Email & Department required.");
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
          .then(r => {
            alert(r.message || "Teacher updated");
            loadTeachers();
          });
      });
  };

  /* ================= DELETE ================= */
  window.deleteTeacher = function (id) {
    if (role !== "admin") return alert("Access denied");

    if (!confirm("Delete this teacher?")) return;

    fetch(`${BASE_URL}/teachers/${id}`, {
      method: "DELETE",
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(r => {
        alert(r.message || "Teacher deleted");
        loadTeachers();
      })
      .catch(err => {
        console.error("Delete error:", err);
        alert("Delete failed");
      });
  };

});
