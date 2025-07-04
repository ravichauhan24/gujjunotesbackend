// utils/sendMail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"GujjuNotes" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions); // ✅ not sendmail()
    return { success: true };
  } catch (err) {
    console.error('❌ Email sending error:', err);
    return { success: false, error: err };
  }
};

module.exports = sendMail; // ✅ match import
