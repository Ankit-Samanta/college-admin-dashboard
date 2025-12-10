function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  fetch("http://localhost:8081/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("role", role);
        setTimeout(() => {
          window.location.replace("index.html");
        }, 100); 
      } else {
        document.getElementById("error-msg").textContent =
          "Invalid credentials. Please try again.";
      }
    })
    .catch(() => {
      document.getElementById("error-msg").textContent =
        "Failed to connect to server.";
    });
}
