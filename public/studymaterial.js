document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");

  const form = document.getElementById("studyMaterialForm");
  const fileInput = document.getElementById("materialFile");
  const uploadedByInput = document.getElementById("materialUploadedBy");

  // Students cannot upload
  if (role === "student" && form) {
    form.style.display = "none";
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (role === "student") {
        alert("Students cannot upload study materials.");
        return;
      }

      const uploaded_by = uploadedByInput.value.trim();
      const file = fileInput.files[0];

      if (!uploaded_by || !file) {
        alert("Please fill in all fields and choose a file.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploaded_by", uploaded_by);

      fetch(`${BASE_URL}/studymaterials/upload`, {
        method: "POST",
        headers: {
          "x-role": role
        },
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Study material uploaded successfully.");
            form.reset();
            loadStudyMaterials();
          } else {
            alert(data.message || "Upload failed.");
          }
        })
        .catch(err => {
          console.error("Upload error:", err);
          alert("Server error.");
        });
    });
  }

  function loadStudyMaterials() {
    fetch(`${BASE_URL}/studymaterials`, {
      headers: {
        "x-role": role
      }
    })
      .then(res => res.json())
      .then(data => {
        const tableBody = document.querySelector("#studyMaterialTable tbody");
        tableBody.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5">No study materials found</td></tr>`;
          return;
        }

        data.forEach(item => {
          const row = document.createElement("tr");

          const actionColumn =
            role === "admin" || role === "teacher"
              ? `<button class="action-btn delete" onclick="deleteMaterial(${item.id})">Delete</button>`
              : "";

          row.innerHTML = `
            <td>${item.id}</td>
            <td>
              <a href="${BASE_URL}/uploads/${item.filename}" target="_blank">
                ${item.filename}
              </a>
            </td>
            <td>${item.uploaded_by}</td>
            <td>${item.upload_date}</td>
            <td>${actionColumn}</td>
          `;

          tableBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("Load error:", err);
      });
  }

  window.deleteMaterial = function (id) {
    if (role === "student") {
      alert("Students cannot delete study materials.");
      return;
    }

    if (!confirm("Are you sure you want to delete this file?")) return;

    fetch(`${BASE_URL}/studymaterials/${id}`, {
      method: "DELETE",
      headers: {
        "x-role": role
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Deleted successfully.");
          loadStudyMaterials();
        } else {
          alert(data.message || "Failed to delete.");
        }
      })
      .catch(err => {
        console.error("Delete error:", err);
        alert("Server error.");
      });
  };

  loadStudyMaterials();
});
