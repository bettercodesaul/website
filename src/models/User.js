const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../db/database');

class User {
  static async create({ email, password, name, role = 'editor' }) {
    const db = await getDatabase();
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.run(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `, [id, email, passwordHash, name, role]);
    saveDatabase();

    return this.findById(id);
  }

  static async findById(id) {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static async findByEmail(email) {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static validatePassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  static async list() {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static async update(id, { name, role }) {
    const db = await getDatabase();
    if (name !== undefined && role !== undefined) {
      db.run(`
        UPDATE users SET name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, role, id]);
    } else if (name !== undefined) {
      db.run(`
        UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, id]);
    } else if (role !== undefined) {
      db.run(`
        UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [role, id]);
    }
    saveDatabase();
    return this.findById(id);
  }

  static async delete(id) {
    const db = await getDatabase();
    db.run('DELETE FROM users WHERE id = ?', [id]);
    saveDatabase();
  }
}

module.exports = User;
