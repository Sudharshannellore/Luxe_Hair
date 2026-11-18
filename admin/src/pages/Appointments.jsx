import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Mail, Phone, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  assignStaffToBooking,
  getAppointments,
  getAvailableStaff,
  updateAppointmentStatus,
  updatePaymentStatus,
} from "../apis/appointmentApi";
import { getErrorMessage, imageUrl } from "../lib/api";
import { bookingDateKey, capitalize, formatCurrency, formatDate, formatDateTime, formatSlot } from "../lib/format";
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, Input, PageHeader, STATUS_TONE, Skeleton } from "../components/ui";
import { DataTable, FilterPills, Select } from "../components/ui/admin";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

const Detail = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
    <span className="text-muted">{label}</span>
    <span className="text-right font-medium text-ink">{children}</span>
  </div>
);

function BookingDrawer({ booking, onClose, onUpdated }) {
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const dateKey = bookingDateKey(booking?.date);
  const bookingId = booking?._id;
  const timeSlot = booking?.timeSlot;

  useEffect(() => {
    if (!bookingId) return;
    setStaffId("");
    setStaffLoading(true);
    getAvailableStaff(dateKey, timeSlot)
      .then((list) => setStaff(list || []))
      .catch(() => setStaff([]))
      .finally(() => setStaffLoading(false));
  }, [bookingId, dateKey, timeSlot]);

  if (!booking) return null;

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res?.booking) onUpdated(res.booking);
      toast.success(res?.message || success);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setBusy("");
    }
  };

  const setStatus = (status) => run(`status-${status}`, () => updateAppointmentStatus(booking._id, status), `Marked ${status}`);
  const setPayment = (paymentStatus) =>
    run(`pay-${paymentStatus}`, () => updatePaymentStatus(booking._id, paymentStatus), "Payment updated");
  const assign = () => run("assign", () => assignStaffToBooking(booking._id, staffId), "Stylist assigned");

  const closed = booking.status === "cancelled" || booking.status === "completed";
  const total = booking.finalPrice ?? booking.price;

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={booking.service?.title || "Booking"}
        description={`${formatDate(booking.date, { weekday: "short" })}${booking.timeSlot ? ` · ${formatSlot(booking.timeSlot)}` : ""}`}
        footer={
          !closed && (
            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="outline" onClick={() => setConfirmCancel(true)} className="!text-danger">
                <X className="h-4 w-4" /> Cancel booking
              </Button>
              {booking.status === "pending" ? (
                <Button onClick={() => setStatus("confirmed")} loading={busy === "status-confirmed"}>
                  Confirm booking
                </Button>
              ) : (
                <Button variant="gold" onClick={() => setStatus("completed")} loading={busy === "status-completed"}>
                  <CheckCircle2 className="h-4 w-4" /> Mark completed
                </Button>
              )}
            </div>
          )
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone={STATUS_TONE[booking.status]} dot>{capitalize(booking.status)}</Badge>
            <Badge tone={STATUS_TONE[booking.paymentStatus]}>
              {capitalize(booking.paymentStatus)} · {booking.paymentMethod === "online" ? "Online" : "Pay at salon"}
            </Badge>
            {booking.cancelledBy && <Badge>Cancelled by {booking.cancelledBy}</Badge>}
          </div>

          {/* Customer */}
          <section className="rounded-2xl border border-line/70 bg-white p-4">
            <div className="flex items-center gap-3">
              <Avatar name={booking.user?.username} image={booking.user?.image} />
              <div className="min-w-0">
                <p className="font-medium text-ink">{booking.user?.username || "Deleted user"}</p>
                <p className="truncate text-xs text-muted">{booking.user?.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {booking.user?.email && (
                <Button size="sm" variant="outline" href={`mailto:${booking.user.email}`}>
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
              )}
              {booking.user?.phone && (
                <Button size="sm" variant="outline" href={`tel:${booking.user.phone}`}>
                  <Phone className="h-3.5 w-3.5" /> {booking.user.phone}
                </Button>
              )}
            </div>
          </section>

          {/* Status */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Status</h3>
            <div className="grid grid-cols-3 gap-2">
              {["pending", "confirmed", "completed"].map((s) => (
                <button
                  key={s}
                  disabled={booking.status === s || booking.status === "cancelled" || !!busy}
                  onClick={() => setStatus(s)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition disabled:cursor-not-allowed ${
                    booking.status === s ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink-soft hover:border-ink/30 disabled:opacity-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Stylist */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Stylist</h3>
            {booking.assignedStaff ? (
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
                <Avatar name={booking.assignedStaff.name} image={booking.assignedStaff.image} size="sm" />
                <span className="text-sm font-medium text-ink">{booking.assignedStaff.name}</span>
                <Badge tone="gold" className="ml-auto">Assigned</Badge>
              </div>
            ) : (
              <p className="mb-3 text-sm text-muted">No stylist assigned yet.</p>
            )}
            {booking.status !== "cancelled" && (
              <div className="flex gap-2">
                {staffLoading ? (
                  <Skeleton className="h-11 flex-1" />
                ) : (
                  <Select value={staffId} onChange={(e) => setStaffId(e.target.value)} aria-label="Choose stylist">
                    <option value="">
                      {staff.length ? (booking.assignedStaff ? "Reassign to…" : "Choose a stylist…") : "No stylists free at this time"}
                    </option>
                    {staff.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                        {s.specialization ? ` — ${s.specialization}` : ""}
                      </option>
                    ))}
                  </Select>
                )}
                <Button onClick={assign} disabled={!staffId} loading={busy === "assign"}>
                  <UserCheck className="h-4 w-4" /> Assign
                </Button>
              </div>
            )}
            {booking.timeSlot && <p className="mt-2 text-xs text-muted">Only stylists free at {formatSlot(booking.timeSlot)} on this day are listed.</p>}
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-line/70 bg-white p-4">
            <h3 className="mb-1 text-sm font-semibold text-ink">Payment</h3>
            <div className="divide-y divide-line/60">
              <Detail label="Service price">{formatCurrency(booking.price)}</Detail>
              {booking.couponCode && <Detail label="Coupon">{booking.couponCode}</Detail>}
              {booking.discount > 0 && <Detail label="Discount">− {formatCurrency(booking.discount)}</Detail>}
              <Detail label="Total">
                <span className="text-base">{formatCurrency(total)}</span>
              </Detail>
              <Detail label="Method">{booking.paymentMethod === "online" ? "Online (demo)" : "Pay at salon"}</Detail>
              {booking.paymentInstrument && <Detail label="Paid with">{booking.paymentInstrument}</Detail>}
              {booking.transactionId && <Detail label="Transaction ID">{booking.transactionId}</Detail>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {booking.paymentStatus !== "paid" && booking.paymentStatus !== "refunded" && (
                <Button size="sm" variant="gold" onClick={() => setPayment("paid")} loading={busy === "pay-paid"}>
                  Mark as paid
                </Button>
              )}
              {booking.paymentStatus === "paid" && (
                <Button size="sm" variant="outline" onClick={() => setPayment("refunded")} loading={busy === "pay-refunded"}>
                  Mark refunded
                </Button>
              )}
              {booking.paymentStatus !== "pending" && booking.paymentStatus !== "failed" && (
                <Button size="sm" variant="ghost" onClick={() => setPayment("pending")} loading={busy === "pay-pending"}>
                  Reset to pending
                </Button>
              )}
            </div>
          </section>

          <p className="text-xs text-muted">Booked {formatDateTime(booking.createdAt)} · ID {booking._id}</p>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={async () => {
          const ok = await setStatus("cancelled");
          if (ok) setConfirmCancel(false);
        }}
        loading={busy === "status-cancelled"}
        tone="danger"
        title="Cancel this booking?"
        description={`The customer will be emailed that their ${booking.service?.title || ""} appointment was cancelled.${
          booking.paymentStatus === "paid" ? " This booking was paid — remember to refund it." : ""
        }`}
        confirmLabel="Cancel booking"
      />
    </>
  );
}

export default function Appointments() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings((await getAppointments()) || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load appointments."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: bookings.length };
    STATUSES.forEach((s) => (c[s] = bookings.filter((b) => b.status === s).length));
    return c;
  }, [bookings]);

  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) => (status === "all" || b.status === status) && (!date || bookingDateKey(b.date) === date)
      ),
    [bookings, status, date]
  );

  const selected = bookings.find((b) => b._id === selectedId) || null;

  const onUpdated = (updated) => setBookings((list) => list.map((b) => (b._id === updated._id ? updated : b)));

  const columns = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        accessorFn: (b) => `${b.user?.username || ""} ${b.user?.email || ""}`,
        cell: ({ row }) => {
          const u = row.original.user;
          return (
            <div className="flex items-center gap-3">
              <Avatar name={u?.username} image={u?.image} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{u?.username || "Deleted user"}</p>
                <p className="truncate text-xs text-muted">{u?.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "service",
        header: "Service",
        accessorFn: (b) => b.service?.title || "",
        cell: ({ row }) => {
          const s = row.original.service;
          return (
            <div className="flex items-center gap-3">
              {imageUrl(s?.image) && <img src={imageUrl(s.image)} alt="" className="h-9 w-9 rounded-lg object-cover" />}
              <span className="font-medium text-ink">{s?.title || "—"}</span>
            </div>
          );
        },
      },
      {
        id: "when",
        header: "Date & time",
        accessorFn: (b) => `${bookingDateKey(b.date)} ${b.timeSlot || ""}`,
        cell: ({ row }) => (
          <div>
            <p className="flex items-center gap-1.5 text-ink">
              <CalendarDays className="h-3.5 w-3.5 text-muted" />
              {formatDate(row.original.date)}
            </p>
            {row.original.timeSlot && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <Clock className="h-3 w-3" />
                {formatSlot(row.original.timeSlot)}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "staff",
        header: "Stylist",
        accessorFn: (b) => b.assignedStaff?.name || "",
        cell: ({ getValue }) => getValue() || <span className="text-xs text-muted">Unassigned</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <Badge tone={STATUS_TONE[getValue()]} dot>{capitalize(getValue())}</Badge>,
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge tone={STATUS_TONE[row.original.paymentStatus]}>{capitalize(row.original.paymentStatus)}</Badge>
            <p className="text-xs text-muted">{row.original.paymentMethod === "online" ? "Online" : "At salon"}</p>
          </div>
        ),
      },
      {
        id: "total",
        header: "Total",
        accessorFn: (b) => b.finalPrice ?? b.price ?? 0,
        cell: ({ getValue }) => <span className="font-semibold text-ink">{formatCurrency(getValue())}</span>,
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Appointments" description="Confirm bookings, assign stylists and track payments." />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search customer, email or service…"
        onRowClick={(b) => setSelectedId(b._id)}
        initialSorting={[{ id: "when", desc: true }]}
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <FilterPills
              value={status}
              onChange={setStatus}
              options={[{ value: "all", label: "All", count: counts.all }, ...STATUSES.map((s) => ({ value: s, label: capitalize(s), count: counts[s] }))]}
            />
            <div className="flex items-center gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 w-44" aria-label="Filter by date" />
              {date && (
                <Button size="sm" variant="ghost" onClick={() => setDate("")}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        }
        emptyState={
          <EmptyState
            icon={CalendarDays}
            title={bookings.length ? "No matching appointments" : "No appointments yet"}
            description={bookings.length ? "Try a different status, date or search." : "New bookings from the website will appear here."}
          />
        }
      />

      {selected && <BookingDrawer booking={selected} onClose={() => setSelectedId(null)} onUpdated={onUpdated} />}
    </div>
  );
}
