const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'app.sqlite'));

// users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// todos table
db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        duration INTEGER,
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
`);

// migration for any older databases (if doesn't have duration and due date edit is not possible)
const todoColumns = db.prepare("PRAGMA table_info(todos)").all();
const todoColumnNames = todoColumns.map(col => col.name);

if (!todoColumnNames.includes('duration')) {
    db.exec(`ALTER TABLE todos ADD COLUMN duration INTEGER`);
    console.log('Added missing column: duration');
}

if (!todoColumnNames.includes('due_date')) {
    db.exec(`ALTER TABLE todos ADD COLUMN due_date DATETIME`);
    console.log('Added missing column: due_date');
}

console.log('Database ready\n');
module.exports = db;