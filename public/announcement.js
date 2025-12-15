document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  const addBtn = document.getElementById("add-announcement");

  if (role === "student" && addBtn) {
    addBtn.style.display = "none";
  }

  if ((role === "admin" || role === "teacher") && addBtn) {
    addBtn.addEventListener("click", () => {
      const title = prompt("Enter announcement title:");
      const message = prompt("Enter announcement message:");
      const date = new Date().toISOString().split("T")[0];

      if (!title || !message) {
        alert("Both title and message are required.");
        return;
      }

      fetch(`${BASE_URL}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ title, message, date })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Announcement added.");
            loadAnnouncements();
          }
        });
    });
  }

  loadAnnouncements();
});

function loadAnnouncements() {
  const role = localStorage.getItem("role");

  fetch(`${BASE_URL}/announcements`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#announcement-table tbody");
      tbody.innerHTML = "";

      data.forEach(a => {
        const formattedDate = new Date(a.date).toISOString().split("T")[0];

        let actionColumn = "";
        if (role === "admin" || role === "teacher") {
          actionColumn = `
            <button class="action-btn edit" onclick="editAnnouncement(${a.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteAnnouncement(${a.id})">Delete</button>
          `;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${a.title}</td>
          <td>${a.message}</td>
          <td>${formattedDate}</td>
          <td>${actionColumn}</td>
        `;
        tbody.appendChild(row);
      });
    });
}

function editAnnouncement(id) {
  const role = localStorage.getItem("role");
  if (role === "student") return alert("Students cannot edit announcements.");

  fetch(`${BASE_URL}/announcements`)
    .then(res => res.json())
    .then(data => {
      const ann = data.find(a => a.id === id);
      if (!ann) return alert("Announcement not found.");

      const title = prompt("Edit title:", ann.title);
      const message = prompt("Edit message:", ann.message);
      const date = new Date().toISOString().split("T")[0];

      if (!title || !message) return;

      fetch(`${BASE_URL}/announcements/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ title, message, date })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Announcement updated.");
            loadAnnouncements();
          }
        });
    });
}

function deleteAnnouncement(id) {
  const role = localStorage.getItem("role");
  if (role === "student") return alert("Students cannot delete announcements.");

  if (!confirm("Delete this announcement?")) return;

  fetch(`${BASE_URL}/announcements/${id}`, {
    method: "DELETE",
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Announcement deleted.");
        loadAnnouncements();
      }
    });
}
