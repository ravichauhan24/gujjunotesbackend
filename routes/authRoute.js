const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // or SMS


// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    
    if (err) return res.status(500).json({ message: 'DB error' });
    if (results.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'secret123', { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';

    db.query(sql, [username, hashedPassword, 'student'], (err, result) => {
      if (err) return res.status(500).json({ message: 'Registration failed', error: err });
      res.json({ message: 'User registered successfully' });
    });
  });
});




// Safe file download route (optional)
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('❌ File Not Found');
  }

  res.download(filePath); // prompt user to download
});

// ✅ 1. Send OTP
router.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  db.query('REPLACE INTO otp (email, otp) VALUES (?, ?)', [email, otp], async (err) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });

    // OPTIONAL: Send email
    console.log(`OTP for ${email} is ${otp}`);

    // Uncomment and set real transporter if you want email delivery
    /*
    const transporter = nodemailer.createTransport({ ... });
    await transporter.sendMail({
      from: 'your@email.com',
      to: email,
      subject: 'GujjuNotes OTP Verification',
      text: `Your OTP is ${otp}`
    });
    */

    res.json({ success: true, message: 'OTP sent successfully' });
  });
});

// ✅ 2. Signup with OTP check
router.post('/signup', async (req, res) => {
  const { username, password, email, otp } = req.body;

  db.query('SELECT * FROM otp WHERE email = ? AND otp = ?', [email, otp], async (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashed, 'student'], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'User already exists or DB error' });

      db.query('DELETE FROM otp WHERE email = ?', [email]); // Clean up
      res.json({ success: true, message: 'Signup successful' });
    });
  });
});


module.exports = router;

