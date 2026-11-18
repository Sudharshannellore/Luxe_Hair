import api from "./api";

/*
 * Demo online payments. payOnline(payment) opens the <DemoCheckout /> sheet (mounted
 * once in App.jsx) for a `payment` returned by POST /booking/create or /order/place.
 * Resolves with the server's confirmation; rejects with { cancelled: true } when the
 * customer closes it. No real gateway is involved and card details never leave the browser.
 */
let open = null;

export const registerDemoCheckout = (fn) => {
  open = fn;
  return () => {
    if (open === fn) open = null;
  };
};

export const payOnline = (payment) =>
  new Promise((resolve, reject) => {
    if (!open) return reject(new Error("Checkout is not available right now."));
    open({ payment, resolve, reject });
  });

export const confirmDemoPayment = (payment, instrument) =>
  api.post("/payment/demo/confirm", { type: payment.type, id: payment.id, reference: payment.reference, instrument }).then((r) => r.data);

export const cancelDemoPayment = (payment) =>
  api.post("/payment/demo/cancel", { type: payment.type, id: payment.id }).catch(() => {});
