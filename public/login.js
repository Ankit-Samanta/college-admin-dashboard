function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);
        window.location.replace("index.html");
      } else {
        document.getElementById("error-msg").textContent =
          data.message || "Invalid credentials.";
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById("error-msg").textContent =
        "Failed to connect to server.";
    });
}
