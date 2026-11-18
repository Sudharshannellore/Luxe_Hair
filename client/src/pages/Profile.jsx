import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock,
  History,
  LogOut,
  Mail,
  Package,
  Pencil,
  Phone,
  Star,
  User,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import api, { getErrorMessage, imageUrl } from "../lib/api";
import { AmbientBlobs, CountUp, Grain } from "../components/fx";
import { bookingDateKey, capitalize, daysUntil, formatCurrency, formatDate, formatLongDate, formatSlot, toDateKey } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  cx,
  EmptyState,
  Field,
  Input,
  Modal,
  PriceSummary,
  Skeleton,
  STATUS_TONE,
  StarRatingInput,
  Textarea,
} from "../components/ui";

const PAGE = 5;
const EASE = [0.22, 1, 0.36, 1];

const IconSlot = ({ icon, ...props }) => {
  const Icon = icon;
  return <Icon {...props} />;
};

/** Collapsible area with a smooth height animation. */
function Collapse({ open, children }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
const FALLBACK_IMG = "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=400";

/* ------------------------------------------------------------------ Review modal */

function ReviewModal({ target, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const base = target.type === "service" ? "service" : "package";

  useEffect(() => {
    api
      .get(`/review/get/${base}/${target.id}`)
      .then(({ data }) => {
        setRating(data.rating || 0);
        setComment(data.comment || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base, target.id]);

  const submit = async () => {
    if (!rating) return toast.error("Please choose a star rating");
    setSaving(true);
    try {
      const { data } = await api.post(`/review/send/${base}/${target.id}`, { rating, comment });
      toast.success(data.message || "Thanks for your review!");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't save your review."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!saving}
      title="Rate your experience"
      description={target.title}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={loading}>
            Submit review
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="space-y-5">
          <Field label="Your rating">
            <StarRatingInput value={rating} onChange={setRating} />
          </Field>
          <Field label="Comments (optional)" htmlFor="review-comment" hint={`${comment.length}/1000`}>
            <Textarea
              id="review-comment"
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you love? Anything we could do better?"
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ Booking card */

const TIMELINE = ["Booked", "Confirmed", "Completed"];
const timelineIndex = { pending: 0, confirmed: 1, completed: 2 };

function StatusTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-danger">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
          <X className="h-3 w-3" aria-hidden />
        </span>
        Cancelled
      </div>
    );
  }
  const current = timelineIndex[status] ?? 0;
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Status: ${status}`}>
      {TIMELINE.map((label, i) => (
        <li key={label} className="flex items-center gap-1.5">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.25, type: "spring", stiffness: 400, damping: 18 }}
            className={cx(
              "relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
              i <= current ? "bg-gold text-white" : "bg-sand text-muted"
            )}
          >
            {i === current && status !== "completed" && (
              <span className="absolute inset-0 animate-pulse-dot rounded-full" aria-hidden />
            )}
            {i < current || status === "completed" ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
          </motion.span>
          <span className={cx("text-xs", i <= current ? "font-medium text-ink" : "text-muted")}>{label}</span>
          {i < TIMELINE.length - 1 && (
            <span className="relative mx-1 h-px w-5 overflow-hidden bg-line sm:w-8">
              {i < current && (
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.25, duration: 0.4, ease: EASE }}
                  className="absolute inset-0 origin-left bg-gold"
                />
              )}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function BookingCard({ booking, upcoming, onCancel, onReview }) {
  const [open, setOpen] = useState(false);
  const service = booking.service || {};
  const total = booking.finalPrice ?? booking.price;

  return (
    <Card className="group overflow-hidden transition-shadow duration-500 hover:shadow-lift">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
          <img
            src={imageUrl(service.image, FALLBACK_IMG)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <span className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/10" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-medium">{service.title || "Service"}</h3>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden /> {formatLongDate(booking.date)}
                </span>
                {booking.timeSlot && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden /> {formatSlot(booking.timeSlot)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" aria-hidden /> {booking.assignedStaff?.name || "Stylist to be assigned"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={STATUS_TONE[booking.status]} dot>
                {capitalize(booking.status)}
              </Badge>
              <Badge tone={STATUS_TONE[booking.paymentStatus] || "neutral"}>
                {booking.paymentStatus === "paid" ? "Paid" : booking.paymentMethod === "online" ? `Payment ${booking.paymentStatus}` : "Pay at salon"}
              </Badge>
            </div>
          </div>

          <StatusTimeline status={booking.status} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-gold-dark"
            >
              {formatCurrency(total)}
              <span className="text-muted">· price details</span>
              <ChevronDown className={cx("h-4 w-4 transition duration-300", open && "rotate-180")} aria-hidden />
            </button>
            <div className="flex gap-2">
              {upcoming && ["pending", "confirmed"].includes(booking.status) && (
                <Button variant="outline" size="sm" onClick={() => onCancel(booking)}>
                  Cancel
                </Button>
              )}
              {booking.status === "completed" && (
                <Button variant="gold" size="sm" onClick={() => onReview({ type: "service", id: booking._id, title: service.title })}>
                  <Star className="h-4 w-4" aria-hidden /> Review
                </Button>
              )}
            </div>
          </div>

          <Collapse open={open}>
            <div className="rounded-xl bg-cream p-4">
              <PriceSummary
                price={booking.price}
                discount={booking.discount || 0}
                total={total}
                couponCode={booking.couponCode}
                formatCurrency={formatCurrency}
              />
            </div>
          </Collapse>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Combo card */

function ComboOrderCard({ order, onReview }) {
  const [open, setOpen] = useState(false);
  const expired = order.status === "expired";
  const cancelled = order.status === "cancelled";
  const days = daysUntil(order.expiryDate);
  const pct = order.totalCount ? Math.round((order.usedCount / order.totalCount) * 100) : 0;

  return (
    <Card className="group overflow-hidden transition-shadow duration-500 hover:shadow-lift">
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-36">
          <img
            src={imageUrl(order.packageImage, FALLBACK_IMG)}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          {!expired && !cancelled && (
            <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 font-display text-sm text-gold-light backdrop-blur">
              {pct}%
            </span>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-medium">{order.packageTitle}</h3>
              <p className="mt-1 text-sm text-muted">Purchased {formatDate(order.orderDate)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cancelled ? (
                <Badge tone="danger">Cancelled</Badge>
              ) : expired ? (
                <Badge tone="neutral">Expired</Badge>
              ) : (
                <Badge tone={days <= 7 ? "warning" : "success"} dot>
                  {days <= 0 ? "Expires today" : `${days} day${days === 1 ? "" : "s"} left`}
                </Badge>
              )}
              <Badge tone={STATUS_TONE[order.paymentStatus] || "neutral"}>
                {order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "online" ? `Payment ${order.paymentStatus}` : "Pay at salon"}
              </Badge>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-ink">
                {order.usedCount} of {order.totalCount} services used
              </span>
              <span className="text-muted">Valid until {formatDate(order.expiryDate)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
              >
                <span className="absolute inset-y-0 left-0 w-1/2 animate-sheen bg-gradient-to-r from-transparent via-white/50 to-transparent" aria-hidden />
              </motion.div>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {order.servicesUsed.map((s) => (
              <li
                key={s._id || s.serviceName}
                className={cx("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm", s.used ? "bg-sand/70 text-muted" : "bg-gold-light/30 text-ink")}
              >
                <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", s.used ? "bg-success text-white" : "border border-gold/60")}>
                  {s.used && <Check className="h-3 w-3" aria-hidden />}
                </span>
                <span className={cx("flex-1", s.used && "line-through")}>{s.serviceName}</span>
                {s.used && s.usedAt && <span className="text-[11px]">{formatDate(s.usedAt, { timeZone: undefined })}</span>}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-gold-dark"
            >
              {formatCurrency(order.finalPrice)}
              <span className="text-muted">· price details</span>
              <ChevronDown className={cx("h-4 w-4 transition duration-300", open && "rotate-180")} aria-hidden />
            </button>
            {order.usedCount > 0 && (
              <Button variant="gold" size="sm" onClick={() => onReview({ type: "package", id: order._id, title: order.packageTitle })}>
                <Star className="h-4 w-4" aria-hidden /> Review
              </Button>
            )}
          </div>
          <Collapse open={open}>
            <div className="rounded-xl bg-cream p-4">
              <PriceSummary price={order.price} discount={order.discount || 0} total={order.finalPrice} couponCode={order.couponCode} formatCurrency={formatCurrency} />
            </div>
          </Collapse>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Account form */

function AccountForm({ user, onSaved }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({ username: user?.username || "", email: user?.email || "", phone: user?.phone || "", password: "", confirm: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.username.trim().length < 2) next.username = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.password && form.password.length < 6) next.password = "At least 6 characters";
    if (form.password !== form.confirm) next.confirm = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length) return;

    const data = new FormData();
    data.append("username", form.username.trim());
    data.append("email", form.email.trim());
    data.append("phone", form.phone.trim());
    if (form.password) data.append("password", form.password);
    if (file) data.append("image", file);

    setSaving(true);
    try {
      const res = await api.put("/user/update", data);
      onSaved(res.data.user);
      setForm((f) => ({ ...f, password: "", confirm: "" }));
      setFile(null);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't update your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 md:p-8">
      <form onSubmit={submit} className="space-y-8" noValidate>
        <div className="flex items-center gap-5">
          <div className="relative">
            {preview ? (
              <img src={preview} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-white" />
            ) : (
              <Avatar name={user?.username} image={user?.image} size="xl" />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream shadow-soft hover:bg-ink-soft"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller");
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }}
            />
          </div>
          <div>
            <p className="font-display text-2xl">Profile photo</p>
            <p className="text-sm text-muted">JPG, PNG or WEBP, up to 5 MB.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Full name" htmlFor="acc-name" error={errors.username}>
            <Input id="acc-name" icon={User} value={form.username} onChange={set("username")} autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="acc-email" error={errors.email}>
            <Input id="acc-email" type="email" icon={Mail} value={form.email} onChange={set("email")} autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="acc-phone">
            <Input id="acc-phone" type="tel" icon={Phone} value={form.phone} onChange={set("phone")} autoComplete="tel" />
          </Field>
        </div>

        <div>
          <h3 className="font-display text-xl">Change password</h3>
          <p className="text-sm text-muted">Leave blank to keep your current password.</p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <Field label="New password" htmlFor="acc-pw" error={errors.password}>
              <Input id="acc-pw" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password" htmlFor="acc-pw2" error={errors.confirm}>
              <Input id="acc-pw2" type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ Page */

const ListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-40 rounded-card" />
    ))}
  </div>
);

export default function Profile() {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState(location.state?.tab || "upcoming");
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [shown, setShown] = useState({ upcoming: PAGE, past: PAGE, combos: PAGE });
  const [review, setReview] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    api
      .get("/booking/my")
      .then(({ data }) => setBookings(data || []))
      .catch((err) => toast.error(getErrorMessage(err, "Couldn't load your bookings.")))
      .finally(() => setLoadingBookings(false));
    api
      .get("/order/get")
      .then(({ data }) => setOrders(data || []))
      .catch((err) => toast.error(getErrorMessage(err, "Couldn't load your combos.")))
      .finally(() => setLoadingOrders(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const today = toDateKey();
    const up = [];
    const old = [];
    for (const b of bookings) {
      if (["pending", "confirmed"].includes(b.status) && bookingDateKey(b.date) >= today) up.push(b);
      else old.push(b);
    }
    up.sort((a, b) => bookingDateKey(a.date).localeCompare(bookingDateKey(b.date)) || (a.timeSlot || "").localeCompare(b.timeSlot || ""));
    return { upcoming: up, past: old };
  }, [bookings]);

  const cancelBooking = async () => {
    setCancelling(true);
    try {
      const { data } = await api.patch(`/booking/cancel/${cancelTarget._id}`);
      toast.success(data.message || "Booking cancelled");
      setBookings((list) => list.map((b) => (b._id === cancelTarget._id ? { ...b, status: "cancelled" } : b)));
      setCancelTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't cancel this booking."));
    } finally {
      setCancelling(false);
    }
  };

  const stats = useMemo(() => {
    const me = String(user?.id || "");
    return [
      { label: "Visits", value: bookings.filter((b) => b.status === "completed").length, icon: CalendarCheck },
      { label: "Upcoming", value: upcoming.length, icon: CalendarDays },
      { label: "Combos", value: orders.length, icon: Package },
      {
        label: "Reviews",
        value: bookings.filter((b) => (b.reviews || []).some((r) => String(r.user) === me)).length,
        icon: Star,
      },
    ];
  }, [bookings, orders, upcoming, user?.id]);

  const tabs = [
    { value: "upcoming", label: "Upcoming", icon: CalendarCheck, count: loadingBookings ? undefined : upcoming.length },
    { value: "past", label: "Past", icon: History, count: loadingBookings ? undefined : past.length },
    { value: "combos", label: "Combos", icon: Package, count: loadingOrders ? undefined : orders.length },
    { value: "account", label: "Account", icon: User },
  ];

  const more = (key, total) =>
    shown[key] < total && (
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={() => setShown((s) => ({ ...s, [key]: s[key] + PAGE }))}>
          Show more ({total - shown[key]} left)
        </Button>
      </div>
    );

  // Cards slide in one after another.
  const list = (items, render) =>
    items.map((item, i) => (
      <motion.div
        key={item._id}
        layout
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.07, ease: EASE }}
      >
        {render(item)}
      </motion.div>
    ));

  const firstName = user?.username?.split(" ")[0] || "there";

  return (
    <div className="bg-cream pb-24">
      {/* Banner */}
      <header className="relative isolate overflow-hidden bg-ink pb-20 pt-32 text-cream md:pb-32 md:pt-32">
        <AmbientBlobs className="-z-10" />
        <Grain className="-z-10" />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-10 -z-10 h-80 w-80 animate-spin-slow rounded-full border border-dashed border-gold/25" />
        <div className="container-page flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="flex items-center gap-5"
          >
            <div className="relative">
              <span className="absolute -inset-1.5 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,#d9bf8c,#8a6d3f,transparent,#d9bf8c)] opacity-80" aria-hidden />
              <Avatar name={user?.username} image={user?.image} size="xl" className="relative !ring-4 !ring-ink" />
            </div>
            <div>
              <p className="eyebrow !text-gold-light">My account</p>
              <h1 className="mt-1 font-display text-5xl font-medium leading-tight !text-cream md:text-5xl">
                Hello, <span className="text-gold-gradient italic">{firstName}</span>
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-cream/60">
                {user?.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" aria-hidden /> {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4" aria-hidden /> {user.phone}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => setTab("account")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-sm font-medium text-cream backdrop-blur transition hover:bg-white/15"
            >
              <Pencil className="h-4 w-4" aria-hidden /> Edit profile
            </button>
            <button
              onClick={() => setConfirmSignOut(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-cream/70 transition hover:bg-white/10 hover:text-cream"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </motion.div>
        </div>
      </header>

      <div className="container-page">
        {/* Stats */}
        <div className="relative -mt-16 grid grid-cols-2 gap-3 md:-mt-20 md:grid-cols-4 md:gap-4">
          {stats.map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 + i * 0.08, ease: EASE }}
              className="group relative overflow-hidden rounded-card border border-line/70 bg-white p-5 shadow-lift"
            >
              <div aria-hidden className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold-light/40 blur-2xl transition-transform duration-700 group-hover:scale-150" />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-gold-light">
                <IconSlot icon={st.icon} className="h-4 w-4" />
              </span>
              <div className="relative mt-4 font-display text-4xl font-semibold text-ink">
                {loadingBookings || loadingOrders ? <Skeleton className="h-9 w-12" /> : <CountUp to={st.value} duration={1.4} />}
              </div>
              <p className="relative text-xs font-medium uppercase tracking-[0.16em] text-muted">{st.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs with a sliding pill */}
        <div className="mt-12 overflow-x-auto pb-1">
          <div role="tablist" className="inline-flex gap-1 rounded-full border border-line bg-white p-1 shadow-soft">
            {tabs.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.value)}
                  className={cx(
                    "relative inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-cream" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="profile-tab"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-ink shadow-soft"
                      aria-hidden
                    />
                  )}
                  <span className="relative inline-flex items-center gap-2">
                    <IconSlot icon={t.icon} className="h-4 w-4" />
                    {t.label}
                    {t.count !== undefined && (
                      <span className={cx("rounded-full px-2 py-0.5 text-xs", active ? "bg-white/15" : "bg-sand")}>{t.count}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-8 space-y-4"
          >
            {tab === "upcoming" &&
              (loadingBookings ? (
                <ListSkeleton />
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming appointments"
                  description="Treat yourself — pick a service and a time that suits you."
                  action={<Button to="/services">Book an appointment</Button>}
                />
              ) : (
                <>
                  {list(upcoming.slice(0, shown.upcoming), (b) => (
                    <BookingCard booking={b} upcoming onCancel={setCancelTarget} onReview={setReview} />
                  ))}
                  {more("upcoming", upcoming.length)}
                </>
              ))}

            {tab === "past" &&
              (loadingBookings ? (
                <ListSkeleton />
              ) : past.length === 0 ? (
                <EmptyState icon={History} title="No past appointments yet" description="Your completed and cancelled appointments will appear here." />
              ) : (
                <>
                  {list(past.slice(0, shown.past), (b) => (
                    <BookingCard booking={b} onCancel={setCancelTarget} onReview={setReview} />
                  ))}
                  {more("past", past.length)}
                </>
              ))}

            {tab === "combos" &&
              (loadingOrders ? (
                <ListSkeleton />
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No combos yet"
                  description="Bundle your favourite services and save."
                  action={<Button to="/combos">Explore combos</Button>}
                />
              ) : (
                <>
                  {list(orders.slice(0, shown.combos), (o) => (
                    <ComboOrderCard order={o} onReview={setReview} />
                  ))}
                  {more("combos", orders.length)}
                </>
              ))}

            {tab === "account" && <AccountForm key={user?.id} user={user} onSaved={updateUser} />}
          </motion.section>
        </AnimatePresence>
      </div>

      {review && <ReviewModal target={review} onClose={() => setReview(null)} />}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        onConfirm={cancelBooking}
        loading={cancelling}
        tone="danger"
        title="Cancel this appointment?"
        description={
          cancelTarget
            ? `${cancelTarget.service?.title || "Your appointment"} on ${formatLongDate(cancelTarget.date)}${
                cancelTarget.timeSlot ? ` at ${formatSlot(cancelTarget.timeSlot)}` : ""
              } will be cancelled.${cancelTarget.paymentStatus === "paid" ? " Your payment will be refunded within 5–7 working days." : ""}`
            : ""
        }
        confirmLabel="Cancel appointment"
      />

      <ConfirmDialog
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={() => {
          signOut();
          toast.success("Signed out");
          navigate("/");
        }}
        title="Sign out?"
        description="You can sign back in any time to manage your bookings."
        confirmLabel="Sign out"
      />
    </div>
  );
}
