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

// DASHBOARD COUNTS
app.get("/dashboard/counts", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const [[students]] = await db.query("SELECT COUNT(*) AS count FROM studenttable");
    const [[teachers]] = await db.query("SELECT COUNT(*) AS count FROM teachertable");
    const [[employees]] = await db.query("SELECT COUNT(*) AS count FROM employeetable");
    const [[announcements]] = await db.query("SELECT COUNT(*) AS count FROM announcementtable");

    res.json({
      students: students.count,
      teachers: teachers.count,
      employees: employees.count,
      announcements: announcements.count
    });
  } catch (err) {
    console.error("Dashboard count error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard counts" });
  }
});

// ================= STUDENTS =================

// GET ALL STUDENTS (FILTERABLE)
app.get("/students", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    let query = "SELECT id, name, roll, email, department, year FROM studenttable WHERE 1=1";
    const params = [];

    if (req.query.department) {
      query += " AND department = ?";
      params.push(req.query.department);
    }

    if (req.query.year) {
      query += " AND year = ?";
      params.push(formatYearLabel(req.query.year));
    }

    // fixed estructure result
    const [students] = await db.query(query, params);
    res.json(students);
  } catch (err) {
    console.error("Fetch students error:", err);
    res.status(500).json({ message: "Database error" });
  }
});
// GET SINGLE STUDENT BY ID (FOR EDIT)
app.get("/students/:id", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, roll, email, department, year FROM studenttable WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Fetch single student error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ADD STUDENT
app.post("/students", allowRoles("admin"), async (req, res) => {
  try {
    const { name, roll, email, department, year, password } = req.body;

    if (!name || !roll || !email || !department || !year || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const formattedYear = formatYearLabel(year);

    const sql = `
      INSERT INTO studenttable (name, roll, email, department, year, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      name,
      roll,
      email,
      department,
      formattedYear,
      hashedPassword
    ]);

    res.json({ message: "Student added successfully" });
  } catch (err) {
    console.error("Student insert error:", err);
    res.status(500).json({ message: "Insert failed" });
  }
});

// UPDATE STUDENT (BY ID)
app.put("/students/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, roll, email, department, year, password } = req.body;

    if (!name || !roll || !email || !department || !year) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const fields = [
      "name = ?",
      "roll = ?",
      "email = ?",
      "department = ?",
      "year = ?"
    ];

    const values = [
      name,
      roll,
      email,
      department,
      formatYearLabel(year)
    ];

    if (password && password.trim() !== "") {
      fields.push("password = ?");
      values.push(bcrypt.hashSync(password, 10));
    }

    values.push(req.params.id);

    const sql = `UPDATE studenttable SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student updated successfully" });
  } catch (err) {
    console.error("Student update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});


// DELETE STUDENT (BY ID)
app.delete("/students/:id", allowRoles("admin"), async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM studenttable WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Student delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ================= TEACHERS =================

// GET all teachers
app.get("/teachers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM teachertable");
    res.json(rows); 
  } catch (err) {
    console.error("Fetch teachers error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ADD teacher
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
    res.json({ message: "Teacher added successfully" });
  } catch (err) {
    console.error("Teacher insert error:", err);
    res.status(500).json({ message: "Insert failed" });
  }
});

// UPDATE teacher
app.put("/teachers/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, phone, department, password } = req.body;

    if (!name || !email || !phone || !department) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const fields = ["name = ?", "email = ?", "phone = ?", "department = ?"];
    const values = [name, email, phone, department];

    if (password && password.trim() !== "") {
      fields.push("password = ?");
      values.push(bcrypt.hashSync(password, 10));
    }

    values.push(req.params.id);

    const sql = `
      UPDATE teachertable
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ message: "Teacher updated successfully" });
  } catch (err) {
    console.error("Teacher update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE teacher
app.delete("/teachers/:id", allowRoles("admin"), async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM teachertable WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ message: "Teacher deleted successfully" });
  } catch (err) {
    console.error("Teacher delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ================= EMPLOYEES =================

// GET all employees
app.get("/employees", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employeetable");
    res.json(rows); 
  } catch (err) {
    console.error("Fetch employees error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ADD employee
app.post("/employees", allowRoles("admin"), async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;

    if (!name || !role || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const sql = `
      INSERT INTO employeetable (name, role, email, phone)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [name, role, email, phone]);

    res.json({
      success: true,
      message: "Employee added successfully"
    });
  } catch (err) {
    console.error("Insert employee error:", err);
    res.status(500).json({
      success: false,
      message: "Insert failed"
    });
  }
});


// UPDATE employee
app.put("/employees/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;

    if (!name || !role || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const [result] = await db.query(
      `UPDATE employeetable
       SET name=?, role=?, email=?, phone=?
       WHERE id=?`,
      [name, role, email, phone, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee updated successfully"
    });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({
      success: false,
      message: "Update failed"
    });
  }
});

// DELETE employee
app.delete("/employees/:id", allowRoles("admin"), async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM employeetable WHERE id=?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

// ================= DEPARTMENTS =================

// GET all departments
app.get("/departments", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM departmenttable");
    res.json(rows); 
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ADD department
app.post("/departments", allowRoles("admin"), async (req, res) => {
  try {
    const { name, head, phone, email, strength } = req.body;

    if (!name || !head || !phone || !email || !strength) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const sql = `
      INSERT INTO departmenttable (name, head, phone, email, strength)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(sql, [name, head, phone, email, strength]);

    res.json({
      success: true,
      message: "Department added successfully"
    });
  } catch (err) {
    console.error("Add department error:", err);
    res.status(500).json({
      success: false,
      message: "Insert failed"
    });
  }
});


// UPDATE department
app.put("/departments/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, head, phone, email, strength } = req.body;

    if (!name || !head || !phone || !email || !strength) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const [result] = await db.query(
      `UPDATE departmenttable
       SET name=?, head=?, phone=?, email=?, strength=?
       WHERE id=?`,
      [name, head, phone, email, strength, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      message: "Department updated successfully"
    });
  } catch (err) {
    console.error("Update department error:", err);
    res.status(500).json({
      success: false,
      message: "Update failed"
    });
  }
});


// DELETE department
app.delete("/departments/:id", allowRoles("admin"), async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM departmenttable WHERE id=?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      message: "Department deleted successfully"
    });
  } catch (err) {
    console.error("Delete department error:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

// ================= COURSES =================

// GET courses (with optional department & year filter)
app.get("/courses", async (req, res) => {
  try {
    let sql = "SELECT * FROM coursetable WHERE 1=1";
    const params = [];

    if (req.query.department) {
      sql += " AND department = ?";
      params.push(req.query.department);
    }

    if (req.query.year) {
      sql += " AND year = ?";
      params.push(formatYearLabel(req.query.year));
    }

    const [rows] = await db.query(sql, params);
    res.json(rows); 
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ADD course
app.post("/courses", allowRoles("admin"), async (req, res) => {
  try {
    const { name, department, credits, year } = req.body;

    if (!name || !department || !credits || !year) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const formattedYear = formatYearLabel(year);

    const sql = `
      INSERT INTO coursetable
      (name, department, credits, year)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [name, department, credits, formattedYear]);
    res.json({ message: "Course added successfully" });
  } catch (err) {
    console.error("Error adding course:", err);
    res.status(500).json({ message: "Insert failed" });
  }
});

// UPDATE course
app.put("/courses/:id", allowRoles("admin"), async (req, res) => {
  try {
    const { name, department, credits, year } = req.body;

    if (!name || !department || !credits || !year) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const formattedYear = formatYearLabel(year);

    const [result] = await db.query(
      "UPDATE coursetable SET name=?, department=?, credits=?, year=? WHERE id=?",
      [name, department, credits, formattedYear, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "Course updated successfully" });
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE course
app.delete("/courses/:id", allowRoles("admin"), async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM coursetable WHERE id=?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ================= STUDY MATERIALS =================

// GET ALL STUDY MATERIALS
app.get(
  "/studymaterials",
  allowRoles("admin", "teacher", "student"),
  async (req, res) => {
    try {
      // fixed destructure rows
      const [rows] = await db.query(
        "SELECT * FROM studymaterialtable ORDER BY upload_date DESC"
      );

      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("Fetch study materials error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch study materials"
      });
    }
  }
);


// UPLOAD STUDY MATERIAL
app.post(
  "/studymaterials/upload",
  allowRoles("admin", "teacher"),
  upload.single("file"),
  async (req, res) => {
    try {
      const uploaded_by = req.headers["x-role"];

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const filename = req.file.filename;
      const upload_date = new Date().toISOString().split("T")[0];

      // fixed  destructure result
      const [result] = await db.query(
        `
        INSERT INTO studymaterialtable
        (filename, uploaded_by, upload_date)
        VALUES (?, ?, ?)
        `,
        [filename, uploaded_by, upload_date]
      );

      res.json({
        success: true,
        message: "File uploaded successfully",
        id: result.insertId
      });
    } catch (err) {
      console.error("Upload study material error:", err);
      res.status(500).json({
        success: false,
        error: "Upload failed"
      });
    }
  }
);


// DELETE STUDY MATERIAL
app.delete(
  "/studymaterials/:id",
  allowRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // ✅ FIX: destructure rows
      const [rows] = await db.query(
        "SELECT filename FROM studymaterialtable WHERE id = ?",
        [id]
      );

      if (!rows.length) {
        return res
          .status(404)
          .json({ success: false, message: "File not found" });
      }

      const filePath = path.join(uploadsDir, rows[0].filename);

      // Delete file (non-blocking)
      fs.unlink(filePath, err => {
        if (err) console.warn("File delete warning:", err.message);
      });

      await db.query(
        "DELETE FROM studymaterialtable WHERE id = ?",
        [id]
      );

      res.json({
        success: true,
        message: "Study material deleted successfully"
      });
    } catch (err) {
      console.error("Delete study material error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to delete study material"
      });
    }
  }
);

// ================= LIBRARY =================

// GET ALL BOOKS
app.get(
  "/library",
  allowRoles("admin", "teacher", "student"),
  async (req, res) => {
    try {
      // fixed destructure rows
      const [rows] = await db.query(
        "SELECT * FROM librarytable ORDER BY id DESC"
      );

      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("Fetch library error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch library records"
      });
    }
  }
);


// ADD BOOK
app.post(
  "/library",
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { title, author, subject } = req.body;

      if (!title || !author || !subject) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // fixed destructure result
      const [result] = await db.query(
        `
        INSERT INTO librarytable (title, author, subject)
        VALUES (?, ?, ?)
        `,
        [title, author, subject]
      );

      res.json({
        success: true,
        message: "Book added successfully",
        id: result.insertId
      });
    } catch (err) {
      console.error("Add book error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to add book"
      });
    }
  }
);


