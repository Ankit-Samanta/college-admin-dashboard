require("dotenv").config();
const db = require("./db");
const bcrypt = require("bcryptjs");
// Loading environment variables
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());


// File upload setup (PDFs, etc.)

const uploadsDir = path.join(__dirname, "uploads");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});


// Helper functions

function formatYearLabel(value) {
  switch (value) {
    case "1": case "1st": return "1st";
    case "2": case "2nd": return "2nd";
    case "3": case "3rd": return "3rd";
    case "4": case "4th": return "4th";
    default: return value;
  }
}

// ROLE-BASED ACCESS CONTROL
function allowRoles(...roles) {
  return (req, res, next) => {
    const role = req.headers["x-role"];
    if (!roles.includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

// DASHBOARD
app.get("/dashboard/counts", async (req, res) => {
  const counts = {};
  const queries = [
    { key: "students", sql: "SELECT COUNT(*) AS count FROM studenttable" },
    { key: "teachers", sql: "SELECT COUNT(*) AS count FROM teachertable" },
    { key: "employees", sql: "SELECT COUNT(*) AS count FROM employeetable" },
    { key: "announcements", sql: "SELECT COUNT(*) AS count FROM announcementtable" }
  ];

  try {
    for (const q of queries) {
      const result = await db.query(q.sql);
      counts[q.key] = result[0] ? result[0].count : 0;
    }
    res.json(counts);
  } catch (err) {
    console.error("Dashboard counts error:", err);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
});

// STUDENTS

app.get("/students", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    let query = "SELECT * FROM studenttable WHERE 1=1";
    const params = [];

    if (req.query.department) {
      query += " AND department = ?";
      params.push(req.query.department);
    }

    if (req.query.year) {
      query += " AND year = ?";
      params.push(formatYearLabel(req.query.year));
    }

    const results = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error("Fetch students error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/students", allowRoles("admin"), async (req, res) => {
  try {
    const { name, roll, email, department, year, password } = req.body;
    if (!name || !roll || !email || !department || !year || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const formattedYear = formatYearLabel(year);
    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `
      INSERT INTO studenttable 
      (name, roll, email, department, year, password) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [name, roll, email, department, formattedYear, hashedPassword]);
    res.json({ message: "Student added successfully" });
  } catch (err) {
    console.error("Student insert error:", err);
    res.status(500).json({ message: "Insert failed" });
  }
});

app.put("/students/:roll", allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, department, year, password } = req.body;
    if (!name || !email || !department || !year) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const formattedYear = formatYearLabel(year);
    const fields = ["name = ?", "email = ?", "department = ?", "year = ?"];
    const values = [name, email, department, formattedYear];

    if (password && password.trim() !== "") {
      fields.push("password = ?");
      const hashedPassword = bcrypt.hashSync(password, 10);
      values.push(hashedPassword);
    }

    values.push(req.params.roll);
    const sql = `UPDATE studenttable SET ${fields.join(", ")} WHERE roll = ?`;

    const result = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found or update failed" });
    }

    res.json({ message: "Student updated successfully" });
  } catch (err) {
    console.error("Student update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/students/:roll", allowRoles("admin"), async (req, res) => {
  try {
    const sql = "DELETE FROM studenttable WHERE roll = ?";
    const result = await db.query(sql, [req.params.roll]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Failed to delete student" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Student delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// TEACHERS

app.get("/teachers", async (_, res) => {
  try {
    const result = await db.query("SELECT * FROM teachertable");
    res.json(result);
  } catch (err) {
    console.error("Fetch teachers error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/teachers", allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, phone, department, password } = req.body;
    if (!name || !email || !phone || !department || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `
      INSERT INTO teachertable 
      (name, email, phone, department, password) 
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(sql, [name, email, phone, department, hashedPassword]);
    res.json({ success: true, message: "Teacher added successfully" });
  } catch (err) {
    console.error("Teacher insert error:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

app.put("/teachers/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, phone, department, password } = req.body;
    const fields = ["name = ?", "email = ?", "phone = ?", "department = ?"];
    const values = [name, email, phone, department];

    if (password && password.trim() !== "") {
      fields.push("password = ?");
      const hashedPassword = bcrypt.hashSync(password, 10);
      values.push(hashedPassword);
    }

    values.push(req.params.id);
    const sql = `UPDATE teachertable SET ${fields.join(", ")} WHERE id = ?`;

    const result = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Teacher not found or update failed" });
    }

    res.json({ success: true, message: "Teacher updated successfully" });
  } catch (err) {
    console.error("Teacher update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/teachers/:id", allowRoles("admin"), async (req, res) => {
  try {
    const sql = "DELETE FROM teachertable WHERE id = ?";
    const result = await db.query(sql, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Teacher not found or delete failed" });
    }
    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (err) {
    console.error("Teacher delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// EMPLOYEES

app.get("/employees", async (_, res) => {
  try {
    const result = await db.query("SELECT * FROM employeetable");
    res.json(result);
  } catch (err) {
    console.error("Fetch employees error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/employees", allowRoles("admin"), async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;
    if (!name || !role || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sql = "INSERT INTO employeetable (name, role, email, phone) VALUES (?, ?, ?, ?)";
    await db.query(sql, [name, role, email, phone]);
    res.json({ success: true, message: "Employee added successfully" });
  } catch (err) {
    console.error("Insert employee error:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

app.put("/employees/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;
    if (!name || !role || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sql = "UPDATE employeetable SET name=?, role=?, email=?, phone=? WHERE id=?";
    const result = await db.query(sql, [name, role, email, phone, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found or update failed" });
    }

    res.json({ success: true, message: "Employee updated successfully" });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/employees/:id", allowRoles("admin"), async (req, res) => {
  try {
    const sql = "DELETE FROM employeetable WHERE id=?";
    const result = await db.query(sql, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found or delete failed" });
    }

    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// DEPARTMENTS

app.get("/departments", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM departmenttable");
    res.json(results);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/departments", allowRoles("admin"), async (req, res) => {
  try {
    const { name, head, phone, email, strength } = req.body;

    if (!name || !head || !phone || !email || !strength) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const sql = "INSERT INTO departmenttable (name, head, phone, email, strength) VALUES (?, ?, ?, ?, ?)";
    await db.query(sql, [name, head, phone, email, strength]);
    res.json({ success: true, message: "Department added successfully" });
  } catch (err) {
    console.error("Error adding department:", err);
    res.status(500).json({ error: "Database insert error" });
  }
});

app.put("/departments/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, head, phone, email, strength } = req.body;
    const id = req.params.id;

    if (!name || !head || !phone || !email || !strength) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const sql = "UPDATE departmenttable SET name = ?, head = ?, phone = ?, email = ?, strength = ? WHERE id = ?";
    const result = await db.query(sql, [name, head, phone, email, strength, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Department not found or update failed" });
    }

    res.json({ success: true, message: "Department updated successfully" });
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).json({ error: "Database update error" });
  }
});

app.delete("/departments/:id", allowRoles("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const sql = "DELETE FROM departmenttable WHERE id = ?";
    const result = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Department not found or delete failed" });
    }

    res.json({ success: true, message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).json({ error: "Database delete error" });
  }
});

// COURSES

app.get("/courses", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM coursetable");
    res.json(results);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/courses", allowRoles("admin"), async (req, res) => {
  try {
    const { name, department, credits, year } = req.body;
    if (!name || !department || !credits || !year) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const formattedYear = formatYearLabel(year);
    const sql = "INSERT INTO coursetable (name, department, credits, year) VALUES (?, ?, ?, ?)";
    await db.query(sql, [name, department, credits, formattedYear]);
    res.json({ success: true, message: "Course added successfully" });
  } catch (err) {
    console.error("Error adding course:", err);
    res.status(500).json({ success: false, error: "Database insert error" });
  }
});

app.put("/courses/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, department, credits, year } = req.body;
    if (!name || !department || !credits || !year) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const formattedYear = formatYearLabel(year);
    const sql = "UPDATE coursetable SET name=?, department=?, credits=?, year=? WHERE id=?";
    const result = await db.query(sql, [name, department, credits, formattedYear, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Course not found or update failed" });
    }

    res.json({ success: true, message: "Course updated successfully" });
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ success: false, error: "Database update error" });
  }
});

app.delete("/courses/:id", allowRoles("admin"), async (req, res) => {
  try {
    const sql = "DELETE FROM coursetable WHERE id=?";
    const result = await db.query(sql, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Course not found or delete failed" });
    }

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ success: false, error: "Database delete error" });
  }
});

// STUDY MATERIALS

// Get all study materials
app.get("/studymaterials", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM studymaterialtable");
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching study materials:", err);
    res.status(500).json({ success: false, error: "Failed to fetch study materials" });
  }
});

// Upload a new study material (PDF/file)
app.post("/studymaterials/upload", allowRoles("admin", "teacher"), upload.single("file"), async (req, res) => {
  try {
    const uploaded_by = req.headers["x-role"];
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filename = req.file.filename;
    const upload_date = new Date().toISOString().split("T")[0];

    const sql = "INSERT INTO studymaterialtable (filename, uploaded_by, upload_date) VALUES (?, ?, ?)";
    const result = await db.query(sql, [filename, uploaded_by, upload_date]);

    res.json({ success: true, message: "File uploaded successfully", id: result.insertId });
  } catch (err) {
    console.error("Error uploading study material:", err);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// Delete a study material
app.delete("/studymaterials/:id", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT filename FROM studymaterialtable WHERE id = ?", [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "File not found in DB" });
    }

    const filePath = path.join(uploadsDir, rows[0].filename);

    fs.unlink(filePath, (fsErr) => {
      if (fsErr) console.warn("Failed to delete file from filesystem:", fsErr.message);
    });

    await db.query("DELETE FROM studymaterialtable WHERE id = ?", [id]);
    res.json({ success: true, message: "Study material deleted successfully" });
  } catch (err) {
    console.error("Error deleting study material:", err);
    res.status(500).json({ success: false, error: "Failed to delete study material" });
  }
});

// LIBRARY

// Get all books
app.get("/library", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM librarytable");
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching library records:", err);
    res.status(500).json({ success: false, error: "Failed to fetch library records" });
  }
});

// Add a new book
app.post("/library", allowRoles("admin"), async (req, res) => {
  try {
    const { title, author, subject } = req.body;
    if (!title || !author || !subject) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const sql = "INSERT INTO librarytable (title, author, subject) VALUES (?, ?, ?)";
    await db.query(sql, [title, author, subject]);
    res.json({ success: true, message: "Book added successfully" });
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ success: false, error: "Failed to add book" });
  }
});

// Update a book
app.put("/library/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { title, author, subject } = req.body;
    if (!title || !author || !subject) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const sql = "UPDATE librarytable SET title = ?, author = ?, subject = ? WHERE id = ?";
    const result = await db.query(sql, [title, author, subject, req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book updated successfully" });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ success: false, error: "Failed to update book" });
  }
});

// Delete a book
app.delete("/library/:id", allowRoles("admin"), async (req, res) => {
  try {
    const sql = "DELETE FROM librarytable WHERE id = ?";
    const result = await db.query(sql, [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({ success: true, message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ success: false, error: "Failed to delete book" });
  }
});

// MARKS

// Fetch marks with optional filters
app.get("/marks", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const { department, year, subject } = req.query;
    let sql = "SELECT * FROM markstable WHERE 1=1";
    const params = [];

    if (department) { sql += " AND department = ?"; params.push(department); }
    if (year) { sql += " AND year = ?"; params.push(year); }
    if (subject) { sql += " AND subject = ?"; params.push(subject); }

    const result = await db.query(sql, params);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching marks:", err);
    res.status(500).json({ success: false, error: "Failed to fetch marks" });
  }
});

// Fetch students based on department & year
app.get("/marks/students", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { department, year } = req.query;
    if (!department || !year) return res.json({ success: true, data: [] });

    const sql = "SELECT name, department, year FROM studenttable WHERE department=? AND TRIM(LOWER(year)) = LOWER(TRIM(?))";
    const result = await db.query(sql, [department, year]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching students for marks:", err);
    res.status(500).json({ success: false, error: "Failed to fetch students" });
  }
});

// Add or update marks (Admin/Teacher only)
app.post("/marks", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { student_name, subject, marks, department, year } = req.body;

    if (!student_name || !subject || marks == null || !department || !year) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const sql = `
      INSERT INTO markstable (student_name, subject, marks, department, year)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE marks = VALUES(marks)
    `;
    await db.query(sql, [student_name, subject, marks, department, year]);

    res.json({ success: true, message: "Marks saved successfully" });
  } catch (err) {
    console.error("Error saving marks:", err);
    res.status(500).json({ success: false, error: "Failed to save marks" });
  }
});

// ATTENDANCE

// Fetch attendance records with optional filters
app.get("/attendance", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const { department, year, date } = req.query;
    let sql = "SELECT * FROM attendancetable WHERE 1=1";
    const params = [];

    if (department) { sql += " AND department=?"; params.push(department); }
    if (year) { sql += " AND year=?"; params.push(year); }
    if (date) { sql += " AND date=?"; params.push(date); }

    const result = await db.query(sql, params);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
});

// Fetch students based on department & year
app.get("/attendance/students", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { department, year } = req.query;
    if (!department || !year) return res.json({ success: true, data: [] });

    const sql = "SELECT id, name FROM studenttable WHERE department=? AND TRIM(LOWER(year)) = LOWER(TRIM(?))";
    const result = await db.query(sql, [department, year]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching students for attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch students" });
  }
});

// Bulk add/update attendance (Admin/Teacher only)
app.post("/attendance/bulk", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !records.length) return res.status(400).json({ success: false, message: "No records to save" });

    const values = records.map(r => [r.student_id, r.student_name, r.department, r.year, r.date, r.status]);

    const sql = `
      INSERT INTO attendancetable (student_id, student_name, department, year, date, status)
      VALUES ?
      ON DUPLICATE KEY UPDATE status=VALUES(status)
    `;
    await db.query(sql, [values]);

    res.json({ success: true, message: "Attendance records saved successfully" });
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, error: "Failed to save attendance" });
  }
});


