#!/usr/bin/env node
/**
 * Database migration script
 * Runs all SQL migrations from the migrations/ directory
 */

const fs = require('fs');
const path = require('path');
const { getDatabase, saveDatabase } = require('../src/db/database');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  console.log('Running database migrations...');

  const db = await getDatabase();

  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get list of executed migrations
  const stmt = db.prepare('SELECT name FROM _migrations ORDER BY id');
  const executed = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    executed.push(row.name);
  }
  stmt.free();

  // Get all migration files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (executed.includes(file)) {
      console.log(`  [skip] ${file}`);
      continue;
    }

    console.log(`  [run] ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    db.exec(sql);

    db.run('INSERT INTO _migrations (name) VALUES (?)', [file]);
    ran++;
  }

  saveDatabase();
  console.log(`Migrations complete. ${ran} new migrations executed.`);
}

if (require.main === module) {
  runMigrations().then(() => {
    const { closeDatabase } = require('../src/db/database');
    closeDatabase();
    process.exit(0);
  });
}

module.exports = { runMigrations };
