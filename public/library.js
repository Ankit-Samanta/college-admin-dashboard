document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#library-table tbody");
  const addBtn = document.getElementById("add-book");
  const role = localStorage.getItem("role");

  let BOOKS = []; // ✅ cache

  /* ================= LOAD ================= */
  function loadLibrary() {
    fetch(`${BASE_URL}/library`, {
      headers: { "x-role": role }
    })
      .then(res => res.json())
      .then(data => {
        BOOKS = Array.isArray(data) ? data : [];
        renderLibrary();
      })
      .catch(err => {
        console.error("Library load failed:", err);
        tbody.innerHTML = `<tr><td colspan="4">Failed to load</td></tr>`;
      });
  }

  function renderLibrary() {
    tbody.innerHTML = "";

    const valid = BOOKS.filter(b =>
      b &&
      b.id &&
      b.title
    );

    if (valid.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No books found</td></tr>`;
      return;
    }

    valid.forEach(b => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.title}</td>
        <td>${b.author || ""}</td>
        <td>${b.subject || ""}</td>
        <td>
          ${role === "admin" ? `
            <button class="action-btn edit" data-id="${b.id}">Edit</button>
            <button class="action-btn delete" data-id="${b.id}">Delete</button>
          ` : ""}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ================= ADD ================= */
  function addBook() {
    const title = prompt("Book title:");
    const author = prompt("Author:");
    const subject = prompt("Subject:");

    if (!title || !author || !subject) {
      alert("All fields required");
      return;
    }

    fetch(`${BASE_URL}/library`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ title, author, subject })
    })
      .then(res => res.json())
      .then(r => {
        if (!r.success) throw new Error();
        alert("Book added");
        loadLibrary();
      })
      .catch(() => alert("Add failed"));
  }

  /* ================= EDIT / DELETE ================= */
  tbody.addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;

    const book = BOOKS.find(b => String(b.id) === id);
    if (!book) return alert("Invalid book");

    /* -------- EDIT -------- */
    if (e.target.classList.contains("edit")) {
      const title = prompt("Edit title:", book.title);
      const author = prompt("Edit author:", book.author);
      const subject = prompt("Edit subject:", book.subject);

      if (!title || !author || !subject) return;

      fetch(`${BASE_URL}/library/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-role": role
        },
        body: JSON.stringify({ title, author, subject })
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Book updated");
          loadLibrary();
        })
        .catch(() => alert("Update failed"));
    }

    /* -------- DELETE -------- */
    if (e.target.classList.contains("delete")) {
      if (!confirm("Delete this book?")) return;

      fetch(`${BASE_URL}/library/${id}`, {
        method: "DELETE",
        headers: { "x-role": role }
      })
        .then(res => res.json())
        .then(r => {
          if (!r.success) throw new Error();
          alert("Book deleted");
          loadLibrary();
        })
        .catch(() => alert("Delete failed"));
    }
  });

  /* ================= ROLE CONTROL ================= */
  if (role === "admin") {
    addBtn.style.display = "inline-block";
    addBtn.onclick = addBook;
  } else {
    addBtn.style.display = "none";
  }

  loadLibrary();
});
