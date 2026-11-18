import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarDays, Check, Clock, Scissors, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage, imageUrl } from "../lib/api";
import { formatCurrency, formatLongDate, formatSlot, toDateKey } from "../lib/format";
import { payOnline } from "../lib/demoPayment";
import { useAuth } from "../context/AuthContext";
import { Button, CardSkeleton, cx, Drawer, EmptyState, Input, PriceSummary, Skeleton } from "../components/ui";
import { CinematicHeader, CouponPicker, PaymentMethodPicker, Steps, SuccessPanel, useCheckoutOptions } from "../components/checkout";
import { AmbientBlobs, Grain, Magnetic, Marquee, Reveal, TiltCard } from "../components/fx";

const PAGE_SIZE = 9;
const DAYS_AHEAD = 30;
const HERO = "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600";
const FALLBACK_IMG = "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800";
const EASE = [0.22, 1, 0.36, 1];

const nextDays = () =>
  Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key: toDateKey(d),
      weekday: i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
    };
  });

/* ------------------------------------------------------------------ Service card */

function ServiceCard({ service, onBook }) {
  return (
    <TiltCard max={6} className="h-full rounded-card">
      <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line/70 bg-white shadow-soft transition-shadow duration-500 hover:shadow-lift">
        <div className="shine relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl(service.image, FALLBACK_IMG)}
            alt={service.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" aria-hidden />
          <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-cream backdrop-blur">
            {service.category}
          </span>
          <span className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 font-display text-xl font-semibold text-white shadow-lg backdrop-blur-md">
            {formatCurrency(service.price)}
          </span>
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink">
            <Clock className="h-3.5 w-3.5 text-gold" aria-hidden /> {service.duration}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-display text-2xl font-medium leading-snug transition-colors group-hover:text-gold-dark">{service.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{service.description}</p>
          {service.benefits?.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {service.benefits.slice(0, 3).map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-light/70 text-gold-dark">
                    <Check className="h-2.5 w-2.5" aria-hidden />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto pt-6">
            <Button onClick={() => onBook(service)} className="group/btn w-full justify-between">
              Book this service
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover/btn:translate-x-1">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Button>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}

/* ------------------------------------------------------------------ Booking drawer */

const STEPS = ["Date & time", "Payment", "Review"];

function BookingDrawer({ service, onClose, options }) {
  const navigate = useNavigate();
  const days = useMemo(nextDays, []);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [date, setDate] = useState(days[0].key);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [method, setMethod] = useState(options.defaultMethod);
  const [coupon, setCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const go = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  useEffect(() => {
    if (!method && options.defaultMethod) setMethod(options.defaultMethod);
  }, [options.defaultMethod, method]);

  useEffect(() => {
    let alive = true;
    setSlotsLoading(true);
    setSlotsError("");
    setTimeSlot("");
    api
      .get("/booking/slots", { params: { date } })
      .then(({ data }) => alive && setSlots(data.slots || []))
      .catch((err) => alive && setSlotsError(getErrorMessage(err, "Couldn't load time slots.")))
      .finally(() => alive && setSlotsLoading(false));
    return () => {
      alive = false;
    };
  }, [date]);

  const firstAvailableToday = slots.some((s) => s.available);
  const total = coupon ? coupon.finalAmount : service.price;
  const discount = coupon ? coupon.discount : 0;

  const confirm = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/booking/create", {
        serviceId: service._id,
        date,
        timeSlot,
        paymentMethod: method,
        ...(coupon ? { couponCode: coupon.code } : {}),
      });

      if (data.payment) {
        try {
          await payOnline(data.payment);
        } catch (err) {
          if (err?.cancelled) {
            toast.info("Payment cancelled — your slot was released");
            go(0);
            setTimeSlot("");
            return;
          }
          throw err;
        }
      }
      setDone({ paidOnline: Boolean(data.payment) });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't complete your booking."));
      if (err?.response?.status === 409) {
        // Slot was taken meanwhile: go back to time selection with fresh availability.
        go(0);
        setTimeSlot("");
        api.get("/booking/slots", { params: { date } }).then(({ data }) => setSlots(data.slots || [])).catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = step === 0 ? Boolean(timeSlot) : step === 1 ? Boolean(method) : true;

  const footer = done ? null : (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm">
        <p className="text-muted">Total</p>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={total}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            className="font-display text-2xl font-semibold text-ink"
          >
            {formatCurrency(total)}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => go(step - 1)} disabled={submitting}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button onClick={() => go(step + 1)} disabled={!canContinue}>
            Continue <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="gold" onClick={confirm} loading={submitting}>
            {method === "online" ? `Pay ${formatCurrency(total)}` : "Confirm booking"}
          </Button>
        )}
      </div>
    </div>
  );

  const slide = {
    initial: (dir) => ({ x: dir * 40, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.35, ease: EASE } },
    exit: (dir) => ({ x: dir * -40, opacity: 0, transition: { duration: 0.2 } }),
  };

  return (
    <Drawer
      open
      onClose={submitting ? undefined : onClose}
      dismissible={!submitting}
      title={done ? "You're booked!" : `Book ${service.title}`}
      description={done ? undefined : `${service.duration} · ${formatCurrency(service.price)}`}
      footer={footer}
    >
      {done ? (
        <SuccessPanel
          title="See you soon"
          lines={[
            ["Service", service.title],
            ["Date", formatLongDate(`${date}T00:00:00Z`)],
            ["Time", formatSlot(timeSlot)],
            ["Payment", done.paidOnline ? "Paid online" : "Pay at salon"],
            ["Total", formatCurrency(total)],
          ]}
          note="A confirmation email is on its way. You can manage or cancel this booking from your profile."
          secondary={
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          }
          primary={<Button onClick={() => navigate("/profile")}>View my bookings</Button>}
        />
      ) : (
        <>
          <Steps steps={STEPS} current={step} />

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div key={step} custom={direction} variants={slide} initial="initial" animate="animate" exit="exit">
                {step === 0 && (
                  <div className="space-y-8">
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                        <CalendarDays className="h-4 w-4 text-gold" aria-hidden /> Choose a day
                      </h3>
                      <div className="-mx-6 flex snap-x gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]" role="radiogroup" aria-label="Day">
                        {days.map((d) => {
                          const active = d.key === date;
                          return (
                            <motion.button
                              key={d.key}
                              role="radio"
                              aria-checked={active}
                              onClick={() => setDate(d.key)}
                              whileTap={{ scale: 0.92 }}
                              className={cx(
                                "relative flex w-16 shrink-0 snap-start flex-col items-center rounded-2xl border py-3 transition-colors",
                                active ? "border-ink text-cream" : "border-line bg-white text-ink hover:border-ink/30"
                              )}
                            >
                              {active && (
                                <motion.span
                                  layoutId="day-pill"
                                  className="absolute inset-0 -z-0 rounded-2xl bg-ink shadow-soft"
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                              )}
                              <span className={cx("relative text-[11px] font-medium uppercase", active ? "text-gold-light" : "text-muted")}>{d.weekday}</span>
                              <span className="relative font-display text-2xl font-semibold leading-tight">{d.day}</span>
                              <span className={cx("relative text-[11px]", active ? "text-cream/70" : "text-muted")}>{d.month}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                        <Clock className="h-4 w-4 text-gold" aria-hidden /> Pick a time
                      </h3>
                      {slotsLoading ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-12" />
                          ))}
                        </div>
                      ) : slotsError ? (
                        <p className="text-sm text-danger">{slotsError}</p>
                      ) : !firstAvailableToday ? (
                        <p className="rounded-xl bg-sand px-4 py-3 text-sm text-muted">No times left on this day — please choose another date.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Time">
                          {slots.map((s, i) => {
                            const active = s.time === timeSlot;
                            return (
                              <motion.button
                                key={s.time}
                                role="radio"
                                aria-checked={active}
                                disabled={!s.available}
                                onClick={() => setTimeSlot(s.time)}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0, scale: active ? 1.06 : 1 }}
                                transition={{ delay: i * 0.025, type: "spring", stiffness: 400, damping: 22 }}
                                whileTap={s.available ? { scale: 0.94 } : undefined}
                                className={cx(
                                  "relative flex h-12 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                                  active
                                    ? "border-gold bg-gold text-white shadow-[0_8px_20px_-6px_rgba(176,141,87,0.7)]"
                                    : s.available
                                      ? "border-line bg-white text-ink hover:border-gold"
                                      : "cursor-not-allowed border-line/60 bg-sand/60 text-muted/50 line-through"
                                )}
                              >
                                {formatSlot(s.time)}
                                {s.available && s.remaining <= 2 && (
                                  <span className={cx("text-[10px] font-normal", active ? "text-white/80" : "text-warning")}>{s.remaining} left</span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-8">
                    <section>
                      <h3 className="mb-3 text-sm font-semibold text-ink">How would you like to pay?</h3>
                      <PaymentMethodPicker methods={options.methods} value={method} onChange={setMethod} />
                    </section>
                    <section>
                      <h3 className="mb-3 text-sm font-semibold text-ink">Have a coupon?</h3>
                      <CouponPicker coupons={options.coupons} target={{ serviceId: service._id }} applied={coupon} onApplied={setCoupon} />
                    </section>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="relative flex gap-4 overflow-hidden rounded-2xl bg-ink p-4 text-cream">
                      <AmbientBlobs className="opacity-60" />
                      <img src={imageUrl(service.image, FALLBACK_IMG)} alt="" className="relative h-20 w-20 shrink-0 rounded-xl object-cover ring-2 ring-gold/40" />
                      <div className="relative min-w-0">
                        <p className="font-display text-xl font-medium !text-cream">{service.title}</p>
                        <p className="mt-1 text-sm text-cream/70">
                          {formatLongDate(`${date}T00:00:00Z`)} · {formatSlot(timeSlot)}
                        </p>
                        <p className="text-sm text-gold-light">{method === "online" ? "Pay online now" : "Pay at the salon"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-line bg-white p-5">
                      <PriceSummary price={service.price} discount={discount} total={total} couponCode={coupon?.code} formatCurrency={formatCurrency} />
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      Free cancellation from your profile until the day of your appointment. Please arrive 10 minutes early.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------------ Page */

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const options = useCheckoutOptions();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get("/service/get")
      .then(({ data }) => setServices(data || []))
      .catch((err) => toast.error(getErrorMessage(err, "Couldn't load services.")))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...new Set(services.map((s) => s.category).filter(Boolean))], [services]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter(
      (s) =>
        (category === "All" || s.category === category) &&
        (!q || s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
    );
  }, [services, category, search]);

  useEffect(() => setVisible(PAGE_SIZE), [category, search]);

  const marqueeWords = useMemo(() => {
    const words = [...categories.filter((c) => c !== "All"), ...services.flatMap((s) => s.benefits || []).slice(0, 8)];
    return words.length ? [...new Set(words)] : ["Precision cuts", "Colour", "Keratin", "Hair spa", "Scalp care", "Bridal styling"];
  }, [categories, services]);

  const stats = useMemo(() => {
    if (!services.length) return [];
    const prices = services.map((s) => s.price);
    return [
      { value: services.length, label: "Services" },
      { value: categories.length - 1, label: "Categories" },
      { value: `From ${formatCurrency(Math.min(...prices))}`, label: "Pricing" },
      { value: "24/7", label: "Online booking" },
    ];
  }, [services, categories]);

  const book = (service) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to book an appointment");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setSelected(service);
  };

  // Home's service tiles link here with state.serviceId: open that service's booking directly.
  const preselectId = location.state?.serviceId;
  useEffect(() => {
    if (!preselectId || !services.length) return;
    const match = services.find((s) => s._id === preselectId);
    navigate(location.pathname, { replace: true, state: null });
    if (match) book(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectId, services]);

  return (
    <div>
      <CinematicHeader
        eyebrow="Our menu · Booking open"
        title="Services crafted for *beautiful* hair"
        description="From precision cuts to restorative treatments — choose a service, pick a time that suits you, and we'll take care of the rest."
        image={HERO}
        stats={stats}
      />

      {/* Gold marquee band */}
      <div className="relative overflow-hidden bg-gold py-4 text-ink">
        <Marquee speed={45}>
          {marqueeWords.map((w) => (
            <span key={w} className="flex items-center gap-6 px-6 font-display text-2xl italic md:text-3xl">
              {w}
              <span className="text-base not-italic text-ink/40" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </Marquee>
      </div>

      <div className="sticky top-16 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-xl md:top-20">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Categories">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />)
              : categories.map((c) => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCategory(c)}
                      className={cx(
                        "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active ? "text-cream" : "text-ink-soft hover:text-ink"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="category-pill"
                          className="absolute inset-0 rounded-full bg-ink shadow-soft"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative">{c}</span>
                    </button>
                  );
                })}
          </div>
          <div className="w-full md:w-72">
            <Input icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services…" aria-label="Search services" className="h-11" />
          </div>
        </div>
      </div>

      <section className="container-page py-14">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={services.length ? Search : Scissors}
            title={services.length ? "No matching services" : "Services coming soon"}
            description={services.length ? "Try another category or search term." : "Our menu is being updated. Please check back shortly."}
            action={
              services.length ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategory("All");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-muted">
              Showing {Math.min(visible, filtered.length)} of {filtered.length} service{filtered.length === 1 ? "" : "s"}
            </p>
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.slice(0, visible).map((s, i) => (
                  <motion.div
                    key={s._id}
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.6, delay: (i % PAGE_SIZE) * 0.06, ease: EASE }}
                    className="h-full"
                  >
                    <ServiceCard service={s} onBook={book} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {visible < filtered.length && (
              <div className="mt-12 flex justify-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Load more services
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="container-page pb-20">
        <Reveal>
          <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-card bg-ink p-8 text-cream md:flex-row md:items-center md:justify-between md:p-12">
            <AmbientBlobs />
            <Grain />
            <div className="relative">
              <p className="eyebrow !text-gold-light">Save more</p>
              <h2 className="mt-2 font-display text-3xl !text-cream md:text-5xl">
                Planning several visits? <span className="text-gold-gradient italic">Try a combo.</span>
              </h2>
              <p className="mt-3 max-w-xl text-cream/70">Bundle your favourite services and save — redeem each one whenever it suits you.</p>
            </div>
            <Magnetic className="relative">
              <Button variant="gold" to="/combos" size="lg">
                <Sparkles className="h-4 w-4" aria-hidden /> Explore combos
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </section>

      {selected && <BookingDrawer key={selected._id} service={selected} options={options} onClose={() => setSelected(null)} />}
    </div>
  );
}
