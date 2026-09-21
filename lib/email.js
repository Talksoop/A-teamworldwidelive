import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD not set.");
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Never throws — a notification failing to send should never break the
// request that triggered it (a submission, a payment, etc.).
export async function sendEmail({ to, subject, text }) {
  if (!to) return;
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"A-Team Worldwide Live" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}
