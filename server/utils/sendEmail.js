const nodemailer = require("nodemailer");
const dotenv = require('dotenv')

dotenv.config()

console.log(process.env.EMAIL_USER)
console.log(process.env.EMAIL_PASS)

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email helper (TEXT only)
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Beauty Clinic" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: "Please view this email in an HTML-compatible client."   
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Email Transport Error:", err);
  }
};

module.exports = sendEmail;
