const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath;

if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
    if (!fs.existsSync(volumePath)) {
        fs.mkdirSync(volumePath, { recursive: true });
    }
    dbPath = path.join(volumePath, 'app.sqlite');
    console.log(`Using Railway volume at: ${dbPath}`);
} else {
    dbPath = path.join(__dirname, 'app.sqlite');
    console.log(`Using local database at: ${dbPath}`);
}

const db = new Database(dbPath);

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

if (!todoColumnNames.includes('time_actual_duration')) {
    db.exec(`ALTER TABLE todos ADD COLUMN time_actual_duration INTEGER`);
    console.log('Added missing column: time_actual_duration');
}

if (!todoColumnNames.includes('time_completed_at')) {
    db.exec(`ALTER TABLE todos ADD COLUMN time_completed_at DATETIME`);
    console.log('Added missing column: time_completed_at');
}

if (!todoColumnNames.includes('notes')) {
    db.exec(`ALTER TABLE todos ADD COLUMN notes TEXT`);
    console.log('Added missing column: notes');
}

if (!todoColumnNames.includes('mode')) {
    db.exec(`ALTER TABLE todos ADD COLUMN mode TEXT DEFAULT 'timer'`);
    console.log('Added missing column: mode');
}

console.log('Database ready');
module.exports = db;