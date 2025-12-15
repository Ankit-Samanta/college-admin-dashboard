document.addEventListener('DOMContentLoaded', () => {
    // Module Add buttons - handled in respective module JS files
    if (document.getElementById('add-student')) document.getElementById('add-student').addEventListener('click', addStudent);
    if (document.getElementById('add-teacher')) document.getElementById('add-teacher').addEventListener('click', addTeacher);
    if (document.getElementById('add-department')) document.getElementById('add-department').addEventListener('click', addDepartment);
    if (document.getElementById('add-attendance')) document.getElementById('add-attendance').addEventListener('click', addAttendance);
    if (document.getElementById('upload-materials-btn')) document.getElementById('upload-materials-btn').addEventListener('click', uploadMaterials);
    if (document.getElementById('logout')) document.getElementById('logout').addEventListener('click', logout);
});

// Placeholder functions - actual logic handled in respective module JS files
function addStudent() {
    alert('Student module logic is handled in student.js');
}

function addTeacher() {
    alert('Teacher module logic is handled in teacher.js');
}

function addDepartment() {
    alert('Department module logic is handled in department.js');
}

function addAttendance() {
    alert('Attendance module logic is handled in attendance.js');
}

// Upload Study Materials
function uploadMaterials() {
    const files = document.getElementById('upload-materials')?.files;
    if (!files || files.length === 0) return alert('No files selected.');

    const formData = new FormData();
    for (let file of files) {
        formData.append('file', file);
    }

    fetch('/studymaterials/upload', {
        method: 'POST',
        headers: {
            'x-role': localStorage.getItem('role')
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Materials uploaded successfully.');
            if (typeof loadStudyMaterials === 'function') loadStudyMaterials(); // Refresh materials list
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Upload error:', err);
        alert('Upload failed due to network error.');
    });
}

// Logout function
function logout() {
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = 'login.html';
}
