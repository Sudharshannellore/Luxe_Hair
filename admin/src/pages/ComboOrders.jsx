import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, Package, Phone, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { assignStaffToService, fetchOrdersApi, markServiceUsedApi, updatePaymentStatus } from "../apis/orderApi";
import { getAvailableStaff } from "../apis/appointmentApi";
import { getErrorMessage, imageUrl } from "../lib/api";
import { capitalize, daysUntil, formatCurrency, formatDateTime } from "../lib/format";
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, PageHeader, STATUS_TONE, cx } from "../components/ui";
import { DataTable, FilterPills, Select } from "../components/ui/admin";

// Order dates are real timestamps (not UTC-midnight booking days), so format in local time.
const formatDay = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

const progressOf = (o) => {
  const total = o.servicesUsed?.length || 0;
  const used = (o.servicesUsed || []).filter((s) => s.used).length;
  return { used, total, pct: total ? Math.round((used / total) * 100) : 0 };
};

const Progress = ({ used, total, pct }) => (
  <div className="min-w-[120px]">
    <div className="mb-1 flex justify-between text-xs text-muted">
      <span>
        {used}/{total} used
      </span>
      <span>{pct}%</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-sand">
      <div className={cx("h-full rounded-full", pct === 100 ? "bg-success" : "bg-gold")} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

function ServiceRow({ order, service, staff, onUpdated }) {
  const [staffId, setStaffId] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmUse, setConfirmUse] = useState(false);
  const locked = order.status !== "active";

  const run = async (key, fn) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res?.order) onUpdated(res.order);
      toast.success(res?.message || "Updated");
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setBusy("");
    }
  };

  return (
    <li className={cx("rounded-2xl border p-4", service.used ? "border-line/50 bg-cream/60" : "border-line/70 bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cx("font-medium", service.used ? "text-muted line-through" : "text-ink")}>{service.serviceName}</p>
          <p className="mt-0.5 text-xs text-muted">
            {service.used
              ? `Used ${formatDateTime(service.usedAt)}`
              : service.assignedStaff
                ? `Stylist: ${service.assignedStaff.name}`
                : "Not used yet"}
          </p>
        </div>
        {service.used ? (
          <Badge tone="success">
            <CheckCircle2 className="h-3 w-3" /> Used
          </Badge>
        ) : (
          <Button size="sm" variant="gold" disabled={locked} loading={busy === "use"} onClick={() => setConfirmUse(true)}>
            Mark used
          </Button>
        )}
      </div>

      {!service.used && !locked && (
        <div className="mt-3 flex gap-2">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="h-9 text-xs" aria-label={`Stylist for ${service.serviceName}`}>
            <option value="">{service.assignedStaff ? "Reassign stylist…" : "Assign a stylist…"}</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={!staffId}
            loading={busy === "assign"}
            onClick={async () => {
              if (await run("assign", () => assignStaffToService(order._id, service.serviceName, staffId))) setStaffId("");
            }}
          >
            <UserCheck className="h-3.5 w-3.5" /> Assign
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmUse}
        onClose={() => setConfirmUse(false)}
        onConfirm={async () => {
          if (await run("use", () => markServiceUsedApi(order._id, service.serviceName))) setConfirmUse(false);
        }}
        loading={busy === "use"}
        title={`Redeem ${service.serviceName}?`}
        description="This marks the service as used in the customer's combo and emails them a confirmation. It can't be undone."
        confirmLabel="Mark as used"
      />
    </li>
  );
}

function OrderDrawer({ order, staff, onClose, onUpdated }) {
  const [busy, setBusy] = useState("");
  const progress = progressOf(order);
  const left = daysUntil(order.expiryDate);

  const setPayment = async (paymentStatus) => {
    setBusy(paymentStatus);
    try {
      const res = await updatePaymentStatus(order._id, paymentStatus);
      if (res?.order) onUpdated(res.order);
      toast.success(res?.message || "Payment updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const price = order.price ?? order.package?.price ?? 0;

  return (
    <Drawer open onClose={onClose} title={order.package?.title || "Combo order"} description={`Purchased ${formatDay(order.orderDate || order.createdAt)}`}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[order.status]} dot>{capitalize(order.status)}</Badge>
          <Badge tone={STATUS_TONE[order.paymentStatus]}>
            {capitalize(order.paymentStatus)} · {order.paymentMethod === "online" ? "Online" : "Pay at salon"}
          </Badge>
          {order.status === "active" && (
            <Badge tone={left <= 7 ? "warning" : "neutral"}>{left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : "Expires today"}</Badge>
          )}
        </div>

        <section className="rounded-2xl border border-line/70 bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar name={order.user?.username} image={order.user?.image} />
            <div className="min-w-0">
              <p className="font-medium text-ink">{order.user?.username || "Deleted user"}</p>
              <p className="truncate text-xs text-muted">{order.user?.email}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {order.user?.email && (
              <Button size="sm" variant="outline" href={`mailto:${order.user.email}`}>
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
            )}
            {order.user?.phone && (
              <Button size="sm" variant="outline" href={`tel:${order.user.phone}`}>
                <Phone className="h-3.5 w-3.5" /> {order.user.phone}
              </Button>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-ink">Included services</h3>
            <div className="w-40">
              <Progress {...progress} />
            </div>
          </div>
          {order.status !== "active" && (
            <p className="mb-3 rounded-xl bg-sand px-3 py-2 text-xs text-ink-soft">
              This combo is {order.status}; services can no longer be redeemed.
            </p>
          )}
          {order.servicesUsed?.length ? (
            <ul className="space-y-3">
              {order.servicesUsed.map((s) => (
                <ServiceRow key={s._id || s.serviceName} order={order} service={s} staff={staff} onUpdated={onUpdated} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">This combo has no services listed.</p>
          )}
        </section>

        <section className="rounded-2xl border border-line/70 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Payment</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Combo price</dt>
              <dd>{formatCurrency(price)}</dd>
            </div>
            {order.couponCode && (
              <div className="flex justify-between text-muted">
                <dt>Coupon</dt>
                <dd>{order.couponCode}</dd>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>− {formatCurrency(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatCurrency(order.finalPrice ?? price)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {!["paid", "refunded"].includes(order.paymentStatus) && (
              <Button size="sm" variant="gold" onClick={() => setPayment("paid")} loading={busy === "paid"}>
                Mark as paid
              </Button>
            )}
            {order.paymentStatus === "paid" && (
              <Button size="sm" variant="outline" onClick={() => setPayment("refunded")} loading={busy === "refunded"}>
                Mark refunded
              </Button>
            )}
            {["paid", "refunded"].includes(order.paymentStatus) && (
              <Button size="sm" variant="ghost" onClick={() => setPayment("pending")} loading={busy === "pending"}>
                Reset to pending
              </Button>
            )}
          </div>
        </section>

        <p className="text-xs text-muted">
          Expires {formatDay(order.expiryDate)} · ID {order._id}
        </p>
      </div>
    </Drawer>
  );
}

export default function ComboOrders() {
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([fetchOrdersApi(), getAvailableStaff().catch(() => [])]);
      setOrders(o || []);
      setStaff(s || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load combo orders."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const matches = useCallback(
    (o, f) =>
      f === "all" ||
      (f === "unpaid" ? o.paymentStatus === "pending" && o.status !== "cancelled" : o.status === f),
    []
  );

  const options = useMemo(
    () =>
      [
        ["all", "All"],
        ["active", "Active"],
        ["expired", "Expired"],
        ["cancelled", "Cancelled"],
        ["unpaid", "Unpaid"],
      ].map(([value, label]) => ({ value, label, count: orders.filter((o) => matches(o, value)).length })),
    [orders, matches]
  );

  const filtered = useMemo(() => orders.filter((o) => matches(o, filter)), [orders, filter, matches]);
  const selected = orders.find((o) => o._id === selectedId) || null;

  // The API returns the populated order; keep the computed status if it's missing.
  const onUpdated = (updated) =>
    setOrders((list) => list.map((o) => (o._id === updated._id ? { ...o, ...updated, status: o.status === "expired" ? "expired" : updated.status } : o)));

  const columns = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        accessorFn: (o) => `${o.user?.username || ""} ${o.user?.email || ""}`,
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
        id: "combo",
        header: "Combo",
        accessorFn: (o) => o.package?.title || "",
        cell: ({ row }) => {
          const p = row.original.package;
          return (
            <div className="flex items-center gap-3">
              {imageUrl(p?.image) ? (
                <img src={imageUrl(p.image)} alt="" className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand text-gold-dark">
                  <Package className="h-4 w-4" />
                </span>
              )}
              <span className="font-medium text-ink">{p?.title || "—"}</span>
            </div>
          );
        },
      },
      {
        id: "purchased",
        header: "Purchased",
        accessorFn: (o) => new Date(o.orderDate || o.createdAt).getTime(),
        cell: ({ row }) => formatDay(row.original.orderDate || row.original.createdAt),
      },
      {
        id: "expires",
        header: "Expires",
        accessorFn: (o) => new Date(o.expiryDate).getTime(),
        cell: ({ row }) => {
          const o = row.original;
          const left = daysUntil(o.expiryDate);
          return (
            <div>
              <p>{formatDay(o.expiryDate)}</p>
              {o.status === "active" && left <= 7 && <p className="text-xs text-warning">{left > 0 ? `${left}d left` : "Today"}</p>}
            </div>
          );
        },
      },
      {
        id: "progress",
        header: "Usage",
        accessorFn: (o) => progressOf(o).pct,
        cell: ({ row }) => <Progress {...progressOf(row.original)} />,
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
        accessorFn: (o) => o.finalPrice ?? o.price ?? o.package?.price ?? 0,
        cell: ({ getValue }) => <span className="font-semibold text-ink">{formatCurrency(getValue())}</span>,
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Combo orders" description="Track combo purchases, redeem services and manage payments." />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search customer or combo…"
        onRowClick={(o) => setSelectedId(o._id)}
        initialSorting={[{ id: "purchased", desc: true }]}
        toolbar={<FilterPills value={filter} onChange={setFilter} options={options} />}
        emptyState={
          <EmptyState
            icon={Package}
            title={orders.length ? "No matching orders" : "No combo orders yet"}
            description={orders.length ? "Try another filter or search." : "Combo purchases from the website will appear here."}
          />
        }
      />

      {selected && <OrderDrawer order={selected} staff={staff} onClose={() => setSelectedId(null)} onUpdated={onUpdated} />}
    </div>
  );
}