// UPDATE BOOK
app.put(
  "/library/:id",
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { title, author, subject } = req.body;

      if (!title || !author || !subject) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // fixed destructure result
      const [result] = await db.query(
        `
        UPDATE librarytable
        SET title = ?, author = ?, subject = ?
        WHERE id = ?
        `,
        [title, author, subject, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Book not found"
        });
      }

      res.json({
        success: true,
        message: "Book updated successfully"
      });
    } catch (err) {
      console.error("Update book error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to update book"
      });
    }
  }
);


// DELETE BOOK
app.delete(
  "/library/:id",
  allowRoles("admin"),
  async (req, res) => {
    try {
      // fixed destructure result
      const [result] = await db.query(
        "DELETE FROM librarytable WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Book not found"
        });
      }

      res.json({
        success: true,
        message: "Book deleted successfully"
      });
    } catch (err) {
      console.error("Delete book error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to delete book"
      });
    }
  }
);



// ================= MARKS =================

// GET MARKS
app.get("/marks", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const { department, year, subject } = req.query;

    const role = req.user?.role;
    const studentName = req.user?.name;

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

    // student ONLY HIS OWN MARKS
    if (role === "student") {
      if (!studentName) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: student identity missing"
        });
      }

      sql += " AND student_name = ?";
      params.push(studentName);
    }

    const [rows] = await db.query(sql, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch marks error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch marks" });
  }
});

