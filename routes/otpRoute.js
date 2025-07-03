const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db'); // Adjust path if needed
require('dotenv').config();
const path = require('path');
const fs = require('fs');



// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP API
router.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  db.query(
    'INSERT INTO otp_verification (email, otp) VALUES (?, ?) ON DUPLICATE KEY UPDATE otp = ?',
    [email, otp, otp],
    (err) => {
      if (err) return res.json({ success: false, message: 'DB Error' });

      // ✅ Load email template
      const templatePath = path.join(__dirname, '../templates/otp_template.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');

      // ✅ Replace placeholder with real OTP
      htmlContent = htmlContent.replace('{{OTP}}', otp);

      // ✅ Send Email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for GujjuNotes',
        html: htmlContent
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) return res.json({ success: false, message: 'Email send failed' });
        return res.json({ success: true, message: 'OTP sent successfully' });
      });
    }
  );
});

module.exports = router;
