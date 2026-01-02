const sqlite3 = require('sqlite3').verbose();

//Create or open database file
const db = new sqlite3.Database('./dashboard.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create table if it dont exist
db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    temperature REAL,
    humidity REAL,
    light INTEGER,
    timestamp TEXT
    )
`);

module.exports = db;
