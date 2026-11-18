import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, cx } from "../components/ui";
import { Reveal, Spotlight, Stagger, StaggerItem } from "../components/fx";
import CinematicHeader from "../components/CinematicHeader";

const PHONE_RE = /^[+\d][\d\s-]{6,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EASE = [0.22, 1, 0.36, 1];

const FAQS = [
  {
    q: "Do I need a consultation before treatment?",
    a: "For colour and chemical treatments we recommend a short consultation — your stylist will do one at the start of your first appointment at no extra cost.",
  },
  {
    q: "How far in advance should I book?",
    a: "Weekends fill up fastest, so 1–2 weeks ahead is ideal. You can see live availability for every service and book up to 90 days ahead.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Yes — cancel any upcoming appointment from your profile. If you paid online, your refund is processed within 5–7 working days.",
  },
  {
    q: "How do combo packages work?",
    a: "A combo bundles several services at a better price. Each service can be redeemed on a separate visit while the combo is valid.",
  },
];

const CONTACT = [
  { icon: MapPin, label: "Visit", value: "123 Luxury Avenue, Beauty District" },
  { icon: Phone, label: "Call", value: "+91 78904 56132", href: "tel:+917890456132" },
  { icon: Mail, label: "Email", value: "hello@luxehair.com", href: "mailto:hello@luxehair.com" },
  { icon: Clock, label: "Hours", value: "Mon – Sun · 10:00 – 20:00" },
];

const IconSlot = ({ icon, ...props }) => {
  const Icon = icon;
  return <Icon {...props} />;
};

const validate = (f) => {
  const e = {};
  if (f.fullname.trim().length < 2) e.fullname = "Please enter your name.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (!PHONE_RE.test(f.phone.trim())) e.phone = "Enter a valid phone number.";
  if (f.message.trim().length < 5) e.message = "Tell us a little more (at least 5 characters).";
  else if (f.message.length > 2000) e.message = "Please keep your message under 2000 characters.";
  return e;
};

/** Input with a floating label and an animated gold underline on focus. */
function FloatField({ id, label, error, textarea, value, onChange, hint, ...props }) {
  const [focused, setFocused] = useState(false);
  const raised = focused || String(value || "").length > 0;
  const Tag = textarea ? "textarea" : "input";
  return (
    <div>
      <div
        className={cx(
          "relative rounded-2xl border bg-cream/50 transition-colors duration-300",
          error ? "border-danger/60" : focused ? "border-gold bg-white" : "border-line hover:border-ink/20"
        )}
      >
        <label
          htmlFor={id}
          className={cx(
            "pointer-events-none absolute left-4 origin-left transition-all duration-300",
            raised ? "top-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark" : "top-4 text-sm text-muted"
          )}
        >
          {label}
        </label>
        <Tag
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cx(
            "w-full resize-none bg-transparent px-4 pb-2.5 pt-7 text-sm text-ink outline-none",
            textarea ? "min-h-[10rem]" : "h-14"
          )}
          {...props}
        />
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute inset-x-4 bottom-0 h-[2px] origin-left rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
        />
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="err"
            id={`${id}-err`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-danger"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p className="mt-1.5 text-right text-xs text-muted">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SuccessCheck() {
  return (
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
  );
}

export default function Contact() {
  const { user } = useAuth();
  const empty = { fullname: user?.username || "", email: user?.email || "", phone: user?.phone || "", message: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [shake, setShake] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
      const { data } = await api.post("/message/save", payload);
      toast.success(data?.message || "Message sent");
      setSent(true);
      setForm({ ...empty, message: "" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't send your message."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CinematicHeader
        eyebrow="Contact"
        title="We'd *love* to hear from you"
        description="Questions about a treatment, a booking or a special occasion? Send us a note and we'll reply within 24 hours."
        image="https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1600"
      />

      <section className="container-page relative -mt-10 grid gap-8 pb-16 md:-mt-14 md:pb-24 lg:grid-cols-5">
        {/* Details */}
        <aside className="space-y-6 lg:col-span-2">
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {CONTACT.map(({ icon, label, value, href }) => {
              const Wrapper = href ? "a" : "div";
              return (
                <StaggerItem key={label}>
                  <Spotlight className="rounded-card">
                    <Wrapper
                      {...(href ? { href } : {})}
                      className="group relative z-10 flex items-center gap-4 rounded-card border border-line/70 bg-white/90 p-5 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-gold-light transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                        <IconSlot icon={icon} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
                        <p className="truncate text-sm font-medium text-ink">{value}</p>
                      </div>
                      {href && <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-dark" />}
                    </Wrapper>
                  </Spotlight>
                </StaggerItem>
              );
            })}
          </Stagger>

          {/* Map-style card */}
          <Reveal>
            <div className="relative h-64 overflow-hidden rounded-card border border-line/70 bg-sand shadow-soft">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
                aria-hidden
              />
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                <motion.path
                  d="M -10 180 C 80 150, 120 60, 220 90 S 360 40, 520 70"
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeWidth="3"
                  strokeDasharray="6 8"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </svg>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-lift">
                  <span className="absolute inset-0 animate-ring rounded-full bg-gold/40" aria-hidden />
                  <MapPin className="relative h-6 w-6 animate-float" />
                </span>
                <p className="mt-3 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-ink shadow-soft">Luxe Hair · Beauty District</p>
              </div>
              <a
                href="https://maps.google.com/?q=Luxe+Hair+Beauty+District"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream shadow-soft transition hover:bg-ink-soft"
              >
                Open in Maps <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>
        </aside>

        {/* Form */}
        <Reveal className="lg:col-span-3" delay={0.1}>
          <div className="relative overflow-hidden rounded-[2rem] border border-line/70 bg-white p-6 shadow-lift md:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-light/40 blur-3xl" />
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="relative flex flex-col items-center py-12 text-center"
                  role="status"
                >
                  <SuccessCheck />
                  <h2 className="mt-6 font-display text-4xl">Message received</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted">Thank you for reaching out. A member of our team will reply within 24 hours.</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={() => setSent(false)}>
                      Send another message
                    </Button>
                    <Button to="/services">Browse services</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  noValidate
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: shake ? [0, -8, 8, -4, 0] : 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="relative space-y-5"
                >
                  <div>
                    <p className="eyebrow">Write to us</p>
                    <h2 className="mt-2 font-display text-4xl">Send a message</h2>
                    <p className="mt-1 text-sm text-muted">All fields are required.</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FloatField id="fullname" label="Full name" autoComplete="name" value={form.fullname} onChange={set("fullname")} error={errors.fullname} />
                    <FloatField id="phone" label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
                  </div>
                  <FloatField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
                  <FloatField
                    id="message"
                    label="How can we help?"
                    textarea
                    rows={6}
                    maxLength={2000}
                    value={form.message}
                    onChange={set("message")}
                    error={errors.message}
                    hint={`${form.message.length}/2000`}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="group shine relative inline-flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-ink px-8 text-sm font-medium tracking-wide text-cream shadow-soft transition hover:bg-ink-soft disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream border-t-transparent" aria-hidden />
                    ) : (
                      <Send className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1" />
                    )}
                    {loading ? "Sending…" : "Send message"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 md:py-24">
        <div className="container-page max-w-3xl">
          <Reveal className="mb-12 text-center">
            <p className="eyebrow mb-3">FAQ</p>
            <h2 className="font-display text-4xl md:text-5xl">
              Good to <span className="text-gold-gradient italic">know</span>
            </h2>
          </Reveal>
          <Stagger as="ul" className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <StaggerItem
                  as="li"
                  key={f.q}
                  className={cx(
                    "overflow-hidden rounded-card border transition-colors duration-300",
                    open ? "border-gold/40 bg-cream shadow-soft" : "border-line/70 bg-cream/40 hover:border-ink/20"
                  )}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium text-ink"
                  >
                    <span className="flex items-center gap-4">
                      <span className={cx("font-display text-lg transition-colors", open ? "text-gold-dark" : "text-muted")}>0{i + 1}</span>
                      {f.q}
                    </span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", open ? "bg-ink text-cream" : "bg-white text-muted")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={`faq-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        <p className="px-6 pb-6 pl-[4.25rem] text-sm leading-relaxed text-muted">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>
    </>
  );
}
