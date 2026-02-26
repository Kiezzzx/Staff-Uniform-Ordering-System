const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../data.sqlite');
const schemaPath = path.resolve(__dirname, './schema.sql');
const mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

console.log('[sqlite] target file:', dbPath);

const db = new sqlite3.Database(dbPath, mode, (err) => {
  if (err) {
    console.error('[sqlite] connection failed:', err.message);
    return;
  }

  db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
    if (pragmaErr) {
      console.error('[sqlite] failed to enable foreign keys:', pragmaErr.message);
      return;
    }

    console.log('[sqlite] connected with foreign keys enabled');
  });
});

const initDatabase = () => {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  return new Promise((resolve, reject) => {
    db.exec(schemaSql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('[sqlite] schema initialized');
      resolve();
    });
  });
};

module.exports = {
  db,
  initDatabase,
};