// ANNOUNCEMENTS

// Fetch all announcements
app.get("/announcements", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM announcementtable ORDER BY date DESC");
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ success: false, error: "Failed to fetch announcements" });
  }
});

// Add a new announcement (Admin/Teacher)
app.post("/announcements", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { title, message, date } = req.body;
    if (!title || !message || !date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    await db.query(
      "INSERT INTO announcementtable (title, message, date) VALUES (?, ?, ?)",
      [title, message, date]
    );
    res.json({ success: true, message: "Announcement added successfully" });
  } catch (err) {
    console.error("Error adding announcement:", err);
    res.status(500).json({ success: false, error: "Failed to add announcement" });
  }
});

// Update an existing announcement (Admin/Teacher)
app.put("/announcements/:id", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { title, message, date } = req.body;
    if (!title || !message || !date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const result = await db.query(
      "UPDATE announcementtable SET title=?, message=?, date=? WHERE id=?",
      [title, message, date, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, message: "Announcement updated successfully" });
  } catch (err) {
    console.error("Error updating announcement:", err);
    res.status(500).json({ success: false, error: "Failed to update announcement" });
  }
});

// Delete an announcement (Admin/Teacher)
app.delete("/announcements/:id", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const result = await db.query("DELETE FROM announcementtable WHERE id=?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({ success: false, error: "Failed to delete announcement" });
  }
});

//login routes
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("LOGIN HIT:", email, role);

  try {
    const [rows] = await db.query(
      "SELECT * FROM usertable WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];
    console.log("DB USER:", {
      email: user.email,
      role: user.role,
      hash: user.password
    });

    console.log("INPUT:", {
      email,
      role,
      password
    });
    const isMatch = bcrypt.compareSync(password, user.password);
    console.log("BCRYPT MATCH:", isMatch);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    if (user.role.toLowerCase() !== role.toLowerCase()) {
      return res.json({ success: false, message: "Invalid role selected" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



// START SERVER
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
