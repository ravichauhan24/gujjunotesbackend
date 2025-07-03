CREATE DATABASE IF NOT EXISTS gujjunotes;
USE gujjunotes;

CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploaderName VARCHAR(100),
  subject VARCHAR(100),
  semester INT,
  fileUrl VARCHAR(255),
  noteType ENUM('free', 'paid'),
  uploadedAt DATETIME
);
