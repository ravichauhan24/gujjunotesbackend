const db = require('../db');

const Note = {
  create: (data, callback) => {
    const sql = `INSERT INTO notes (uploaderName, uploadMail, subject, semester, fileUrl, noteType, university, authorName, selfMade, uploadedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const values = [
      data.uploaderName,
      data.uploadMail,
      data.subject,
      data.semester,
      data.fileUrl,
      data.noteType,
      data.university || null,
      data.authorName || null,
      data.selfMade ? 1 : 0
    ];

    db.query(sql, values, callback);
  }
};

module.exports = Note;
