document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");

  const form = document.getElementById("studyMaterialForm");
  const fileInput = document.getElementById("materialFile");
  const uploadedByInput = document.getElementById("materialUploadedBy");
  const tableBody = document.querySelector("#studyMaterialTable tbody");

  /* ================= ROLE VISIBILITY ================= */
  if (form && role === "student") {
    form.style.display = "none";
  }

  /* ================= UPLOAD ================= */
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (role !== "admin" && role !== "teacher") {
        alert("You are not allowed to upload files.");
        return;
      }

      const uploaded_by = uploadedByInput.value.trim();
      const file = fileInput.files[0];

      if (!uploaded_by || !file) {
        alert("All fields are required.");
        return;
      }

      // Allow only PDFs (recommended)
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Only PDF files are allowed.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploaded_by", uploaded_by);

      fetch(`${BASE_URL}/studymaterials/upload`, {
        method: "POST",
        headers: { "x-role": role },
        body: formData
      })
        .then(res => res.json())
        .then(r => {
          alert(r.message || "Upload successful");
          form.reset();
          loadStudyMaterials();
        })
        .catch(err => {
          console.error("Upload error:", err);
          alert("Upload failed.");
        });
    });
  }

  /* ================= LOAD ================= */
  function loadStudyMaterials() {
    if (!tableBody) return;

    fetch(`${BASE_URL}/studymaterials`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(data => {
        tableBody.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5">No study materials found</td></tr>`;
          return;
        }

        data.forEach(item => {
          const date = item.upload_date
            ? new Date(item.upload_date).toLocaleDateString()
            : "-";

          const actions =
            role === "admin" || role === "teacher"
              ? `<button class="action-btn delete" onclick="deleteMaterial(${item.id})">Delete</button>`
              : "";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${item.id}</td>
            <td>
              <a href="${BASE_URL}/uploads/${item.filename}" target="_blank">
                ${item.filename}
              </a>
            </td>
            <td>${item.uploaded_by}</td>
            <td>${date}</td>
            <td>${actions}</td>
          `;

          tableBody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Load error:", err);
        tableBody.innerHTML = `<tr><td colspan="5">Failed to load data</td></tr>`;
      });
  }

  /* ================= DELETE ================= */
  window.deleteMaterial = function (id) {
    if (role !== "admin" && role !== "teacher") {
      alert("You are not allowed to delete files.");
      return;
    }

    if (!confirm("Delete this study material?")) return;

    fetch(`${BASE_URL}/studymaterials/${id}`, {
      method: "DELETE",
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(r => {
        alert(r.message || "Deleted");
        loadStudyMaterials();
      })
      .catch(err => {
        console.error("Delete error:", err);
        alert("Delete failed.");
      });
  };

  loadStudyMaterials();
});
