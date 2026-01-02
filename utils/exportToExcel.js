const sqlite3 = require("sqlite3").verbose();
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Map database keys to friendly Excel headers
const headerMap = {
    room_id: "Room Number",
    temperature: "Temperature (°C)",
    humidity: "Humidity (%)",
    light: "Light (lx)",
    timestamp: "Timestamp"
};

//convert JSON rows to sheet with new headers
function jsonToSheetWithHeaders(rows, headerMap) {
    if (rows.length === 0) return XLSX.utils.json_to_sheet([]);

    const newRows = rows.map(row => {
        const newRow = {};
        for (const key in headerMap) {
            newRow[headerMap[key]] = row[key]; // map old key value to new header
        }
        return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(newRows);

    // set column widths
    ws['!cols'] = [
        { wch: 12 }, // Room Num
        { wch: 15 }, // Temperature
        { wch: 12 }, // Humidity
        { wch: 12 }, // Light 
        { wch: 20 }  // Timestamp
    ];

    return ws;
}

async function exportToExcel() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database("sensor_data.db");
        const today = new
        Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const exportDir = path.join(__dirname, "exports");

        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

        const filePath = path.join(exportDir, `sensor_data_${today}.xlsx`);

        // Fetch today data
        const query = `
        SELECT room_id, temperature, humidity, light, timestamp
        FROM sensor_data
        WHERE DATE(timestamp) = ?
        ORDER BY timestamp ASC
        `;


        db.all(query, [today], (err, rows) => {
            if (err) {
                db.close();
                return reject(err);
            }

            const workbook = fs.existsSync(filePath)
                ? XLSX.readFile(filePath)
                : XLSX.utils.book_new();           

            // One sheet per room
            for (let room = 1; room <= 6; room++) {
                const roomRows = rows.filter(r => r.room_id === room);
                const worksheet = jsonToSheetWithHeaders(roomRows, headerMap);

                if (workbook.SheetNames.includes(`Room ${room}`)) {
                    // Overwrite existing sheet
                    workbook.Sheets[`Room ${room}`] = worksheet;
                } else {
                    XLSX.utils.book_append_sheet(workbook, worksheet, `Room ${room}`);
                }
            }

            // If no data at all,create one empty sheet
            if (rows.length === 0 && workbook.SheetNames.length === 0) {
                const ws = XLSX.utils.json_to_sheet([]);
                XLSX.utils.book_append_sheet(workbook, ws, "No Data");
            }

            XLSX.writeFile(workbook, filePath);
            db.close();

            console.log("Excel exported/updated:", filePath);
            resolve(filePath);
        });
    });
}

module.exports = exportToExcel;
