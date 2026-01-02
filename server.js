console.log("RUNNING FILE:", __filename);

const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const XLSX = require("xlsx");
const exportToExcel = require("./utils/exportToExcel");
const sendEmail = require("./utils/sendEmail");
const schedule = require("node-schedule");
const fs = require("fs");

// ---------------- Database ----------------
const db = new sqlite3.Database("sensor_data.db", err => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database.");
});

// ---------------- Express ----------------
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);

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
                [i, temp, hum, light, now],
            );
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
            console.log("~ Data sent & stored:", data);
        }

        // update Excel
        exportToExcel().catch(err =>
            console.error(" ! Excel update error:", err.message)
        );
    } 
    sendSensorData(); // send immediately
    const interval = setInterval(sendSensorData, 300000); //every 5 min

    ws.on("close", () => {
        clearInterval(interval);
        console.log("Client disconnected");
    });
});


// ---------------- MIDNIGHT EMAIL ----------------
schedule.scheduleJob("0 0 * * *", async () => {
    console.log("~ Midnight export & email started...");
    try {
        const filePath = await exportToExcel();

        // Check if file exists and has data
        if (!filePath) {
            console.log("! No Excel file generated! — email skipped");
            return;
        }

        // check if the file has more than just headers
        const workbook = XLSX.readFile(filePath);
        let hasData = false;
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);
            if (rows.length > 0) hasData = true;
        });

        if (!hasData) {
            console.log("! Excel file is empty ! — email skipped");
            return;
        }

        await sendEmail(filePath);
        console.log("Midnight email sent successfully!");

    } catch (err) {
        console.error("!Midnight task error :", err.message);
    }
});


// ---------------- Optional: Immediate test ----------------
// Uncomment to test email 1 minute after server starts
/*
schedule.scheduleJob(new Date(Date.now() + 60000), async () => {
    console.log(" Test email started...");
    try {
        const filePath = await exportToExcel();
        if (!filePath) {
            console.log(" No data to export yet — email skipped");
            return;
        }
        await sendEmail(filePath);
        console.log("Test email sent successfully");
    } catch (err) {
        console.error("Test email error:", err.message);
    }
});
*/

// At the bottom of your server.js (temporarily)
// (async () => {
//     try {
//         console.log("Test: exporting yesterday's Excel and sending email...");
//         const filePath = await exportToExcel();
//         if (!filePath) {
//             console.log(" No data to export — email skipped");
//             return;
//         }
//         await sendEmail(filePath);
//         console.log("Test email sent successfully!");
//     } catch (err) {
//         console.error("Test email failed:", err.message);
//     }
// })();

