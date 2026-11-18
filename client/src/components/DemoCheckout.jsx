import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, CreditCard, Info, Lock, ShieldCheck, Smartphone, Wifi, X } from "lucide-react";
import { Button, cx } from "./ui";
import { formatCurrency } from "../lib/format";
import { getErrorMessage } from "../lib/api";
import { cancelDemoPayment, confirmDemoPayment, registerDemoCheckout } from "../lib/demoPayment";

/*
 * Demo payment sheet for showcasing the online-payment flow. Card details stay in the
 * browser; only a label like "Visa •••• 4242" is sent to the server when confirming.
 */

const TEST_CARD = { number: "4242 4242 4242 4242", expiry: "12/30", cvv: "123" };
const UPI_APPS = [
  { name: "GPay", handle: "okaxis" },
  { name: "PhonePe", handle: "ybl" },
  { name: "Paytm", handle: "paytm" },
];
const PROCESS_STEPS = ["Contacting your bank", "Authorising payment", "Confirming your booking"];

const detectBrand = (digits) => {
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^(60|65|81|82|508)/.test(digits)) return "RuPay";
  return "";
};

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value) => {
  const d = value.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const validExpiry = (exp) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp);
  if (!m) return false;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return false;
  const end = new Date(2000 + Number(m[2]), month, 1); // first day after expiry month
  return end > new Date();
};

/* ------------------------------------------------------------------ Card visual */

