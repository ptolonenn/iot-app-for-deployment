const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine where to store the database
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

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Database connected successfully');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
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
    `, (err) => {
        if (err) {
            console.error('Error creating todos table:', err);
        } else {
            console.log('Tables ready');
            
            // Check and add missing columns
            db.all("PRAGMA table_info(todos)", (err, columns) => {
                if (err) {
                    console.error('Error checking columns:', err);
                    return;
                }
                
                const columnNames = columns.map(col => col.name);
                
                if (!columnNames.includes('duration')) {
                    db.run(`ALTER TABLE todos ADD COLUMN duration INTEGER`);
                    console.log('Added missing column: duration');
                }
                
                if (!columnNames.includes('due_date')) {
                    db.run(`ALTER TABLE todos ADD COLUMN due_date DATETIME`);
                    console.log('Added missing column: due_date');
                }
            });
        }
    });
});

module.exports = db;
