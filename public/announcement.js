let ANNOUNCEMENTS_CACHE = [];

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  const addBtn = document.getElementById("add-announcement");

  if (addBtn && role === "student") {
    addBtn.style.display = "none";
  }

  if (addBtn && (role === "admin" || role === "teacher")) {
    addBtn.addEventListener("click", addAnnouncement);
  }

  loadAnnouncements();
});

function loadAnnouncements() {
  const role = localStorage.getItem("role");

  fetch(`${BASE_URL}/announcements`, {
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        console.error("Announcements API did not return array:", data);
        return;
      }

      ANNOUNCEMENTS_CACHE = data;

      const tbody = document.querySelector("#announcement-table tbody");
      tbody.innerHTML = "";

      data.forEach(a => {
        if (!a.id) return;

        const date = a.date
          ? new Date(a.date).toISOString().split("T")[0]
          : "";

        const actions =
          role === "admin" || role === "teacher"
            ? `
              <button onclick="editAnnouncement(${a.id})">Edit</button>
              <button onclick="deleteAnnouncement(${a.id})">Delete</button>
            `
            : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${a.title || ""}</td>
          <td>${a.message || ""}</td>
          <td>${date}</td>
          <td>${actions}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error("Load announcements failed:", err));
}

function addAnnouncement() {
  const role = localStorage.getItem("role");

  const title = prompt("Enter title:");
  const message = prompt("Enter message:");
  const date = new Date().toISOString().split("T")[0];

  if (!title || !message) {
    alert("Title and message required");
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
        alert("Announcement added");
        loadAnnouncements();
      } else {
        alert("Add failed");
      }
    });
}

function editAnnouncement(id) {
  const role = localStorage.getItem("role");
  if (!id) return alert("Invalid announcement ID");

  const ann = ANNOUNCEMENTS_CACHE.find(a => a.id === id);
  if (!ann) return alert("Announcement not found");

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
        alert("Announcement updated");
        loadAnnouncements();
      } else {
        alert("Update failed");
      }
    });
}

function deleteAnnouncement(id) {
  const role = localStorage.getItem("role");
  if (!id) return alert("Invalid announcement ID");

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
        alert("Announcement deleted");
        loadAnnouncements();
      } else {
        alert("Delete failed");
      }
    });
}
