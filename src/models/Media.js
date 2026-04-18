const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../db/database');

class Media {
  static async create({ filename, originalName, mimeType, size, url, uploadedBy }) {
    const db = await getDatabase();
    const id = uuidv4();

    db.run(`
      INSERT INTO media (id, filename, original_name, mime_type, size, url, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, originalName, mimeType, size, url, uploadedBy]);
    saveDatabase();

    return this.findById(id);
  }

  static async findById(id) {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT m.id, m.filename, m.original_name, m.mime_type, m.size, m.url,
             m.uploaded_by, u.name as uploaded_by_name, m.created_at
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static async list({ limit = 50, offset = 0 } = {}) {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT m.id, m.filename, m.original_name, m.mime_type, m.size, m.url,
             m.uploaded_by, u.name as uploaded_by_name, m.created_at
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([parseInt(limit) || 50, parseInt(offset) || 0]);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static async delete(id) {
    const db = await getDatabase();
    db.run('DELETE FROM media WHERE id = ?', [id]);
    saveDatabase();
  }
}

module.exports = Media;
