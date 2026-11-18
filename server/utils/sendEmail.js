const nodemailer = require("nodemailer");
const config = require("../config");

const enabled = Boolean(config.email.user && config.email.pass);

const transporter = enabled
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.email.user, pass: config.email.pass },
    })
  : null;

const htmlToText = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>|<\/p>|<\/tr>|<\/h\d>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

/** Sends an email and resolves even on failure (errors are logged, never thrown). */
const sendEmail = async (to, subject, html) => {
  if (!enabled || !to) return false;
  try {
    await transporter.sendMail({
      from: `"${config.brandName}" <${config.email.user}>`,
      to,
      subject,
      html,
      text: htmlToText(html),
    });
    return true;
  } catch (err) {
    console.error(`Email to ${to} failed:`, err.message);
    return false;
  }
};

/** Fire-and-forget: sends after the HTTP response so slow SMTP never delays the API. */
const queueEmail = (to, subject, html) => {
  setImmediate(() => {
    sendEmail(to, subject, html);
  });
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.queueEmail = queueEmail;
