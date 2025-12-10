document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studyMaterialForm");
  const fileInput = document.getElementById("materialFile");
  const uploadedByInput = document.getElementById("materialUploadedBy");

  if (!form || !fileInput || !uploadedByInput) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const uploaded_by = uploadedByInput.value.trim();
    const file = fileInput.files[0];

    if (!uploaded_by || !file) {
      alert("Please fill in all fields and choose a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", uploaded_by);

    fetch("/studymaterials/upload", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Study material uploaded successfully.");
          form.reset();
          loadStudyMaterials();
        } else {
          alert("Upload failed.");
        }
      })
      .catch(err => {
        console.error("Upload error:", err);
        alert("Server error.");
      });
  });

  function loadStudyMaterials() {
    fetch("/studymaterials")
      .then(res => res.json())
      .then(data => {
        const tableBody = document.querySelector("#studyMaterialTable tbody");
        tableBody.innerHTML = "";

        data.forEach(item => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${item.id}</td>
            <td><a href="/uploads/${item.filename}" target="_blank">${item.filename}</a></td>
            <td>${item.uploaded_by}</td>
            <td>${item.upload_date}</td>
            <td><button class="action-btn delete" onclick="deleteMaterial(${item.id})">Delete</button></td>
          `;

          tableBody.appendChild(row);
        });
      });
  }

  window.deleteMaterial = function(id) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    fetch(`/studymaterials/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Deleted successfully.");
          loadStudyMaterials();
        } else {
          alert("Failed to delete.");
        }
      })
      .catch(err => {
        console.error("Delete error:", err);
        alert("Server error.");
      });
  };

  loadStudyMaterials();
});
