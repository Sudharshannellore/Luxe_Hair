import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarClock, Check, Crown, Package, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage, imageUrl } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { payOnline } from "../lib/demoPayment";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, CardSkeleton, cx, EmptyState, Modal, PriceSummary } from "../components/ui";
import { CinematicHeader, CouponPicker, PaymentMethodPicker, SuccessPanel, useCheckoutOptions } from "../components/checkout";
import { AmbientBlobs, CountUp, Grain, Reveal, Spotlight, Stagger, StaggerItem, TiltCard } from "../components/fx";

const HERO = "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1600";
const FALLBACK_IMG = "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800";

/* ------------------------------------------------------------------ Combo card */

function ComboCard({ combo, featured, worth, onBuy }) {
  const validity = combo.validityDays || 30;
  const saving = worth > combo.price ? worth - combo.price : 0;

  const card = (
    <article
      className={cx(
        "group relative flex h-full flex-col overflow-hidden rounded-card",
        featured ? "bg-cream text-ink shadow-[0_30px_80px_-20px_rgba(176,141,87,0.55)]" : "border border-white/10 bg-white/[0.04] text-cream backdrop-blur"
      )}
    >
      {featured && (
        <div className="absolute -right-12 top-7 z-20 rotate-45 bg-gradient-to-r from-gold-dark via-gold to-gold-dark px-12 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg">
          <span className="inline-flex items-center gap-1">
            <Crown className="h-3 w-3" aria-hidden /> Most popular
          </span>
        </div>
      )}
      <div className="shine relative h-48 overflow-hidden">
        <img
          src={imageUrl(combo.image, FALLBACK_IMG)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-110"
        />
        <div className={cx("absolute inset-0", featured ? "bg-gradient-to-t from-cream via-cream/20 to-transparent" : "bg-gradient-to-t from-ink via-ink/40 to-transparent")} />
        {saving > 0 && (
          <span className="absolute left-4 top-4 rounded-full bg-success px-3 py-1 text-xs font-semibold text-white shadow">
            Save {formatCurrency(saving)}
          </span>
        )}
      </div>

      <div className="relative -mt-12 flex flex-1 flex-col px-7 pb-7">
        <h3 className={cx("font-display text-4xl font-medium", featured ? "text-ink" : "!text-cream")}>{combo.title}</h3>
        <p className={cx("mt-1 text-sm", featured ? "text-muted" : "text-cream/60")}>{combo.subtitle}</p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className={cx("font-display text-6xl font-semibold leading-none", featured ? "text-gold-gradient" : "text-gold-light")}>
            <CountUp to={combo.price} prefix="₹" duration={1.6} />
          </span>
          {worth > combo.price && (
            <span className={cx("text-sm line-through", featured ? "text-muted" : "text-cream/40")}>{formatCurrency(worth)}</span>
          )}
        </div>
        <p className={cx("mt-3 inline-flex items-center gap-1.5 text-xs", featured ? "text-muted" : "text-cream/60")}>
          <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Valid for {validity} days · {combo.services?.length || 0} services
        </p>

        <div className={cx("my-6 h-px", featured ? "bg-line" : "bg-white/10")} />

        <p className={cx("text-xs font-semibold uppercase tracking-wider", featured ? "text-gold-dark" : "text-gold-light")}>Includes</p>
        <Stagger as="ul" gap={0.07} className="mt-3 space-y-2.5">
          {(combo.services || []).map((s) => (
            <StaggerItem as="li" key={s} className="flex items-start gap-2.5 text-sm">
              <span className={cx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", featured ? "bg-gold text-white" : "bg-gold/20 text-gold-light")}>
                <Check className="h-3 w-3" aria-hidden />
              </span>
              <span className={featured ? "text-ink-soft" : "text-cream/85"}>{s}</span>
            </StaggerItem>
          ))}
        </Stagger>

        {combo.features?.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {combo.features.map((f) => (
              <li key={f} className={cx("rounded-full px-3 py-1 text-xs", featured ? "bg-sand text-ink-soft" : "bg-white/10 text-cream/75")}>
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-8">
          <Button variant={featured ? "primary" : "gold"} size="lg" className="w-full" onClick={() => onBuy(combo)}>
            Get {combo.title}
          </Button>
        </div>
      </div>
    </article>
  );

  if (featured) {
    return (
      <div className="h-full animate-float lg:-my-6">
        <div className="glow-border h-full rounded-card p-[1.5px]">
          <TiltCard max={5} className="h-full rounded-card">
            {card}
          </TiltCard>
        </div>
      </div>
    );
  }
  return (
    <TiltCard max={6} className="h-full rounded-card">
      {card}
    </TiltCard>
  );
}

/* ------------------------------------------------------------------ Purchase modal */

function PurchaseModal({ combo, options, onClose }) {
  const navigate = useNavigate();
  const [method, setMethod] = useState(options.defaultMethod);
  const [coupon, setCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!method && options.defaultMethod) setMethod(options.defaultMethod);
  }, [options.defaultMethod, method]);

  const total = coupon ? coupon.finalAmount : combo.price;

  const confirm = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/order/place", {
        packageId: combo._id,
        paymentMethod: method,
        ...(coupon ? { couponCode: coupon.code } : {}),
      });
      if (data.payment) {
        try {
          await payOnline(data.payment);
        } catch (err) {
          if (err?.cancelled) {
            toast.info("Payment cancelled — no charge was made");
            return;
          }
          throw err;
        }
      }
      setDone({ paidOnline: Boolean(data.payment), expiry: data.order?.expiryDate });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't complete your purchase."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!submitting}
      size="lg"
      title={done ? "Combo activated" : combo.title}
      description={done ? undefined : `${combo.services?.length || 0} services · valid for ${combo.validityDays || 30} days`}
      footer={
        done ? null : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="font-display text-2xl font-semibold text-ink">{formatCurrency(total)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="gold" onClick={confirm} loading={submitting} disabled={!method}>
                {method === "online" ? `Pay ${formatCurrency(total)}` : "Confirm purchase"}
              </Button>
            </div>
          </div>
        )
      }
    >
      {done ? (
        <SuccessPanel
          title="Enjoy your combo"
          lines={[
            ["Combo", combo.title],
            ["Services", String(combo.services?.length || 0)],
            ["Payment", done.paidOnline ? "Paid online" : "Pay at salon"],
            ["Total", formatCurrency(total)],
          ]}
          note="Book each included service at the studio whenever it suits you. Track usage from your profile."
          secondary={
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          }
          primary={<Button onClick={() => navigate("/profile", { state: { tab: "combos" } })}>View my combos</Button>}
        />
      ) : (
        <div className="space-y-7">
          <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-cream">
            <AmbientBlobs className="opacity-70" />
            <ul className="relative grid gap-2 sm:grid-cols-2">
              {(combo.services || []).map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-cream/90">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/25 text-gold-light">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Payment method</h3>
            <PaymentMethodPicker methods={options.methods} value={method} onChange={setMethod} />
          </section>
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Coupon</h3>
            <CouponPicker coupons={options.coupons} target={{ packageId: combo._id }} applied={coupon} onApplied={setCoupon} />
          </section>
          <div className="rounded-2xl border border-line p-5">
            <PriceSummary price={combo.price} discount={coupon?.discount || 0} total={total} couponCode={coupon?.code} formatCurrency={formatCurrency} />
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ Page */

const PERKS = [
  { icon: Wallet, title: "Better value", text: "Save compared to booking each service separately." },
  { icon: CalendarClock, title: "Use at your pace", text: "Redeem services any time before your combo expires." },
  { icon: ShieldCheck, title: "Same expert care", text: "Every service is delivered by our senior stylists." },
];

export default function Combos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const options = useCheckoutOptions();
  const [combos, setCombos] = useState([]);
  const [servicePrices, setServicePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get("/package/get")
      .then(({ data }) => setCombos(data || []))
      .catch((err) => toast.error(getErrorMessage(err, "Couldn't load combos.")))
      .finally(() => setLoading(false));
    // Individual prices power the "worth / you save" comparison (optional).
    api
      .get("/service/get")
      .then(({ data }) => setServicePrices(Object.fromEntries((data || []).map((s) => [s.title, s.price]))))
      .catch(() => {});
  }, []);

  // Sum of the included services' individual prices (0 if any service is unknown).
  const worthOf = useMemo(
    () => (combo) => {
      const prices = (combo.services || []).map((n) => servicePrices[n]);
      return prices.length && prices.every((p) => typeof p === "number") ? prices.reduce((a, b) => a + b, 0) : 0;
    },
    [servicePrices]
  );

  const buy = (combo) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to purchase a combo");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setSelected(combo);
  };

  // Highlight the middle card of the visible row (by price order from the API).
  const featuredIndex = combos.length >= 3 ? 1 : -1;

  const stats = combos.length
    ? [
        { value: combos.length, label: "Curated combos" },
        { value: `${Math.max(...combos.map((c) => c.services?.length || 0))}`, label: "Max services" },
        { value: `${Math.max(...combos.map((c) => c.validityDays || 30))} days`, label: "Longest validity" },
        { value: `From ${formatCurrency(Math.min(...combos.map((c) => c.price)))}`, label: "Pricing" },
      ]
    : [];

  const comparisons = combos.map((c) => ({ combo: c, worth: worthOf(c) })).filter((x) => x.worth > x.combo.price);

  return (
    <div>
      <CinematicHeader
        eyebrow="Premium combos"
        title="More care, *better* value"
        description="Curated bundles of our most-loved services. Buy once, then enjoy each treatment whenever you like."
        image={HERO}
        stats={stats}
      />

      <section className="relative overflow-hidden bg-ink py-24">
        <AmbientBlobs className="opacity-60" />
        <Grain />
        <div className="container-page relative">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : combos.length === 0 ? (
            <EmptyState
              icon={Package}
              title="New combos coming soon"
              description="We're putting together fresh bundles. Meanwhile, explore our individual services."
              action={<Button to="/services">Browse services</Button>}
            />
          ) : (
            <Stagger gap={0.15} className="grid items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3 lg:py-6">
              {combos.map((combo, i) => (
                <StaggerItem key={combo._id} className="h-full">
                  <ComboCard combo={combo} featured={i === featuredIndex} worth={worthOf(combo)} onBuy={buy} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      {comparisons.length > 0 && (
        <section className="container-page py-20">
          <Reveal>
            <p className="eyebrow">Do the maths</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Combo vs <span className="text-gold-gradient italic">booking separately</span>
            </h2>
          </Reveal>
          <Stagger className="mt-10 space-y-4">
            {comparisons.map(({ combo, worth }) => {
              const saving = worth - combo.price;
              const pct = Math.round((combo.price / worth) * 100);
              return (
                <StaggerItem key={combo._id}>
                  <Spotlight className="rounded-2xl border border-line/70 bg-white p-5 shadow-soft md:p-6">
                    <div className="relative grid items-center gap-4 md:grid-cols-[1.2fr_2fr_auto]">
                      <div>
                        <p className="font-display text-2xl text-ink">{combo.title}</p>
                        <p className="text-xs text-muted">{combo.services?.length} services</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted">
                          <span>Combo {formatCurrency(combo.price)}</span>
                          <span>Separately {formatCurrency(worth)}</span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-sand">
                          <Reveal x={-40} y={0} className="h-full">
                            <div className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light" style={{ width: `${pct}%` }} />
                          </Reveal>
                        </div>
                      </div>
                      <Badge tone="success" className="justify-self-start text-sm md:justify-self-end">
                        You save <CountUp to={saving} prefix="₹" duration={1.4} />
                      </Badge>
                    </div>
                  </Spotlight>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      )}

      <section className="border-t border-line/70 bg-white py-16">
        <Stagger className="container-page grid gap-8 md:grid-cols-3">
          {PERKS.map((p) => (
            <StaggerItem key={p.title} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-gold-light shadow-soft">
                <p.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-xl font-medium">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="container-page mt-12 flex justify-center">
          <Badge tone="gold">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Coupons apply to combos too — check the Offers page
          </Badge>
        </div>
      </section>

      {selected && <PurchaseModal key={selected._id} combo={selected} options={options} onClose={() => setSelected(null)} />}
    </div>
  );
}
