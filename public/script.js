document.addEventListener('DOMContentLoaded', () => {
    const role = (localStorage.getItem("role") || "").toLowerCase();
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : { username: "User" };

    if (!role) {
        // Redirected to login if not logged in
        window.location.href = "login.html";
        return;
    }

    
    const welcomeEl = document.getElementById("welcome-user");
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${user.username}`;

    // Role-based module buttons
    const adminButtons = [
        "add-student",
        "add-teacher",
        "add-employee",
        "add-department",
        "add-course",
        "add-book",
        "add-announcement"
    ];

    adminButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = role === "admin" ? "inline-block" : "none";
    });

    // Hide study material form for students
    const studyForm = document.getElementById("studyMaterialForm");
    if (studyForm) studyForm.style.display = role === "student" ? "none" : "";

    // Hide load buttons for non-admin/teacher if needed
    const loadMarksBtn = document.getElementById("load-marks-btn");
    if (loadMarksBtn) loadMarksBtn.style.display = role === "student" ? "none" : "";

    const loadAttendanceBtn = document.getElementById("load-attendance");
    if (loadAttendanceBtn) loadAttendanceBtn.style.display = role === "student" ? "none" : "";

    // Logout functionality
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            window.location.href = "login.html";
        });
    }

    // Remove action buttons in tables for non-admins
    function removeActionButtons() {
        if (role !== "admin") {
            document.querySelectorAll(".action-btn").forEach(btn => btn.remove());
        }
    }

    removeActionButtons();

    // Observe table changes dynamically
    const tableObserver = new MutationObserver(() => removeActionButtons());
    document.querySelectorAll("table tbody").forEach(tb => {
        tableObserver.observe(tb, { childList: true, subtree: true });
    });
});
