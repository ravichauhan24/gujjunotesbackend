const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/noteModel');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');




// 🔧 Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Upload a note
router.post('/upload', upload.single('noteFile'), (req, res) => {
  const { uploaderName, subject, semester, noteType } = req.body;
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  Note.create({ uploaderName, subject, semester, fileUrl, noteType }, (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }
    res.json({ success: true, message: 'Note uploaded successfully!' });
  });
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



// DELETE /api/notes/:id
router.delete('/:id', verifyToken, (req, res) => {
  const noteId = req.params.id;

  // 1. Find file URL from DB
  db.query('SELECT fileUrl FROM notes WHERE id = ?', [noteId], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const fileUrl = results[0].fileUrl;
    const filePath = path.join(__dirname, '..', fileUrl);

    // 2. Delete file from disk
    fs.unlink(filePath, (fileErr) => {
      if (fileErr && fileErr.code !== 'ENOENT') {
        console.error("File deletion error:", fileErr);
        return res.status(500).json({ success: false, message: 'File delete error' });
      }

      // 3. Delete from DB
      db.query('DELETE FROM notes WHERE id = ?', [noteId], (delErr) => {
        if (delErr) {
          console.error("DB delete error:", delErr);
          return res.status(500).json({ success: false, message: 'Failed to delete from DB' });
        }

        res.json({ success: true, message: 'Note deleted successfully' });
      });
    });
  });
});


// ✅ Search/filter notes
router.get('/search', (req, res) => {
  const { subject, semester, noteType } = req.query;
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

  sql += ' ORDER BY uploadedAt DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).json({ message: 'Error fetching notes', error: err });
    }
    res.json(results);
  });
});

// approved
// In routes/notes.js
router.put('/approve/:id', (req, res) => {
  const noteId = req.params.id;
  const sql = 'UPDATE notes SET approved = 1 WHERE id = ?';
  db.query(sql, [noteId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    res.json({ success: true, message: 'Note approved' });
  });
});


module.exports = router;
