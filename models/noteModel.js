const db = require('../db');

const Note = {
  create: (data, callback) => {
    const sql = `INSERT INTO notes (uploaderName, uploadMail, subject, semester, fileUrl, noteType, uploadedAt)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`;
    db.query(sql, [
      data.uploaderName,
      data.uploadMail,
      data.subject,
      data.semester,
      data.fileUrl,
      data.noteType
    ], callback);
  }
};

module.exports = Note;
