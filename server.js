const bcrypt = require("bcryptjs");
// Loading environment variables
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const mysql = require("mysql2");
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


// MySQL (Railway Compatible)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Railway MySQL pool error:", err);
  } else {
    console.log("✅ Connected to Railway MySQL (pool)");
    connection.release();
  }
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

app.get("/dashboard/counts", (req, res) => {
  const counts = {};
  const queries = [
    { key: "students", sql: "SELECT COUNT(*) AS count FROM studenttable" },
    { key: "teachers", sql: "SELECT COUNT(*) AS count FROM teachertable" },
    { key: "employees", sql: "SELECT COUNT(*) AS count FROM employeetable" },
    { key: "announcements", sql: "SELECT COUNT(*) AS count FROM announcementtable" }
  ];

  let completed = 0;
  queries.forEach(q => {
    db.query(q.sql, (err, result) => {
      counts[q.key] = err ? 0 : (result[0] ? result[0].count : 0);
      completed++;
      if (completed === queries.length) {
        res.json(counts);
      }
    });
  });
});


// STUDENTS

app.get("/students", allowRoles("admin", "teacher"), (req, res) => {
  const role = req.query.role || "";
  let query = "SELECT * FROM studenttable WHERE 1=1";
  const params = [];

  if (req.query.department) {
    query += " AND department = ?";
    params.push(req.query.department);
  }

  if (req.query.year) {
    query += " AND year = ?";
    params.push(req.query.year);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.post("/students", allowRoles("admin"), (req, res) => {

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

  db.query(
    sql,
    [name, roll, email, department, formattedYear, hashedPassword],
    (err) => {
      if (err) {
        console.error("Student insert error:", err);
        return res.status(500).json({ message: "Insert failed" });
      }
      res.json({ message: "Student added successfully" });
    }
  );
});


app.put("/students/:roll", allowRoles("admin"), (req, res) => {

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
  db.query(sql, values, (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.status(500).json({ message: "Student not found or update failed" });
    }
    res.json({ message: "Student updated successfully" });
  });
});

app.delete("/students/:roll", allowRoles("admin"), (req, res) => {

  const sql = "DELETE FROM studenttable WHERE roll = ?";
  db.query(sql, [req.params.roll], (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to delete student" });
    }
    res.json({ message: "Student deleted successfully" });
  });
});



// TEACHERS

app.get("/teachers", (_, res) => {
  db.query("SELECT * FROM teachertable", (err, result) => {
    if (err) return res.json({ error: err });
    res.json(result);
  });
});

app.post("/teachers", allowRoles("admin"), (req, res) => {

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

  db.query(
    sql,
    [name, email, phone, department, hashedPassword],
    (err) => {
      if (err) {
        console.error("Teacher insert error:", err);
        return res.status(500).json({ error: "Insert failed" });
      }
      res.json({ success: true, message: "Teacher added successfully" });
    }
  );
});

app.put("/teachers/:id", allowRoles("admin"), (req, res) => {

  const { name, email, phone, department, password } = req.body;

  if (password && password.trim() !== "") {
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      "UPDATE teachertable SET name=?, email=?, phone=?, department=?, password=? WHERE id=?",
      [name, email, phone, department, hashedPassword, req.params.id],
      (err) => {
        if (err) return res.json({ error: err });
        res.json({ success: true });
      }
    );
  } else {
    db.query(
      "UPDATE teachertable SET name=?, email=?, phone=?, department=? WHERE id=?",
      [name, email, phone, department, req.params.id],
      (err) => {
        if (err) return res.json({ error: err });
        res.json({ success: true });
      }
    );
  }
});



