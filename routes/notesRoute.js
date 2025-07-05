const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/noteModel');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

const sendMail = require('../utils/sendMail'); // ✅ CamelCase




require('dotenv').config();

// 🔧 Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Upload a note with uploadMail
// ✅ Upload a note with uploadMail + authorName + selfMade + university
router.post('/upload', upload.single('noteFile'), (req, res) => {
  const {
    uploaderName,
    uploadMail,
    subject,
    semester,
    noteType,
    authorName,
    selfMade,
    university
  } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const isSelfMade = selfMade === 'on' || selfMade === 'true' ? 1 : 0;

  Note.create(
    {
      uploaderName,
      uploadMail,
      subject,
      semester,
      fileUrl,
      noteType,
      authorName: authorName || null,
      selfMade: isSelfMade,
      university: university || null
    },
    (err, result) => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err });
      }
      res.json({ success: true, message: 'Note uploaded successfully!' });
    }
  );
});


// ✅ Get all notes
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM notes ORDER BY uploadedAt DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json(results);
  });
});

// ✅ File existence status
router.get('/status', (req, res) => {
  const sql = 'SELECT * FROM notes ORDER BY uploadedAt DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const fullStatus = results.map(note => {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      const exists = fs.existsSync(filePath);
      return {
        ...note,
        fileExists: exists
      };
    });

    res.json(fullStatus);
  });
});

// ✅ Secure file download
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('❌ File Not Found');
  }

  res.download(filePath);
});

// ✅ Delete a note
router.delete('/:id', verifyToken, (req, res) => {
  const noteId = req.params.id;

  db.query('SELECT fileUrl FROM notes WHERE id = ?', [noteId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const fileUrl = results[0].fileUrl;
    const filePath = path.join(__dirname, '..', fileUrl);

    fs.unlink(filePath, (fileErr) => {
      if (fileErr && fileErr.code !== 'ENOENT') {
        return res.status(500).json({ success: false, message: 'File delete error' });
      }

      db.query('DELETE FROM notes WHERE id = ?', [noteId], (delErr) => {
        if (delErr) return res.status(500).json({ success: false, message: 'Failed to delete from DB' });

        res.json({ success: true, message: 'Note deleted successfully' });
      });
    });
  });
});

// ✅ Search/filter notes
router.get('/search', (req, res) => {
  const { subject, semester, noteType, university, authorName } = req.query;

  let sql = 'SELECT * FROM notes WHERE 1=1';
  const params = [];

  if (subject) {
    sql += ' AND subject LIKE ?';
    params.push(`%${subject}%`);
  }
  if (semester) {
    sql += ' AND semester = ?';
    params.push(semester);
  }
  if (noteType) {
    sql += ' AND noteType = ?';
    params.push(noteType);
  }
   if (university) {
    sql += ' AND university LIKE ?';
    params.push(`%${university}%`);
  }
  if (authorName) {
    sql += ' AND authorName LIKE ?';
    params.push(`%${authorName}%`);
  }

  sql += ' ORDER BY uploadedAt DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).json({ message: 'Error fetching notes', error: err });
    }
    res.json(results);
  });
});

// ✅ Approve note and send email
router.put('/approve/:id', async (req, res) => {
  const noteId = req.params.id;

  try {
    const [rows] = await db.promise().query('SELECT * FROM notes WHERE id = ?', [noteId]);
    const note = rows[0];

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await db.promise().query('UPDATE notes SET approved = 1 WHERE id = ?', [noteId]);

    const mailResult = await sendMail({
      to: note.uploadMail,
      subject: '✅ Your Note Has Been Approved!',
      html: `
        <p>Hi <b>${note.uploaderName}</b>,</p>
        <p>Your note titled <b>${note.subject}</b> has been approved and published on GujjuNotes.</p>
        <p>Thank you for contributing to the community! 🎉</p>
      `
    });

    if (!mailResult.success) {
      console.error('Email failed:', mailResult.error);
      return res.status(500).json({ success: false, message: 'Note approved but email failed.' });
    }

    res.json({ success: true, message: 'Note approved and email sent to user' });
  } catch (err) {
    console.error('Approval Error:', err);
    res.status(500).json({ success: false, message: 'Approval failed', error: err });
  }
});


module.exports = router;
