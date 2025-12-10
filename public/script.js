document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('add-student')) document.getElementById('add-student').addEventListener('click', addStudent);
    if (document.getElementById('add-teacher')) document.getElementById('add-teacher').addEventListener('click', addTeacher);
    if (document.getElementById('add-department')) document.getElementById('add-department').addEventListener('click', addDepartment);
    if (document.getElementById('add-attendance')) document.getElementById('add-attendance').addEventListener('click', addAttendance);
    if (document.getElementById('upload-materials-btn')) document.getElementById('upload-materials-btn').addEventListener('click', uploadMaterials);
    if (document.getElementById('logout')) document.getElementById('logout').addEventListener('click', logout);

    loadDummyDashboardCards();      
    loadDummyStudyMaterials();        
});

function loadDummyDashboardCards() {
    document.querySelector(".card:nth-child(1) .number").textContent = "1783";
    document.querySelector(".card:nth-child(2) .number").textContent = "112";
    document.querySelector(".card:nth-child(3) .number").textContent = "68";
    document.querySelector(".card:nth-child(4) .number").textContent = "7";
}

function loadDummyStudyMaterials() {
    const materials = [
        { id: 1, name: "Math 101 Notes", url: "/uploads/math101.pdf" },
        { id: 2, name: "CS 102 Slides", url: "/uploads/cs102.pptx" }
    ];
    const materialList = document.getElementById('material-list');
    if (materialList) {
        materialList.innerHTML = '';
        materials.forEach(mat => {
            const div = document.createElement('div');
            div.innerHTML = `<a href="${mat.url}" download>${mat.name}</a>`;
            materialList.appendChild(div);
        });
    }
}

function uploadMaterials() {
    const files = document.getElementById('upload-materials')?.files;
    if (!files || files.length === 0) return alert('No files selected.');

    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }

    console.log('Uploading files:', formData);

    setTimeout(() => {
        alert("Materials uploaded (simulation).");
        loadDummyStudyMaterials();
    }, 500);
}


function addStudent() {
    alert('Student module logic handled in student.js');
}
function addTeacher() {
    alert('Teacher module logic handled in teacher.js');
}
function addDepartment() {
   // alert('Department module logic handled in departments.js');
}
function addAttendance() {
    alert('Attendance module logic handled in attendance.js');
}

function logout() {
    localStorage.removeItem("role");
    alert('You have been logged out.');
    window.location.href = 'login.html';
}

function showSection(id) {
    document.querySelectorAll("main .section").forEach(section => {
        section.style.display = "none";
    });

    const target = document.querySelector(id);
    if (target) target.style.display = "block";
}

document.querySelectorAll(".sidebar a[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const targetId = link.getAttribute("href");
        showSection(targetId);
        history.pushState(null, "", targetId);
    });
});

window.addEventListener("load", () => {
    const hash = window.location.hash || "#dashboard";
    showSection(hash);
});
