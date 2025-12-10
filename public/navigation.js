document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('user'));
  const role = localStorage.getItem('role');

  if (!user || !role) {
    window.location.href = 'login.html';
  } else {
    document.getElementById('welcome-user').textContent = `Welcome, ${user.username}`;
    showSection(role);
  }

  function showSection(userRole) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.classList.remove('active'));

    if (userRole === 'admin') {
      activateSections([
        'dashboard-section', 'students-section', 'teachers-section',
        'departments-section', 'attendance-section', 'marks-section',
        'materials-section', 'library-section', 'analytics-section', 'settings-section'
      ]);
    } else if (userRole === 'teacher') {
      activateSections(['dashboard-section', 'attendance-section', 'marks-section', 'materials-section']);
    } else if (userRole === 'student') {
      activateSections(['dashboard-section', 'attendance-section', 'marks-section', 'materials-section']);
    }
  }

  function activateSections(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    });
  }

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
