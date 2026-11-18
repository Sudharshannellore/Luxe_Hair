import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Gift, Ticket } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import { Badge, Button, EmptyState, Skeleton, cx } from "../components/ui";
import { CinematicHeader } from "../components/checkout";
import { Reveal, Spotlight, Stagger, StaggerItem } from "../components/fx";

const HERO = "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600";

const ELIGIBILITY = {
  NEW_USERS: { label: "First booking only", tone: "info" },
  INACTIVE_USERS: { label: "Welcome back offer", tone: "gold" },
  ALL_USERS: { label: "For everyone", tone: "success" },
};

const discountBig = (c) => (c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatCurrency(c.discountValue));
const discountHeadline = (c) => `${discountBig(c)} off`;

const discountDetail = (c) => {
  const parts = [];
  if (c.discountType === "PERCENTAGE" && c.maxDiscount) parts.push(`up to ${formatCurrency(c.maxDiscount)}`);
  if (c.minOrderValue) parts.push(`on orders above ${formatCurrency(c.minOrderValue)}`);
  return parts.join(" ");
};

const daysLeft = (end) => Math.ceil((new Date(end) - new Date()) / 86400000);

// Rough "best value" score: the largest rupee saving the coupon can give.
const potential = (c) => (c.discountType === "PERCENTAGE" ? c.maxDiscount || c.discountValue * 50 : c.discountValue);

