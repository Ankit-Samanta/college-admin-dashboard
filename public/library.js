document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");

  loadLibrary();

  document.getElementById("add-book").addEventListener("click", () => {
    const title = prompt("Enter book title:");
    const author = prompt("Enter author:");
    const subject = prompt("Enter subject:");

    if (!title || !author || !subject) {
      return alert("All fields are required.");
    }

    fetch(`${BASE_URL}/library`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ title, author, subject }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Book added.");
          loadLibrary();
        }
      });
  });
});

function loadLibrary() {
  const role = localStorage.getItem("role");

  fetch(`${BASE_URL}/library`, {
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#library-table tbody");
      tbody.innerHTML = "";

      data.forEach(book => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.subject}</td>
          <td>
            <button class="action-btn edit" onclick="editBook(${book.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteBook(${book.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    });
}

function editBook(id) {
  const role = localStorage.getItem("role");

  fetch(`${BASE_URL}/library`, {
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(books => {
      const book = books.find(b => b.id === id);
      if (!book) return alert("Book not found.");

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
        body: JSON.stringify({ title, author, subject }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Book updated.");
            loadLibrary();
          }
        });
    });
}

function deleteBook(id) {
  const role = localStorage.getItem("role");

  if (!confirm("Delete this book?")) return;

  fetch(`${BASE_URL}/library/${id}`, {
    method: "DELETE",
    headers: {
      "x-role": role
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Book deleted.");
        loadLibrary();
      }
    });
}