function CardVisual({ number, name, expiry, cvv, flipped, brand }) {
  const digits = number.replace(/\s/g, "");
  const shown = (digits + "•".repeat(16 - digits.length)).replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="mx-auto w-full max-w-[340px] [perspective:1200px]">
      <div
        className={cx(
          "relative aspect-[1.586] w-full transition-transform duration-700 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-[#2a2420] to-gold-dark p-5 text-cream shadow-lift [backface-visibility:hidden]">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-gold/25 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="h-8 w-11 rounded-md bg-gradient-to-br from-[#e9dcc4] to-[#b08d57] shadow-inner" aria-hidden>
                <div className="mx-auto mt-[11px] h-[10px] w-7 rounded-sm border border-ink/20" />
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 rotate-90 text-cream/70" aria-hidden />
                <span className="min-w-[3rem] text-right font-display text-lg font-semibold italic tracking-wide transition-all">
                  {brand || <span className="text-cream/40">CARD</span>}
                </span>
              </div>
            </div>
            <p className="font-mono text-[1.15rem] tracking-[0.14em] sm:text-xl" aria-label="Card number preview">
              {shown}
            </p>
            <div className="flex items-end justify-between text-xs">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-cream/50">Card holder</p>
                <p className="truncate font-medium uppercase tracking-wider">{name || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-cream/50">Expires</p>
                <p className="font-mono font-medium">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2420] to-ink text-cream shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="mt-6 h-10 w-full bg-black/80" aria-hidden />
          <div className="mx-5 mt-5 flex items-center gap-3">
            <div className="h-9 flex-1 rounded bg-[repeating-linear-gradient(45deg,#f2ece2,#f2ece2_6px,#e7e0d5_6px,#e7e0d5_12px)]" aria-hidden />
            <div className="flex h-9 w-14 items-center justify-center rounded bg-white font-mono text-sm font-semibold text-ink">
              {cvv ? "•".repeat(cvv.length) : "CVV"}
            </div>
          </div>
          <p className="mx-5 mt-4 text-[10px] leading-relaxed text-cream/40">
            Demo card · Luxe Hair never stores or transmits card numbers.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Processing & success */

function Processing({ step }) {
  return (
    <div className="flex flex-col items-center py-8 text-center animate-fade-in" role="status" aria-live="polite">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ring rounded-full bg-gold/30" aria-hidden />
        <span className="absolute inset-0 animate-ring rounded-full bg-gold/20 [animation-delay:0.5s]" aria-hidden />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ink text-gold-light shadow-lift">
          <Lock className="h-8 w-8" />
        </span>
      </div>
      <h3 className="mt-8 font-display text-2xl">Processing payment</h3>
      <p className="mt-1 text-sm text-muted">Please don't close this window.</p>
      <ol className="mt-8 w-full max-w-xs space-y-3 text-left">
        {PROCESS_STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  state === "done" && "border-success bg-success text-white",
                  state === "active" && "border-gold",
                  state === "todo" && "border-line"
                )}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5 animate-pop" />
                ) : state === "active" ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                ) : null}
              </span>
              <span className={cx("transition-colors", state === "todo" ? "text-muted/60" : "text-ink")}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Success({ amount, transactionId, instrument, onDone }) {
  return (
    <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ring rounded-full bg-success/25" aria-hidden />
        <svg viewBox="0 0 52 52" className="relative h-24 w-24 animate-pop" aria-hidden>
          <circle cx="26" cy="26" r="24" fill="var(--color-success)" />
          <path
            d="M15 27l7 7 15-16"
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset="40"
            className="animate-draw"
          />
        </svg>
      </div>
      <h3 className="mt-6 font-display text-3xl animate-fade-up">Payment successful</h3>
      <p className="mt-1 text-sm text-muted animate-fade-up [animation-delay:80ms]">{formatCurrency(amount)} paid</p>

      <dl className="mt-6 w-full space-y-2 rounded-2xl border border-line bg-cream/70 p-4 text-left text-sm animate-fade-up [animation-delay:160ms]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Transaction ID</dt>
          <dd className="font-mono text-xs text-ink">{transactionId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Paid with</dt>
          <dd className="text-ink">{instrument}</dd>
        </div>
      </dl>

      <Button className="mt-6 w-full" size="lg" onClick={onDone} autoFocus>
        Continue
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ Main sheet */

export default function DemoCheckout() {
  const [request, setRequest] = useState(null); // { payment, resolve, reject }
  const [tab, setTab] = useState("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form"); // form | processing | success | error
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const panelRef = useRef(null);
  const timers = useRef([]);

  useEffect(
    () =>
      registerDemoCheckout((req) => {
        setRequest(req);
        setTab("card");
        setCard({ number: "", name: (req.payment.prefill?.name || "").toUpperCase(), expiry: "", cvv: "" });
        setUpi("");
        setErrors({});
        setStage("form");
        setStep(0);
        setResult(null);
        setFlipped(false);
      }),
    []
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Scroll lock + initial focus while open.
  useEffect(() => {
    if (!request) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panelRef.current?.querySelector("input")?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflow;
    };
  }, [request]);

  const payment = request?.payment;
  const digits = card.number.replace(/\s/g, "");
  const brand = detectBrand(digits);

  const close = useCallback(() => {
    if (!request || stage === "processing") return;
    if (stage === "success") {
      request.resolve(result);
    } else {
      cancelDemoPayment(request.payment);
      request.reject({ cancelled: true });
    }
    setRequest(null);
  }, [request, stage, result]);

  const validate = () => {
    const e = {};
    if (tab === "card") {
      if (digits.length < 15) e.number = "Enter a 15–16 digit card number";
      if (card.name.trim().length < 2) e.name = "Enter the name on the card";
      if (!validExpiry(card.expiry)) e.expiry = "Enter a valid future date";
      if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = "3–4 digits";
    } else if (!/^[\w.-]{2,}@[a-z]{2,}$/i.test(upi.trim())) {
      e.upi = "Enter a UPI ID like name@okaxis";
    }
    setErrors(e);
    if (Object.keys(e).length) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
    return !Object.keys(e).length;
  };

  const pay = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const instrument = tab === "card" ? `${brand || "Card"} •••• ${digits.slice(-4)}` : `UPI ${upi.trim().toLowerCase()}`;
    setStage("processing");
    setStep(0);
    setFlipped(false);

    const wait = (ms) => new Promise((r) => timers.current.push(setTimeout(r, ms)));
    try {
      await wait(900);
      setStep(1);
      const [data] = await Promise.all([confirmDemoPayment(request.payment, instrument), wait(1000)]);
      setStep(2);
      await wait(700);
      setStep(3);
      await wait(250);
      setResult({ ...data, instrument });
      setStage("success");
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "The payment couldn't be completed."));
      setStage("error");
    }
  };

  if (!request) return null;

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 animate-fade-in bg-ink/60 backdrop-blur-sm" onClick={stage === "form" ? close : undefined} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Online payment"
        className="relative flex max-h-[94vh] w-full max-w-md animate-scale-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative bg-ink px-6 pb-5 pt-5 text-cream">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cream/70">
              <ShieldCheck className="h-4 w-4 text-gold-light" /> Secure checkout
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-light ring-1 ring-gold/40">
                Demo mode
              </span>
              {stage !== "processing" && (
                <button onClick={close} className="rounded-full p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-cream" aria-label="Close checkout">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-cream/50">{payment.description}</p>
          <p className="mt-1 font-display text-4xl font-semibold !text-cream">{formatCurrency(payment.amount)}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {stage === "processing" && <Processing step={step} />}

          {stage === "success" && (
            <Success amount={payment.amount} transactionId={result?.transactionId} instrument={result?.instrument} onDone={close} />
          )}

          {stage === "error" && (
            <div className="py-8 text-center animate-fade-in" role="alert">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-danger animate-pop">
                <X className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-display text-2xl">Payment failed</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{errorMsg}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={close}>Close</Button>
                <Button onClick={() => setStage("form")}>Try again</Button>
              </div>
            </div>
          )}

          {stage === "form" && (
            <form onSubmit={pay} noValidate className={cx("space-y-5", shake && "animate-shake")}>
              {/* Method tabs */}
              <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-sand p-1">
                {[
                  { value: "card", label: "Card", icon: CreditCard },
                  { value: "upi", label: "UPI", icon: Smartphone },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.value}
                    onClick={() => {
                      setTab(t.value);
                      setErrors({});
                    }}
                    className={cx(
                      "flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition",
                      tab === t.value ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink"
                    )}
                  >
                    <t.icon className="h-4 w-4" /> {t.label}
                  </button>
                ))}
              </div>

              {tab === "card" ? (
                <div className="space-y-5 animate-fade-in">
                  <CardVisual number={card.number} name={card.name} expiry={card.expiry} cvv={card.cvv} flipped={flipped} brand={brand} />

                  <div className="space-y-3">
                    <DemoField label="Card number" error={errors.number}>
                      <input
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                        className={inputClass(errors.number, "font-mono tracking-wider")}
                      />
                    </DemoField>
                    <DemoField label="Name on card" error={errors.name}>
                      <input
                        autoComplete="off"
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase().slice(0, 26) })}
                        className={inputClass(errors.name, "uppercase")}
                      />
                    </DemoField>
                    <div className="grid grid-cols-2 gap-3">
                      <DemoField label="Expiry" error={errors.expiry}>
                        <input
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                          className={inputClass(errors.expiry, "font-mono")}
                        />
                      </DemoField>
                      <DemoField label="CVV" error={errors.cvv}>
                        <input
                          inputMode="numeric"
                          type="password"
                          autoComplete="off"
                          placeholder="•••"
                          value={card.cvv}
                          onFocus={() => setFlipped(true)}
                          onBlur={() => setFlipped(false)}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                          className={inputClass(errors.cvv, "font-mono")}
                        />
                      </DemoField>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCard((c) => ({ ...c, ...TEST_CARD, name: c.name || "LUXE GUEST" }));
                      setErrors({});
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gold/50 bg-gold-light/20 py-2 text-xs font-medium text-gold-dark transition hover:bg-gold-light/40"
                  >
                    <Info className="h-3.5 w-3.5" /> Fill demo card 4242 4242 4242 4242
                  </button>
                </div>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex flex-col items-center rounded-2xl border border-line bg-cream/60 p-5">
                    <FakeQr seed={payment.reference} />
                    <p className="mt-3 text-xs text-muted">Scan with any UPI app — or enter your UPI ID below</p>
                  </div>
                  <DemoField label="UPI ID" error={errors.upi}>
                    <input
                      autoComplete="off"
                      placeholder="yourname@okaxis"
                      value={upi}
                      onChange={(e) => setUpi(e.target.value)}
                      className={inputClass(errors.upi)}
                    />
                  </DemoField>
                  <div className="flex flex-wrap gap-2">
                    {UPI_APPS.map((app) => (
                      <button
                        key={app.name}
                        type="button"
                        onClick={() => {
                          const user = (upi.split("@")[0] || payment.prefill?.name || "guest").toLowerCase().replace(/[^a-z0-9.]/g, "");
                          setUpi(`${user || "guest"}@${app.handle}`);
                          setErrors({});
                        }}
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-gold hover:text-ink"
                      >
                        {app.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full">
                <Lock className="h-4 w-4" /> Pay {formatCurrency(payment.amount)}
              </Button>
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Demo checkout for showcase purposes — no real payment is made and card details never leave your browser.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ small helpers */

const inputClass = (error, extra = "") =>
  cx(
    "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-muted/60 transition focus:outline-none focus:ring-4",
    error ? "border-danger focus:ring-danger/15" : "border-line focus:border-gold focus:ring-gold/15",
    extra
  );

function DemoField({ label, error, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-ink">{label}</span>
      {children}
      {error && <span className="block text-[11px] text-danger">{error}</span>}
    </label>
  );
}

/** Decorative QR-style pattern generated from the payment reference. */
function FakeQr({ seed = "" }) {
  const size = 21;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => ((h = Math.imul(h ^ (h >>> 13), 0x5bd1e995)), ((h >>> 0) % 100) / 100);
  const finder = (x, y) =>
    [
      [0, 0],
      [size - 7, 0],
      [0, size - 7],
    ].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const finderOn = (x, y) => {
    const fx = x < 7 ? 0 : size - 7;
    const fy = y < 7 ? 0 : size - 7;
    const dx = x - fx;
    const dy = y - fy;
    const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
    return ring !== 2;
  };
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = finder(x, y) ? finderOn(x, y) : rand() > 0.52;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="h-36 w-36 rounded-lg bg-white p-1 shadow-soft" aria-label="Demo UPI QR code">
      <g fill="#1c1917">{cells}</g>
    </svg>
  );
}
