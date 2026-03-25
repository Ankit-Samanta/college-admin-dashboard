-- ============================================================
--  College Admin Panel Dashboard - MySQL Schema
--  Database: sql12820826 (freesqldatabase.com)
--  Run this in phpMyAdmin or any MySQL client
-- ============================================================

-- -------------------- ADMIN --------------------
CREATE TABLE IF NOT EXISTS usertable (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100)  NOT NULL,
  email    VARCHAR(100)  NOT NULL UNIQUE,
  password VARCHAR(255)  NOT NULL
);

-- -------------------- STUDENTS --------------------
CREATE TABLE IF NOT EXISTS studenttable (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  roll       VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  year       VARCHAR(20)  NOT NULL,
  password   VARCHAR(255) NOT NULL
);

-- -------------------- TEACHERS --------------------
CREATE TABLE IF NOT EXISTS teachertable (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  phone      VARCHAR(20)  NOT NULL,
  department VARCHAR(100) NOT NULL,
  password   VARCHAR(255) NOT NULL
);

-- -------------------- EMPLOYEES --------------------
CREATE TABLE IF NOT EXISTS employeetable (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  role  VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20)  NOT NULL
);

-- -------------------- DEPARTMENTS --------------------
CREATE TABLE IF NOT EXISTS departmenttable (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL UNIQUE,
  head     VARCHAR(100) NOT NULL,
  phone    VARCHAR(20)  NOT NULL,
  email    VARCHAR(100) NOT NULL,
  strength INT          NOT NULL DEFAULT 0
);

-- -------------------- COURSES --------------------
CREATE TABLE IF NOT EXISTS coursetable (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  credits    INT          NOT NULL DEFAULT 0,
  year       VARCHAR(20)  NOT NULL
);

-- -------------------- STUDY MATERIALS --------------------
CREATE TABLE IF NOT EXISTS studymaterialtable (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL,
  uploaded_by VARCHAR(50)  NOT NULL,
  upload_date DATE         NOT NULL
);

-- -------------------- LIBRARY --------------------
CREATE TABLE IF NOT EXISTS librarytable (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  title   VARCHAR(200) NOT NULL,
  author  VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NOT NULL
);

-- -------------------- MARKS --------------------
CREATE TABLE IF NOT EXISTS markstable (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  subject      VARCHAR(150) NOT NULL,
  marks        DECIMAL(5,2) NOT NULL,
  department   VARCHAR(100) NOT NULL,
  year         VARCHAR(20)  NOT NULL,
  UNIQUE KEY unique_mark (student_name, subject, department, year)
);

-- -------------------- ATTENDANCE --------------------
CREATE TABLE IF NOT EXISTS attendancetable (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT          NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  department   VARCHAR(100) NOT NULL,
  year         VARCHAR(20)  NOT NULL,
  date         DATE         NOT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'Absent',
  UNIQUE KEY unique_attendance (student_id, date)
);

-- -------------------- ANNOUNCEMENTS --------------------
CREATE TABLE IF NOT EXISTS announcementtable (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  title   VARCHAR(200) NOT NULL,
  message TEXT         NOT NULL,
  date    DATE         NOT NULL
);

-- ============================================================
--  DEFAULT ADMIN USER
--  Email: admin@college.com
--  Password: password   <-- change this after first login!
--  Hash below is bcrypt of the word: password
-- ============================================================
INSERT IGNORE INTO usertable (name, email, password) VALUES (
  'Admin',
  'admin@college.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);

-- NOTE: To create an admin with a custom password, run this in Node.js:
--   const bcrypt = require('bcryptjs');
--   console.log(bcrypt.hashSync('YOUR_PASSWORD', 10));
-- Then replace the hash above and re-run the INSERT.
