document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncements();

  const addBtn = document.getElementById("add-announcement");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const title = prompt("Enter announcement title:");
      const message = prompt("Enter announcement message:");
      const date = new Date().toISOString().split("T")[0];

      if (!title || !message) {
        alert("Both title and message are required.");
        return;
      }

      fetch("/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
});

function loadAnnouncements() {
  fetch("/announcements")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#announcement-table tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      data.forEach(a => {
        const formattedDate = new Date(a.date).toISOString().split("T")[0];

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${a.title}</td>
          <td>${a.message}</td>
          <td>${formattedDate}</td>
          <td>
            <button class="action-btn edit" onclick="editAnnouncement(${a.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteAnnouncement(${a.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    });
}

function editAnnouncement(id) {
  fetch("/announcements")
    .then(res => res.json())
    .then(data => {
      const ann = data.find(a => a.id === id);
      if (!ann) return alert("Announcement not found.");

      const title = prompt("Edit title:", ann.title);
      const message = prompt("Edit message:", ann.message);
      const date = new Date().toISOString().split("T")[0];

      if (!title || !message) return;

      fetch(`/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
  if (!confirm("Delete this announcement?")) return;

  fetch(`/announcements/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Announcement deleted.");
        loadAnnouncements();
      }
    });
}
