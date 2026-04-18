const { v4: uuidv4 } = require('uuid');
const { getDatabase, saveDatabase } = require('../db/database');

class Page {
  static async create({ title, slug, content, excerpt = '', status = 'draft', authorId }) {
    const db = await getDatabase();
    const id = uuidv4();

    db.run(`
      INSERT INTO pages (id, title, slug, content, excerpt, status, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, title || '', slug || '', content || '', excerpt || '', status || 'draft', authorId || '']);
    saveDatabase();

    return this.findById(id);
  }

  static async findById(id) {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.status,
             p.author_id, u.name as author_name,
             p.created_at, p.updated_at, p.published_at
      FROM pages p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
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

  static async findBySlug(slug) {
    const db = await getDatabase();
    const stmt = db.prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.status,
             p.author_id, u.name as author_name,
             p.created_at, p.updated_at, p.published_at
      FROM pages p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `);
    stmt.bind([slug]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static async list({ status, limit = 20, offset = 0 } = {}) {
    const db = await getDatabase();
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const stmt = db.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.status, p.author_id,
             u.name as author_name, p.created_at, p.published_at
      FROM pages p
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([...params, limit || 20, offset || 0]);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static async update(id, { title, slug, content, excerpt, status }) {
    const db = await getDatabase();
    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (slug !== undefined) { fields.push('slug = ?'); params.push(slug); }
    if (content !== undefined) { fields.push('content = ?'); params.push(content); }
    if (excerpt !== undefined) { fields.push('excerpt = ?'); params.push(excerpt); }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.run(`UPDATE pages SET ${fields.join(', ')} WHERE id = ?`, params);

    if (status === 'published') {
      db.run(`UPDATE pages SET published_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    }

    saveDatabase();
    return this.findById(id);
  }

  static async delete(id) {
    const db = await getDatabase();
    db.run('DELETE FROM pages WHERE id = ?', [id]);
    saveDatabase();
  }

  static async count({ status } = {}) {
    const db = await getDatabase();
    let stmt;
    if (status) {
      stmt = db.prepare('SELECT COUNT(*) as count FROM pages WHERE status = ?');
      stmt.bind([status]);
    } else {
      stmt = db.prepare('SELECT COUNT(*) as count FROM pages');
    }

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.count;
    }
    stmt.free();
    return 0;
  }
}

module.exports = Page;