app.delete("/teachers/:id", allowRoles("admin"), (req, res) => {

  db.query("DELETE FROM teachertable WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});


// EMPLOYEES

app.get("/employees", (_, res) => {
  db.query("SELECT * FROM employeetable", (err, result) => {
    if (err) return res.json({ error: err });
    res.json(result);
  });
});

app.post("/employees", allowRoles("admin"), (req, res) => {
  const { name, role, email, phone } = req.body;
  db.query("INSERT INTO employeetable (name, role, email, phone) VALUES (?, ?, ?, ?)", [name, role, email, phone], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});

app.put("/employees/:id", allowRoles("admin"), (req, res) => {
  const { name, role, email, phone } = req.body;
  db.query("UPDATE employeetable SET name=?, role=?, email=?, phone=? WHERE id=?", [name, role, email, phone, req.params.id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});

app.delete("/employees/:id", allowRoles("admin"), (req, res) => {
  db.query("DELETE FROM employeetable WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});


// DEPARTMENTS

app.get("/departments", (req, res) => {
  const sql = "SELECT * FROM departmenttable";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.post("/departments", allowRoles("admin"), (req, res) => {
  const { name, head, phone, email, strength } = req.body;

  if (!name || !head || !phone || !email || !strength) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const sql = "INSERT INTO departmenttable (name, head, phone, email, strength) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, head, phone, email, strength], (err, result) => {
    if (err) {
      console.error("Error adding department:", err);
      return res.status(500).json({ error: "Database insert error" });
    }
    res.json({ message: "Department added successfully" });
  });
});

app.put("/departments/:id", allowRoles("admin"), (req, res) => {
  const id = req.params.id;
  const { name, head, phone, email, strength } = req.body;

  if (!name || !head || !phone || !email || !strength) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const sql = "UPDATE departmenttable SET name = ?, head = ?, phone = ?, email = ?, strength = ? WHERE id = ?";
  db.query(sql, [name, head, phone, email, strength, id], (err, result) => {
    if (err) {
      console.error("Error updating department:", err);
      return res.status(500).json({ error: "Database update error" });
    }
    res.json({ message: "Department updated successfully" });
  });
});

app.delete("/departments/:id", allowRoles("admin"), (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM departmenttable WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting department:", err);
      return res.status(500).json({ error: "Database delete error" });
    }
    res.json({ message: "Department deleted successfully" });
  });
});


// COURSES

app.get("/courses", (_, res) => {
  db.query("SELECT * FROM coursetable", (err, result) => {
    if (err) return res.json({ error: err });
    res.json(result);
  });
});

app.post("/courses", allowRoles("admin"), (req, res) => {

  const { name, department, credits, year } = req.body;
  if (!name || !department || !credits || !year) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const formattedYear = formatYearLabel(year);
  const sql = "INSERT INTO coursetable (name, department, credits, year) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, department, credits, formattedYear], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});

app.put("/courses/:id", allowRoles("admin"), (req, res) => {

  const { name, department, credits, year } = req.body;
  if (!name || !department || !credits || !year) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const formattedYear = formatYearLabel(year);
  const sql = "UPDATE coursetable SET name=?, department=?, credits=?, year=? WHERE id=?";
  db.query(sql, [name, department, credits, formattedYear, req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});

app.delete("/courses/:id", allowRoles("admin"), (req, res) => {

  const sql = "DELETE FROM coursetable WHERE id=?";
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});


// STUDY MATERIALS

app.get("/studymaterials", (req, res) => {
  db.query("SELECT * FROM studymaterialtable", (err, result) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

app.post("/studymaterials/upload", allowRoles("admin", "teacher"), upload.single("file"), (req, res) => {
  const uploaded_by = req.headers["x-role"];
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filename = req.file.filename;
  const upload_date = new Date().toISOString().split("T")[0];

  db.query("INSERT INTO studymaterialtable (filename, uploaded_by, upload_date) VALUES (?, ?, ?)",
    [filename, uploaded_by, upload_date],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ error: "Upload failed" });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.delete("/studymaterials/:id", allowRoles("admin", "teacher"), (req, res) => {
  const id = req.params.id;

  db.query("SELECT filename FROM studymaterialtable WHERE id = ?", [id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ error: "File not found in DB" });
    }

    const filePath = path.join(uploadsDir, result[0].filename);

    fs.unlink(filePath, (fsErr) => {
      if (fsErr) console.warn("Failed to delete file:", fsErr.message);
    });

    db.query("DELETE FROM studymaterialtable WHERE id = ?", [id], (delErr) => {
      if (delErr) return res.status(500).json({ error: "DB delete failed" });
      res.json({ success: true });
    });
  });
});


// LIBRARY
app.get("/library", (_, res) => {
  db.query("SELECT * FROM librarytable", (err, result) => {
    if (err) return res.json({ error: err });
    res.json(result);
  });
});

app.post("/library", allowRoles("admin"), (req, res) => {
  const { title, author, subject } = req.body;
  db.query("INSERT INTO librarytable (title, author, subject) VALUES (?, ?, ?)", [title, author, subject], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});

app.put("/library/:id", allowRoles("admin"), (req, res) => {
  const { title, author, subject } = req.body;

  const sql = `
    UPDATE librarytable
    SET title = ?, author = ?, subject = ?
    WHERE id = ?
  `;

  db.query(sql, [title, author, subject, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Book updated successfully" });
  });
});

app.delete("/library/:id", allowRoles("admin"), (req, res) => {
  db.query("DELETE FROM librarytable WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});


// MARKS

app.get("/marks", (req, res) => {
  const { department, year, subject } = req.query;

  let sql = "SELECT * FROM markstable WHERE 1=1";
  const params = [];

  if (department) {
    sql += " AND department = ?";
    params.push(department);
  }
  if (year) {
    sql += " AND year = ?";
    params.push(year);
  }
  if (subject) {
    sql += " AND subject = ?";
    params.push(subject);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch marks" });
    res.json(result);
  });
});

app.get("/marks/students", (req, res) => {
  const { department, year } = req.query;

  db.query("SELECT name, department, year FROM studenttable WHERE department = ? AND year = ?", [department, year], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch students" });
    res.json(result);
  });
});

app.post("/marks", allowRoles("admin", "teacher"), (req, res) => {
  const { student_name, subject, marks, department, year } = req.body;

  const sql = `
    INSERT INTO markstable (student_name, subject, marks, department, year)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE marks = VALUES(marks)
  `;

  db.query(sql, [student_name, subject, marks, department, year], (err) => {
    if (err) return res.status(500).json({ error: "Failed to save mark" });
    res.json({ message: "Marks saved successfully" });
  });
});


// Fetching attendance records (by department/year/date)
app.get("/attendance", (req, res) => {
  const { department, year, date } = req.query;

  let sql = "SELECT * FROM attendancetable WHERE 1=1";
  const params = [];

  if (department) { sql += " AND department=?"; params.push(department); }
  if (year) { sql += " AND year=?"; params.push(year); }
  if (date) { sql += " AND date=?"; params.push(date); }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch attendance" });
    res.json(result);
  });
});

app.get("/attendance/students", (req, res) => {
  const { department, year } = req.query;
  if (!department || !year) return res.json([]);

  const sql = "SELECT id, name FROM studenttable WHERE department=? AND TRIM(LOWER(year)) = LOWER(TRIM(?))";

  db.query(sql, [department, year], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch students" });
    res.json(result);
  });
});


app.post("/attendance/bulk", allowRoles("admin", "teacher"), (req, res) => {
  const { records } = req.body;
  if (!records || !records.length) return res.status(400).json({ message: "No records to save" });

  const values = records.map(r => [r.student_id, r.student_name, r.department, r.year, r.date, r.status]);

  const sql = `
    INSERT INTO attendancetable (student_id, student_name, department, year, date, status)
    VALUES ?
    ON DUPLICATE KEY UPDATE status=VALUES(status)
  `;

  db.query(sql, [values], (err) => {
    if (err) return res.status(500).json({ error: "Failed to save attendance" });
    res.json({ success: true });
  });
});


// ANNOUNCEMENTS

app.get("/announcements", (_, res) => {
  db.query("SELECT * FROM announcementtable", (err, result) => {
    if (err) return res.json({ error: err });
    res.json(result);
  });
});

app.post("/announcements", allowRoles("admin", "teacher"), (req, res) => {
  const { title, message, date } = req.body;
  db.query("INSERT INTO announcementtable (title, message, date) VALUES (?, ?, ?)", [title, message, date], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});

app.put("/announcements/:id", allowRoles("admin", "teacher"), (req, res) => {
  const { title, message, date } = req.body;
  db.query("UPDATE announcementtable SET title=?, message=?, date=? WHERE id=?", [title, message, date, req.params.id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});

app.delete("/announcements/:id", allowRoles("admin", "teacher"), (req, res) => {
  db.query("DELETE FROM announcementtable WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ error: err });
    res.json({ success: true });
  });
});

// LOGIN

app.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  let table, field;

  if (role === "admin") {
    table = "usertable";
    field = "email";
  } else if (role === "teacher") {
    table = "teachertable";
    field = "email";
  } else if (role === "student") {
    table = "studenttable";
    field = "email";
  } else {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  const sql = `SELECT * FROM ${table} WHERE ${field} = ? LIMIT 1`;

  db.query(sql, [email], (err, rows) => {
    if (err || rows.length === 0) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      role,
      user: {
        id: user.id,
        name: user.name || user.username,
        email: user.email
      }
    });
  });
});


// START SERVER

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
