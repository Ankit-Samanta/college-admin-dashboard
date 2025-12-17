let ATTENDANCE_CACHE = [];

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");

  ensureDatePicker();
  loadDepartments();

  const loadBtn = document.getElementById("load-attendance");
  if (loadBtn) {
    if (role !== "admin" && role !== "teacher") {
      loadBtn.style.display = "none";
    } else {
      loadBtn.addEventListener("click", loadAttendanceTable);
    }
  }
});

function ensureDatePicker() {
  const el = document.getElementById("attendance-date");
  if (el && !el.value) {
    el.value = new Date().toISOString().split("T")[0];
  }
}

function loadDepartments() {
  fetch(`${BASE_URL}/departments`)
    .then(r => r.json())
    .then(res => {
      const data = res.data || res;
      if (!Array.isArray(data)) return;

      const deptFilter = document.getElementById("attendance-filter-dept");
      if (!deptFilter) return;

      deptFilter.innerHTML = `<option value="">Select Department</option>`;
      data.forEach(d => {
        if (d?.name) {
          deptFilter.insertAdjacentHTML(
            "beforeend",
            `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`
          );
        }
      });
    })
    .catch(err => console.error("Departments load failed:", err));
}

async function loadAttendanceTable() {
  const dept = document.getElementById("attendance-filter-dept")?.value;
  const year = document.getElementById("attendance-filter-year")?.value;
  const date = document.getElementById("attendance-date")?.value;
  const role = localStorage.getItem("role");

  if (!dept || !year || !date) {
    alert("Select department, year and date");
    return;
  }

  const tbody = document.querySelector("#attendance-table tbody");
  tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  removeSaveAllButton();

  try {
    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(`${BASE_URL}/attendance/students?department=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}`, {
        headers: { "x-role": role }
      }),
      fetch(`${BASE_URL}/attendance?department=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}&date=${encodeURIComponent(date)}`, {
        headers: { "x-role": role }
      })
    ]);

    const studentsJson = await studentsRes.json();
    const attendanceJson = await attendanceRes.json();

    const students = studentsJson.data || [];
    const records = attendanceJson.data || [];

    if (!Array.isArray(students)) throw new Error("Students not array");
    if (!Array.isArray(records)) throw new Error("Attendance not array");

    const recordMap = {};
    records.forEach(r => {
      if (r.student_id) recordMap[r.student_id] = r;
    });

    tbody.innerHTML = "";
    ATTENDANCE_CACHE = [];

    students.forEach(student => {
      if (!student.id || !student.name) return;

      const tr = document.createElement("tr");
      tr.dataset.studentId = student.id;

      const existing = recordMap[student.id];
      const editable = role === "admin" || role === "teacher";

      tr.innerHTML = `
        <td>${escapeHtml(student.name)}</td>
        <td>
          ${
            editable
              ? `<select class="attendance-status">
                   <option value="Absent">Absent</option>
                   <option value="Present">Present</option>
                 </select>`
              : escapeHtml(existing?.status || "Not marked")
          }
        </td>
        <td>${escapeHtml(dept)}</td>
        <td>${escapeHtml(year)}</td>
      `;

      if (editable) {
        tr.querySelector("select").value = existing?.status || "Absent";
      }

      tbody.appendChild(tr);
      ATTENDANCE_CACHE.push(student);
    });

    if (ATTENDANCE_CACHE.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No valid students found</td></tr>`;
      return;
    }

    addSaveAllButton();
  } catch (err) {
    console.error("Attendance load error:", err);
    tbody.innerHTML = `<tr><td colspan="4">Failed to load attendance</td></tr>`;
  }
}

function addSaveAllButton() {
  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "teacher") return;

  const container = document.querySelector("#attendance-table").parentElement;
  if (document.getElementById("save-all-attendance")) return;

  const btn = document.createElement("button");
  btn.id = "save-all-attendance";
  btn.textContent = "Save All Attendance";
  btn.style.marginTop = "10px";

  btn.onclick = () => {
    const dept = document.getElementById("attendance-filter-dept").value;
    const year = document.getElementById("attendance-filter-year").value;
    const date = document.getElementById("attendance-date").value;
    saveAllAttendance(dept, year, date);
  };

  container.appendChild(btn);
}

function removeSaveAllButton() {
  const btn = document.getElementById("save-all-attendance");
  if (btn) btn.remove();
}

async function saveAllAttendance(dept, year, date) {
  const role = localStorage.getItem("role");
  const btn = document.getElementById("save-all-attendance");

  const rows = document.querySelectorAll("#attendance-table tbody tr");
  const records = [];

  rows.forEach(row => {
    const studentId = row.dataset.studentId;
    const statusEl = row.querySelector(".attendance-status");
    if (!studentId || !statusEl) return;

    records.push({
      student_id: studentId,
      student_name: row.cells[0].innerText.trim(),
      department: dept,
      year,
      date,
      status: statusEl.value
    });
  });

  if (!records.length) {
    alert("Nothing to save");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const res = await fetch(`${BASE_URL}/attendance/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": role
      },
      body: JSON.stringify({ records })
    });

    const body = await res.json();
    if (!res.ok || !body.success) throw new Error("Save failed");

    alert("Attendance saved");
    await loadAttendanceTable();
  } catch (err) {
    console.error("Save attendance error:", err);
    alert("Failed to save attendance");
  }

  btn.disabled = false;
  btn.textContent = "Save All Attendance";
}

function escapeHtml(text) {
  return text
    ? text.replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m]))
    : "";
}
