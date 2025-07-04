const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db');
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

      const templatePath = path.join(__dirname, '../templates/otp_template.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');
      htmlContent = htmlContent.replace('{{OTP}}', otp);

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


// ✅ Approve Note API + Send Approval Email
// ✅ Approve Note API + Send Approval Email
router.post('/approve-note/:noteId', async (req, res) => {
  const noteId = req.params.noteId;

  try {
    // 1. Get note from database
    const [rows] = await db.promise().query('SELECT * FROM notes WHERE id = ?', [noteId]);
    const note = rows[0];

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // 2. ✅ FIXED: Set approved = 1 instead of status = 'approved'
    await db.promise().query('UPDATE notes SET approved = 1 WHERE id = ?', [noteId]);

    // 3. Prepare approval email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: note.email,
      subject: '✅ Your Note Has Been Approved!',
      html: `
        <p>Hi <b>${note.uploaderName}</b>,</p>
        <p>Your note titled <b>${note.subject}</b> has been approved and is now live on <b>GujjuNotes</b>.</p>
        <p>Thanks for sharing your notes with the community! 🙌</p>
        <hr />
        <p style="font-size: 12px;">— Team GujjuNotes</p>
      `
    };

    // 4. Send the email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Note approved and email sent to user.' });

  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


module.exports = router;