// GET STUDENTS FOR MARK ENTRY
app.get("/marks/students", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { department, year } = req.query;

    if (!department || !year) {
      return res.json({ success: true, data: [] });
    }

    const sql = `
      SELECT name AS student_name, department, year
      FROM studenttable
      WHERE department = ?
      AND TRIM(LOWER(year)) = LOWER(TRIM(?))
    `;

    // Fixed destructure mysql2 result
    const [rows] = await db.query(sql, [department, year]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch students error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch students" });
  }
});


// ADD / UPDATE MARKS
app.post("/marks", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { student_name, subject, marks, department, year } = req.body;

    if (!student_name || !subject || marks == null || !department || !year) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const sql = `
      INSERT INTO markstable (student_name, subject, marks, department, year)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE marks = VALUES(marks)
    `;

    await db.query(sql, [student_name, subject, marks, department, year]);

    res.json({ success: true, message: "Marks saved successfully" });
  } catch (err) {
    console.error("Save marks error:", err);
    res.status(500).json({ success: false, error: "Failed to save marks" });
  }
});

// ================= ATTENDANCE =================

// FETCH ATTENDANCE
app.get("/attendance", allowRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const { department, year, date } = req.query;

    let sql = "SELECT * FROM attendancetable WHERE 1=1";
    const params = [];

    if (department) {
      sql += " AND department = ?";
      params.push(department);
    }

    if (year) {
      sql += " AND TRIM(LOWER(year)) = LOWER(TRIM(?))";
      params.push(formatYearLabel(year));
    }

    if (date) {
      sql += " AND DATE(date) = DATE(?)";
      params.push(date);
    }

    // fixed  destructure rows
    const [rows] = await db.query(sql, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch attendance error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
});


