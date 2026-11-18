const config = require("../config");

// All customer emails share one layout. Every interpolated value is escaped.
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "";

const paymentLabel = (m) => (m === "online" ? "Paid online" : "Pay at salon");

const layout = ({ title, preheader = "", name, intro, rows = [], outro = "", cta }) => {
  const rowsHtml = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([label, value, strong]) => `
        <tr>
          <td style="padding:10px 0;color:#78716c;font-size:14px;border-bottom:1px solid #efe8dd;">${esc(label)}</td>
          <td style="padding:10px 0;text-align:right;font-size:14px;border-bottom:1px solid #efe8dd;color:#1c1917;${
            strong ? "font-weight:700;font-size:16px;" : ""
          }">${esc(value)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917;">
  <span style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #efe8dd;">
        <tr><td style="background:#1c1917;padding:28px 32px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:4px;color:#d9bf8c;">${esc(
            config.brandName.toUpperCase()
          )}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;">${esc(title)}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#44403c;">Hi ${esc(name || "there")},<br/>${intro}</p>
          ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">${rowsHtml}</table>` : ""}
          ${outro ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#44403c;">${outro}</p>` : ""}
          ${
            cta
              ? `<a href="${esc(cta.href)}" style="display:inline-block;background:#b08d57;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:14px;">${esc(cta.label)}</a>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #efe8dd;font-size:12px;color:#a8a29e;text-align:center;">
          © ${new Date().getFullYear()} ${esc(config.brandName)} · You're receiving this because you have an account with us.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const priceRows = ({ price, couponCode, discount, finalPrice }) => [
  ["Price", money(price)],
  couponCode ? ["Coupon", couponCode] : ["", ""],
  discount ? ["Discount", `− ${money(discount)}`] : ["", ""],
  ["Total", money(finalPrice ?? price), true],
];

const profileCta = () => ({ href: `${config.publicSiteUrl}/profile`, label: "View my bookings" });

module.exports = {
  bookingConfirmed: ({ name, booking, service }) => ({
    subject: `Booking confirmed · ${service.title}`,
    html: layout({
      title: "Your booking is confirmed",
      preheader: `${service.title} on ${formatDate(booking.date)} at ${booking.timeSlot}`,
      name,
      intro: "Thank you for choosing us. Here are your appointment details.",
      rows: [
        ["Service", service.title],
        ["Date", formatDate(booking.date)],
        ["Time", booking.timeSlot],
        ["Payment", paymentLabel(booking.paymentMethod)],
        ...priceRows(booking),
      ],
      outro: "Please arrive 10 minutes early. Need to change plans? You can cancel from your profile.",
      cta: profileCta(),
    }),
  }),

  bookingStatus: ({ name, booking, service }) => ({
    subject: `Your booking is ${booking.status}`,
    html: layout({
      title: `Booking ${booking.status}`,
      name,
      intro: `Your booking for <strong>${esc(service.title)}</strong> is now <strong>${esc(booking.status)}</strong>.`,
      rows: [
        ["Date", formatDate(booking.date)],
        ["Time", booking.timeSlot],
      ],
      cta: profileCta(),
    }),
  }),

  orderConfirmed: ({ name, order, pkg }) => ({
    subject: `Combo purchased · ${pkg.title}`,
    html: layout({
      title: "Your combo is ready to use",
      name,
      intro: "Thanks for your purchase. Book each included service whenever it suits you.",
      rows: [
        ["Combo", pkg.title],
        ["Includes", (pkg.services || []).join(", ")],
        ["Valid until", formatDate(order.expiryDate)],
        ["Payment", paymentLabel(order.paymentMethod)],
        ...priceRows({ ...order.toObject?.() ?? order, price: order.price ?? pkg.price }),
      ],
      cta: profileCta(),
    }),
  }),

  paymentReceived: ({ name, itemTitle, record }) => ({
    subject: "Payment received",
    html: layout({
      title: "Payment received",
      name,
      intro: "We've received your payment. Here's your receipt.",
      rows: [["Item", itemTitle], ...priceRows(record), ["Status", "Paid"]],
      outro: "We appreciate your business!",
      cta: profileCta(),
    }),
  }),

  serviceUsed: ({ name, serviceName, pkg, remaining }) => ({
    subject: `Service redeemed · ${serviceName}`,
    html: layout({
      title: "Service redeemed",
      name,
      intro: `You've used <strong>${esc(serviceName)}</strong> from your <strong>${esc(pkg.title)}</strong> combo.`,
      rows: [["Services remaining", String(remaining)]],
      cta: profileCta(),
    }),
  }),

  packageExpiring: ({ name, pkg, order }) => ({
    subject: `Your ${pkg.title} combo expires soon`,
    html: layout({
      title: "Your combo expires soon",
      name,
      intro: `Your <strong>${esc(pkg.title)}</strong> combo expires on <strong>${esc(formatDate(order.expiryDate))}</strong>. Book your remaining services before then.`,
      cta: profileCta(),
    }),
  }),

  packageExpired: ({ name, pkg }) => ({
    subject: `Your ${pkg.title} combo has expired`,
    html: layout({
      title: "Your combo has expired",
      name,
      intro: `Your <strong>${esc(pkg.title)}</strong> combo has expired. We'd love to see you again — check out our latest combos and offers.`,
      cta: { href: `${config.publicSiteUrl}/combos`, label: "Browse combos" },
    }),
  }),
};
