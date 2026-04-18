const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let dbInstance = null;
let dbPath = null;

async function getDatabase() {
  const currentPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'bcs.db');

  // Reset if path changed
  if (dbPath !== currentPath) {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    dbPath = currentPath;
  }

  if (!dbInstance) {
    const SQL = await initSqlJs();

    // Load existing database or create new
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      dbInstance = new SQL.Database(fileBuffer);
    } else {
      dbInstance = new SQL.Database();
    }
  }
  return dbInstance;
}

function saveDatabase() {
  if (dbInstance && dbPath) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

async function closeDatabase() {
  if (dbInstance) {
    saveDatabase();
    dbInstance.close();
    dbInstance = null;
    dbPath = null;
  }
}

async function resetDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  if (dbPath && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  dbPath = null;
}

module.exports = { getDatabase, closeDatabase, saveDatabase, resetDatabase };
