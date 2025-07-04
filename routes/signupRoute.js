const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config();

// DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gujjunotes'
});

  

// Register with OTP verification
router.post('/signup', async (req, res) => {
  const { email, otp, username, password } = req.body;

  if (!email || !otp || !username || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });

    
  }

  // 1. Verify OTP
  db.query("SELECT * FROM otp_verification WHERE email = ? AND otp = ?", [email, otp], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error during OTP check." });
    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // 2. Check if user already exists
    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, userCheck) => {
      if (err) return res.status(500).json({ success: false, message: "Database error during user check." });
      if (userCheck.length > 0) {
        return res.status(409).json({ success: false, message: "Username already taken. Try another." });
      }

      // 3. Hash password and save user
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, 'student'], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Error saving user." });
        return res.json({ success: true, message: "User registered successfully!" });
      });
    });
  });
});

module.exports = router;