// FETCH STUDENTS FOR ATTENDANCE
app.get("/attendance/students", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { department, year } = req.query;

    if (!department || !year) {
      return res.json({ success: true, data: [] });
    }

    const sql = `
      SELECT id, name, department, year
      FROM studenttable
      WHERE department = ?
      AND TRIM(LOWER(year)) = LOWER(TRIM(?))
    `;

    // fixed destructure rows
    const [rows] = await db.query(sql, [
      department,
      formatYearLabel(year)
    ]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch attendance students error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch students" });
  }
});


// BULK ADD / UPDATE ATTENDANCE
app.post("/attendance/bulk", allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No records provided" });
    }

    const values = records.map(r => [
      r.student_id,
      r.student_name,
      r.department,
      formatYearLabel(r.year),
      r.date,
      r.status
    ]);

    const sql = `
      INSERT INTO attendancetable
      (student_id, student_name, department, year, date, status)
      VALUES ?
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;

    await db.query(sql, [values]);

    res.json({ success: true, message: "Attendance saved successfully" });
  } catch (err) {
    console.error("Save attendance error:", err);
    res.status(500).json({ success: false, error: "Failed to save attendance" });
  }
});
// ================= STUDENT ATTENDANCE (SELF VIEW) =================
app.get(
  "/attendance/my",
  allowRoles("student"),
  async (req, res) => {
    try {
      const { email, date } = req.query;

      if (!email || !date) {
        return res.json({ success: true, data: [] });
      }

      // Find student by email
      const [students] = await db.query(
        "SELECT id, name, department, year FROM studenttable WHERE email = ?",
        [email]
      );

      if (!students.length) {
        return res.json({ success: true, data: [] });
      }

      const student = students[0];

      // Fetch attendance for that student
      const [rows] = await db.query(
        `
        SELECT student_name, department, year, status
        FROM attendancetable
        WHERE student_id = ?
          AND DATE(date) = DATE(?)
        `,
        [student.id, date]
      );

      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("Student attendance fetch error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to load student attendance"
      });
    }
  }
);


// ================= ANNOUNCEMENTS =================

// FETCH ALL ANNOUNCEMENTS
app.get(
  "/announcements",
  allowRoles("admin", "teacher", "student"),
  async (req, res) => {
    try {
      // ✅ FIX: destructure rows
      const [rows] = await db.query(
        "SELECT * FROM announcementtable ORDER BY date DESC"
      );

      res.json({
        success: true,
        data: rows
      });
    } catch (err) {
      console.error("Fetch announcements error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch announcements"
      });
    }
  }
);


// ADD ANNOUNCEMENT
app.post(
  "/announcements",
  allowRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const { title, message, date } = req.body;

      if (!title || !message || !date) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // fixed destructure result
      const [result] = await db.query(
        `
        INSERT INTO announcementtable (title, message, date)
        VALUES (?, ?, ?)
        `,
        [title, message, date]
      );

      res.json({
        success: true,
        message: "Announcement added successfully",
        id: result.insertId
      });
    } catch (err) {
      console.error("Add announcement error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to add announcement"
      });
    }
  }
);


// UPDATE ANNOUNCEMENT
app.put(
  "/announcements/:id",
  allowRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const { title, message, date } = req.body;

      if (!title || !message || !date) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // fixed destructure result
      const [result] = await db.query(
        `
        UPDATE announcementtable
        SET title = ?, message = ?, date = ?
        WHERE id = ?
        `,
        [title, message, date, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found"
        });
      }

      res.json({
        success: true,
        message: "Announcement updated successfully"
      });
    } catch (err) {
      console.error("Update announcement error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to update announcement"
      });
    }
  }
);


// DELETE ANNOUNCEMENT
app.delete(
  "/announcements/:id",
  allowRoles("admin", "teacher"),
  async (req, res) => {
    try {
      // fixed destructure result
      const [result] = await db.query(
        "DELETE FROM announcementtable WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found"
        });
      }

      res.json({
        success: true,
        message: "Announcement deleted successfully"
      });
    } catch (err) {
      console.error("Delete announcement error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to delete announcement"
      });
    }
  }
);


// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("LOGIN HIT:", email, role);

  try {
    let table = "";

    // Decide table based on role
    if (role === "admin") table = "usertable";
    else if (role === "teacher") table = "teachertable";
    else if (role === "student") table = "studenttable";
    else {
      return res.json({ success: false, message: "Invalid role" });
    }

    const [rows] = await db.query(
      `SELECT * FROM ${table} WHERE email = ?`,
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];

    console.log("DB USER:", {
      email: user.email,
      hash: user.password
    });

    const isMatch = bcrypt.compareSync(password, user.password);
    console.log("BCRYPT MATCH:", isMatch);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // SUCCESS
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: role,
        name: user.name
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
