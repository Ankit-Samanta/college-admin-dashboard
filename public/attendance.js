document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");

  ensureDatePicker();
  loadDepartments();

  const loadBtn = document.getElementById("load-attendance");
  if (loadBtn) {
    loadBtn.addEventListener("click", loadAttendanceTable);

    if (role !== "admin" && role !== "teacher") {
      loadBtn.style.display = "none";
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
    .then(data => {
      const deptFilter = document.getElementById("attendance-filter-dept");
      if (!deptFilter) return;

      deptFilter.innerHTML = `<option value="">Select Department</option>`;
      data.forEach(d => {
        if (d && d.name) {
          deptFilter.innerHTML += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
        }
      });
    })
    .catch(err => console.error("Failed to load departments:", err));
}

async function loadAttendanceTable() {
  const dept = document.getElementById("attendance-filter-dept")?.value;
  const year = document.getElementById("attendance-filter-year")?.value;
  const date = document.getElementById("attendance-date")?.value;
  const role = localStorage.getItem("role");

  if (!dept || !year) {
    alert("Select department and year");
    return;
  }

  const tbody = document.querySelector("#attendance-table tbody");
  tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

  try {
    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(
        `${BASE_URL}/attendance/students?department=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}`
      ),
      fetch(
        `${BASE_URL}/attendance?department=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}&date=${encodeURIComponent(date)}`
      )
    ]);

    const students = await studentsRes.json();
    const records = await attendanceRes.json();

    const map = {};
    (records || []).forEach(r => {
      map[r.student_id] = r;
    });

    tbody.innerHTML = "";

    if (!students || students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No students found</td></tr>`;
      removeSaveAllButton();
      return;
    }

    students.forEach(student => {
      const tr = document.createElement("tr");
      tr.dataset.studentId = student.id;

      const existing = map[student.id];
      const editable = (role === "admin" || role === "teacher");

      const nameTd = document.createElement("td");
      nameTd.textContent = student.name;
      tr.appendChild(nameTd);

      const statusTd = document.createElement("td");
      if (editable) {
        const sel = document.createElement("select");
        sel.className = "attendance-status";
        sel.innerHTML = `
          <option value="Absent">Absent</option>
          <option value="Present">Present</option>
        `;
        sel.value = existing?.status || "Absent";
        statusTd.appendChild(sel);
      } else {
        statusTd.textContent = existing?.status || "Not marked";
      }
      tr.appendChild(statusTd);

      const deptTd = document.createElement("td");
      deptTd.textContent = dept;
      tr.appendChild(deptTd);

      const yearTd = document.createElement("td");
      yearTd.textContent = year;
      tr.appendChild(yearTd);

      tbody.appendChild(tr);
    });

    addSaveAllButton();
  } catch (err) {
    console.error("Error loading attendance:", err);
    tbody.innerHTML = `<tr><td colspan="4">Failed to load. Check console.</td></tr>`;
    removeSaveAllButton();
  }
}

function addSaveAllButton() {
  const role = localStorage.getItem("role");
  const container = document.querySelector("#attendance-table").parentElement;
  let btn = document.getElementById("save-all-attendance");

  if (role === "admin" || role === "teacher") {
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "save-all-attendance";
      btn.textContent = "Save All Attendance";
      btn.style.marginTop = "10px";

      btn.addEventListener("click", () => {
        const dept = document.getElementById("attendance-filter-dept").value;
        const year = document.getElementById("attendance-filter-year").value;
        const date = document.getElementById("attendance-date").value;
        saveAllAttendance(dept, year, date);
      });

      container.appendChild(btn);
    } else {
      btn.style.display = "inline-block";
    }
  } else if (btn) {
    btn.style.display = "none";
  }
}

function removeSaveAllButton() {
  const btn = document.getElementById("save-all-attendance");
  if (btn) btn.remove();
}

async function saveAllAttendance(dept, year, date) {
  const tbodyRows = document.querySelectorAll("#attendance-table tbody tr");
  const btn = document.getElementById("save-all-attendance");
  const role = localStorage.getItem("role");

  btn.disabled = true;
  btn.textContent = "Saving...";

  const records = [];
  tbodyRows.forEach(row => {
    const sel = row.querySelector(".attendance-status");
    if (!sel) return;

    const studentId = row.dataset.studentId;
    const name = row.cells[0]?.innerText?.trim();
    const status = sel.value;

    records.push({
      student_id: studentId,
      student_name: name,
      department: dept,
      year,
      date,
      status
    });
  });

  if (!records.length) {
    alert("No attendance to save.");
    btn.disabled = false;
    btn.textContent = "Save All Attendance";
    return;
  }

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

    alert("Attendance saved successfully.");
    await loadAttendanceTable();
  } catch (err) {
    console.error("Save error:", err);
    alert("Failed to save attendance.");
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
