// src/utils/mailer.js
import nodemailer from "nodemailer";
import config from "../config/config.js";

//mailer.js now only reads config (single source truth)
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: Number(config.SMTP_PORT) ===465, //true only for SMTPS (465)...secure set based on port;Mailtrap commonly uses port 2525/587 with secure:false
  auth: {
    user: config.SMTP_USER || undefined,
    pass: config.SMTP_PASS || undefined,
  },
  //tls settings - prevents SSL handshake issues on some cPanel servers
  tls: { rejectUnauthorized: false }
});

// verify connection configuration at startup by using transporter.verify() that logs connectivity problems early
transporter.verify().then(() => {
  console.log("Mailer ready — connected to SMTP host:", config.SMTP_HOST);
}).catch((err) => {
  console.warn("Mailer connection failed (will attempt to send later):", err && err.message ? err.message : err);
});


export async function sendEmail({ to, subject, html, text }) {
    try {
        const info = await transporter.sendMail({
        //from: process.env.EMAIL_FROM || config.EMAIL_FROM,
        from: config.SMTP_FROM,
        to,
        subject,
        html,
        text,
    });
    // mailtrap: the message will appear in Mailtrap inbox; info contains accepted/rejected etc.
    console.log(`Email sent: ${info.messageId ?? "(no messageId)"} to ${to}`);
    return info;
    } catch (err) {
        console.error("Error sending email:", err && err.message ? err.message : err);
        // bubble up for callers to handle (they may log + retry)
        throw err;
    }
}
