import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BadgePercent, CreditCard, Store, Tag, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { Button, cx, Input } from "./ui";
import { AmbientBlobs, Grain, Parallax, Reveal, SplitText } from "./fx";

/* Shared building blocks for the service booking and combo purchase flows. */

/** Loads enabled payment methods + currently usable coupons once. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCheckoutOptions() {
  const [methods, setMethods] = useState({ cod: false, online: false });
  const [coupons, setCoupons] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api.get("/payment/get/payment-method"), api.get("/coupon/active")]).then(([pay, cps]) => {
      if (!alive) return;
      if (pay.status === "fulfilled") setMethods(pay.value.data?.payment || { cod: true, online: false });
      else setMethods({ cod: true, online: false });
      if (cps.status === "fulfilled") setCoupons(cps.value.data || []);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const defaultMethod = methods.cod ? "cod" : methods.online ? "online" : "";
  return { methods, coupons, loaded, defaultMethod };
}

/** Radio cards for "Pay at salon" / "Pay online". */
export function PaymentMethodPicker({ methods, value, onChange, codLabel = "Pay at salon" }) {
  const options = [
    methods.cod && { value: "cod", icon: Store, title: codLabel, text: "Pay by cash, card or UPI at your visit" },
    methods.online && { value: "online", icon: CreditCard, title: "Pay online", text: "Card or UPI · secure demo checkout" },
  ].filter(Boolean);

  if (!options.length) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Booking is temporarily unavailable. Please contact the studio.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <label
            key={o.value}
            className={cx(
              "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 transition",
              active ? "border-gold ring-4 ring-gold/15" : "border-line hover:border-ink/30"
            )}
          >
            <input type="radio" name="payment" value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
            <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", active ? "bg-gold text-white" : "bg-sand text-gold-dark")}>
              <o.icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{o.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{o.text}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * Coupon entry: code input + Apply, suggestions, applied pill.
 * `target` is { serviceId } or { packageId }. `applied` is the /coupon/apply response or null.
 */
export function CouponPicker({ coupons, target, applied, onApplied }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apply = async (value) => {
    const c = (value ?? code).trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/coupon/apply", { code: c, ...target });
      onApplied(data);
      setCode("");
      toast.success(`${data.code} applied — you save ${formatCurrency(data.discount)}`);
    } catch (err) {
      setError(getErrorMessage(err, "This coupon can't be applied."));
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <BadgePercent className="h-5 w-5 text-success" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">{applied.code}</p>
            <p className="text-xs text-success">You save {formatCurrency(applied.discount)}</p>
          </div>
        </div>
        <button onClick={() => onApplied(null)} className="rounded-full p-1.5 text-muted hover:bg-white hover:text-ink" aria-label="Remove coupon">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="flex gap-2"
      >
        <Input
          icon={Tag}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="uppercase"
        />
        <Button type="submit" variant="outline" loading={loading} disabled={!code.trim()} className="h-12 shrink-0">
          Apply
        </Button>
      </form>
      {error && <p className="text-xs text-danger">{error}</p>}
      {coupons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Available offers</p>
          <div className="flex flex-wrap gap-2">
            {coupons.slice(0, 6).map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => apply(c.couponCode)}
                disabled={loading}
                className="group rounded-xl border border-dashed border-gold/60 bg-gold-light/25 px-3 py-2 text-left transition hover:border-gold hover:bg-gold-light/50"
              >
                <span className="block text-xs font-bold tracking-wider text-gold-dark">{c.couponCode}</span>
                <span className="block text-[11px] text-muted">
                  {c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `${formatCurrency(c.discountValue)} off`}
                  {c.minOrderValue ? ` · min ${formatCurrency(c.minOrderValue)}` : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Celebration */

const BURST_COLORS = ["#b08d57", "#d9bf8c", "#8a6d3f", "#e9dcc4", "#f1e2c2"];

/** Confetti-like burst of gold dots radiating from the centre. Place inside a `relative` box. */
export function Burst({ count = 18, distance = 96 }) {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.15 : 0);
        const d = distance * (0.7 + ((i * 37) % 10) / 22);
        const size = 5 + (i % 4) * 2;
        return (
          <motion.span
            key={i}
            className={cx("absolute block", i % 3 === 0 ? "rounded-sm" : "rounded-full")}
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, background: BURST_COLORS[i % BURST_COLORS.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * d, y: Math.sin(angle) * d, scale: [0, 1.2, 0.8], opacity: [1, 1, 0], rotate: 180 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </div>
  );
}

/** Circle + check that draws itself in. */
export function AnimatedCheck({ size = 80 }) {
  return (
    <motion.svg
      viewBox="0 0 52 52"
      width={size}
      height={size}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      aria-hidden
      className="relative"
    >
      <circle cx="26" cy="26" r="25" fill="var(--color-success)" />
      <motion.path
        d="M15 27l7 7 15-16"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, delay: 0.25, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

/* ------------------------------------------------------------------ Cinematic page header */

/**
 * Dark hero used by Services, Combos and Offers. Wrap one word of `title` in *asterisks*
 * for the gold accent. `stats` = [{ value, label }].
 */
export function CinematicHeader({ eyebrow, title, description, image, stats = [], children }) {
  return (
    <header className="relative overflow-hidden bg-ink pb-20 pt-28 text-cream md:pb-24 md:pt-36">
      {image && (
        <div className="absolute inset-0" aria-hidden>
          <Parallax speed={0.18} className="absolute -inset-y-24 inset-x-0">
            <img src={image} alt="" className="h-full w-full object-cover opacity-25" />
          </Parallax>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
        </div>
      )}
      <AmbientBlobs />
      <Grain />

      <div className="container-page relative">
        {eyebrow && (
          <Reveal y={12}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-light backdrop-blur">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-gold" aria-hidden />
              {eyebrow}
            </span>
          </Reveal>
        )}
        <SplitText
          text={title}
          animateOnMount
          delay={0.1}
          className="mt-6 max-w-4xl font-display text-5xl font-medium leading-[1.02] !text-cream sm:text-5xl md:text-6xl"
        />
        {description && (
          <Reveal delay={0.35}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream/70 md:text-lg">{description}</p>
          </Reveal>
        )}
        {children && (
          <Reveal delay={0.45} className="mt-8">
            {children}
          </Reveal>
        )}
        {stats.length > 0 && (
          <Reveal delay={0.55}>
            <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-ink/70 px-5 py-4 backdrop-blur">
                  <dt className="text-[11px] uppercase tracking-widest text-cream/50">{s.label}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-gold-light">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>
    </header>
  );
}

/** Final confirmation state shown inside the drawer/modal: animated check + gold burst. */
export function SuccessPanel({ title, lines = [], note, primary, secondary }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-success/15"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.4, repeat: 2, ease: "easeOut" }}
        />
        <Burst />
        <AnimatedCheck />
      </div>
      <motion.h3
        className="mt-6 font-display text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        {title}
      </motion.h3>
      {lines.length > 0 && (
        <motion.dl
          className="mt-6 w-full space-y-2 rounded-2xl border border-line bg-white p-5 text-left text-sm shadow-soft"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {lines.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium text-ink">{v}</dd>
            </div>
          ))}
        </motion.dl>
      )}
      {note && <p className="mt-4 text-sm text-muted">{note}</p>}
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        {secondary}
        {primary}
      </div>
    </div>
  );
}

/** Step indicator with an animated gold progress bar. */
export function Steps({ steps, current }) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;
  return (
    <div className="mb-8">
      <div className="relative h-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
          initial={false}
          animate={{ width: `${Math.max(pct, 4)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <ol className="mt-3 flex justify-between">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2" aria-current={i === current ? "step" : undefined}>
            <motion.span
              animate={{ scale: i === current ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className={cx(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < current ? "bg-gold text-white" : i === current ? "bg-ink text-cream shadow-soft" : "bg-sand text-muted"
              )}
            >
              {i + 1}
            </motion.span>
            <span className={cx("text-xs font-medium", i === current ? "text-ink" : "hidden text-muted sm:inline")}>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
