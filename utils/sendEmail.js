require("dotenv").config();

const nodemailer = require("nodemailer");
const path = require("path");

async function sendEmail(filePath) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,          // use 587 instead of 465
        secure: false,      // MUST be false for 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: "Daily Sensor Data Report",
        text: "Attached is the daily sensor data Excel report.",
        attachments: [
            {
                filename: path.basename(filePath),
                path: filePath
            }
        ]
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully");
}

module.exports = sendEmail;