export default function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/coupon/active")
      .then(({ data }) => setCoupons(Array.isArray(data) ? data : []))
      .catch((err) => setError(getErrorMessage(err, "Couldn't load offers.")))
      .finally(() => setLoading(false));
  }, []);

  // Best-value coupon first, featured across the full width.
  const ordered = useMemo(() => {
    if (coupons.length < 2) return coupons;
    const best = coupons.reduce((a, b) => (potential(b) > potential(a) ? b : a));
    return [best, ...coupons.filter((c) => c !== best)];
  }, [coupons]);

  const stats = coupons.length
    ? [
        { value: coupons.length, label: "Live offers" },
        { value: `Up to ${formatCurrency(Math.max(...coupons.map(potential)))}`, label: "Max saving" },
        { value: coupons.some((c) => c.eligibility === "NEW_USERS") ? "Yes" : "—", label: "First-visit deal" },
        { value: "Instant", label: "Applied at checkout" },
      ]
    : [];

  return (
    <>
      <CinematicHeader
        eyebrow="Offers · Limited time"
        title="Little *luxuries,* for less"
        description="Apply any of these codes when you book a service or buy a combo. Discounts are checked and applied at checkout."
        image={HERO}
        stats={stats}
      />

      <section className="container-page py-16 md:py-24">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={cx("h-52 rounded-card", i === 0 && "md:col-span-2")} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={Gift}
            title="Offers are unavailable"
            description={error}
            action={<Button onClick={() => window.location.reload()}>Try again</Button>}
          />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No offers right now"
            description="New offers drop regularly — check back soon, or browse our combos for bundled savings."
            action={<Button to="/combos">Explore combos</Button>}
          />
        ) : (
          <Stagger gap={0.1} className="grid gap-6 md:grid-cols-2">
            {ordered.map((c, i) => {
              const featured = i === 0 && ordered.length > 1;
              // Keep the grid even: a lone last ticket spans both columns.
              const rest = ordered.length - (ordered.length > 1 ? 1 : 0);
              const lastAlone = rest % 2 === 1 && i === ordered.length - 1 && !featured;
              return (
                <StaggerItem key={c._id} className={featured || lastAlone ? "md:col-span-2" : ""}>
                  <CouponTicket coupon={c} featured={featured} />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}

        <Reveal className="mt-16">
          <div className="rounded-card border border-line/70 bg-white p-6 text-sm text-muted shadow-soft md:p-10">
            <h2 className="font-display text-3xl text-ink">How to use a code</h2>
            <Stagger as="ol" className="mt-6 grid gap-6 md:grid-cols-3">
              {["Copy a code from this page.", "Choose a service or combo and continue to checkout.", "Paste the code — your discount is shown before you pay."].map(
                (step, i) => (
                  <StaggerItem as="li" key={step} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-gold-light">
                      {i + 1}
                    </span>
                    <span className="pt-2">{step}</span>
                  </StaggerItem>
                )
              )}
            </Stagger>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function CouponTicket({ coupon, featured }) {
  const [copied, setCopied] = useState(false);
  const eligibility = ELIGIBILITY[coupon.eligibility] || ELIGIBILITY.ALL_USERS;
  const left = daysLeft(coupon.validityEnd);
  const detail = discountDetail(coupon);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.couponCode);
      setCopied(true);
      toast.success(`Code ${coupon.couponCode} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please select the code manually.");
    }
  };

  const ticket = (
    <Spotlight
      color={featured ? "rgba(217,191,140,0.22)" : "rgba(176,141,87,0.16)"}
      className={cx(
        "group relative flex h-full overflow-hidden rounded-card transition duration-500 hover:-translate-y-1",
        featured ? "bg-ink text-cream shadow-[0_30px_80px_-24px_rgba(176,141,87,0.6)]" : "border border-line/70 bg-white shadow-soft hover:shadow-lift"
      )}
    >
      {/* Discount stub */}
      <div
        className={cx(
          "relative z-[1] flex w-32 shrink-0 flex-col items-center justify-center px-3 py-8 text-center sm:w-48",
          featured ? "bg-[#2a2420]" : "bg-sand/70"
        )}
      >
        <span className={cx("text-[10px] font-semibold uppercase tracking-[0.25em]", featured ? "text-cream/50" : "text-muted")}>Save</span>
        <span
          className={cx(
            "text-gold-gradient mt-1 font-display font-semibold leading-none transition-transform duration-500 group-hover:scale-110",
            featured ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
          )}
        >
          {discountBig(coupon)}
        </span>
        <span className={cx("mt-1 text-xs font-medium uppercase tracking-widest", featured ? "text-cream/60" : "text-muted")}>off</span>
      </div>

      {/* Perforation: dotted line with notches top & bottom */}
      <div className="relative z-[1] w-0" aria-hidden>
        <span className={cx("absolute inset-y-4 -left-px border-l-2 border-dotted", featured ? "border-white/25" : "border-line")} />
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cream" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-cream" />
      </div>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col gap-4 p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {featured && (
            <Badge tone="gold" className="!bg-gold !text-white">
              ★ Best value
            </Badge>
          )}
          <Badge tone={featured ? "dark" : eligibility.tone} className={featured ? "!bg-white/15" : ""}>
            {eligibility.label}
          </Badge>
          {coupon.usageLimit === "ONCE_PER_USER" && (
            <Badge tone="neutral" className={featured ? "!bg-white/10 !text-cream/80" : ""}>
              One use per person
            </Badge>
          )}
        </div>

        <div>
          <h3 className={cx("font-display", featured ? "text-4xl !text-cream" : "text-2xl")}>{coupon.offerName}</h3>
          {coupon.description && <p className={cx("mt-1 text-sm", featured ? "text-cream/70" : "text-muted")}>{coupon.description}</p>}
          {detail && (
            <p className={cx("mt-1 text-sm", featured ? "text-cream/70" : "text-muted")}>
              {discountHeadline(coupon)} {detail}.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <p className={cx("text-xs", featured ? "text-cream/60" : "text-muted")}>
            Valid until {formatDate(coupon.validityEnd, { timeZone: undefined })}
            {left <= 7 && left >= 0 && <span className="ml-2 font-semibold text-warning">· {left <= 1 ? "Ends today" : `${left} days left`}</span>}
          </p>
          <motion.button
            onClick={copy}
            whileTap={{ scale: 0.94 }}
            className={cx(
              "relative inline-flex h-11 min-w-[11rem] items-center justify-center overflow-hidden rounded-full border border-dashed px-5 font-mono text-sm font-semibold tracking-wider transition-colors",
              copied
                ? "border-success bg-success text-white"
                : featured
                  ? "border-gold-light/60 text-gold-light hover:bg-white/10"
                  : "border-gold/60 text-gold-dark hover:bg-gold-light/40"
            )}
            aria-label={copied ? "Code copied" : `Copy code ${coupon.couponCode}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  className="inline-flex items-center gap-2 font-sans"
                >
                  <Check className="h-4 w-4" /> Copied
                </motion.span>
              ) : (
                <motion.span
                  key="code"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  className="inline-flex items-center gap-2"
                >
                  {coupon.couponCode}
                  <Copy className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </Spotlight>
  );

  return featured ? <div className="glow-border h-full rounded-card p-[1.5px]">{ticket}</div> : ticket;
}
