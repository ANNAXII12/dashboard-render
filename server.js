console.log("RUNNING FILE:", __filename);

const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const XLSX = require("xlsx");
const exportToExcel = require("./utils/exportToExcel");
const schedule = require("node-schedule");

// ---------------- Database ----------------
const db = new sqlite3.Database("sensor_data.db", err => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database.");
});

// Create table if it doesn't exist
db.run(`
CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    temperature REAL,
    humidity REAL,
    light INTEGER,
    timestamp TEXT
)
`, err => {
    if (err) console.error("Table creation error:", err.message);
});

// ---------------- Express ----------------
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));

// ---------------- Health Check ----------------
app.get("/", (req, res) => {
    res.send("Dashboard server is running!");
});

// Start server immediately
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// ---------------- WebSocket ----------------
const wss = new WebSocket.Server({ server });
console.log("WebSocket server attached to HTTP server");

wss.on("connection", ws => {
    console.log("Client connected");

    function sendSensorData() {
        const data = {};
        const now = new Date().toLocaleString('sv-SE');

        for (let i = 1; i <= 6; i++) {
            const temp = (20 + Math.random() * 5).toFixed(1);
            const hum = (50 + Math.random() * 10).toFixed(1);
            const light = Math.floor(200 + Math.random() * 50);

            data[`r${i}_temp`] = `${temp} °C`;
            data[`r${i}_hum`] = `${hum} %`;
            data[`r${i}_light`] = `${light} lx`;

            db.run(
                `INSERT INTO sensor_data (room_id, temperature, humidity, light, timestamp)
                 VALUES (?, ?, ?, ?, ?)`,
                [i, temp, hum, light, now]
            );
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
            console.log("~ Data sent & stored:", data);
        }

        // Excel export runs in background, errors logged
        exportToExcel().catch(err => console.error("Excel export error:", err.message));
    }

    // Send immediately, then every 5 min
    sendSensorData();
    const interval = setInterval(sendSensorData, 300000);

    ws.on("close", () => {
        clearInterval(interval);
        console.log("Client disconnected");
    });
});

// ---------------- Schedule Midnight Excel export ----------------
schedule.scheduleJob("0 0 * * *", async () => {
    console.log("~ Midnight export started");
    try {
        await exportToExcel();
        console.log("Excel exported at midnight");
    } catch (err) {
        console.error("Midnight export error:", err.message);
    }
});
