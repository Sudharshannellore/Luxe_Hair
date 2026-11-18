import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, CreditCard, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { formatCurrency } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Skeleton,
  Tabs,
  Textarea,
} from "../components/ui";
import { DataTable, FilterPills, IconButton, RowActions, Select, Switch } from "../components/ui/admin";

const COUPON_TONE = { ACTIVE: "success", EXPIRED: "neutral", DISABLED: "warning" };
const ELIGIBILITY = { ALL_USERS: "Everyone", NEW_USERS: "First booking only", INACTIVE_USERS: "Inactive 90+ days" };
const USAGE = { UNLIMITED: "Unlimited", ONCE_PER_USER: "Once per customer" };

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const shortDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

const discountSummary = (c) =>
  c.discountType === "PERCENTAGE"
    ? `${c.discountValue}% off${c.maxDiscount ? ` (max ${formatCurrency(c.maxDiscount)})` : ""}`
    : `${formatCurrency(c.discountValue)} off`;

// Effective status: an ACTIVE coupon past its end date is shown as expired.
const effectiveStatus = (c) => (c.status === "ACTIVE" && new Date(c.validityEnd) < new Date() ? "EXPIRED" : c.status);

/* ------------------------------------------------------------------ Payment methods */

function PaymentMethods() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState("");

  useEffect(() => {
    api
      .get("/payment/get/payment-method")
      .then(({ data }) => setSettings({ cod: !!data.payment?.cod, online: !!data.payment?.online }))
      .catch((err) => toast.error(getErrorMessage(err, "Couldn't load payment settings.")));
  }, []);

  const toggle = async (key, value) => {
    const previous = settings;
    if (!value && !(key === "cod" ? settings.online : settings.cod)) {
      toast.warning("Customers need at least one way to pay — the other method is off.");
    }
    setSettings({ ...settings, [key]: value }); // optimistic
    setSaving(key);
    try {
      await api.patch("/payment/update/payment-setting", { [key]: value });
      toast.success(`${key === "cod" ? "Pay at salon" : "Online payment"} ${value ? "enabled" : "disabled"}`);
    } catch (err) {
      setSettings(previous); // rollback
      toast.error(getErrorMessage(err, "Couldn't save the setting."));
    } finally {
      setSaving("");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="font-display text-2xl">Payment methods</h2>
      <p className="mt-1 text-sm text-muted">Choose how customers can pay when booking a service or buying a combo.</p>

      {!settings ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-line/70 rounded-2xl border border-line/70">
          <div className="flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-gold-dark">
              <Banknote className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <Switch
                label="Pay at salon"
                description="Customers pay in cash or card when they visit."
                checked={settings.cod}
                disabled={saving === "cod"}
                onChange={(v) => toggle("cod", v)}
              />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-gold-dark">
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <Switch
                  label="Online payment (demo checkout)"
                  description="Animated card / UPI checkout for showcasing. No real money is charged."
                  checked={settings.online}
                  disabled={saving === "online"}
                  onChange={(v) => toggle("online", v)}
                />
              </div>
            </div>
            {settings.online && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-amber-600/15">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Demo mode: bookings paid online are marked paid without a real transaction.</span>
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ Coupon form */

const EMPTY_COUPON = {
  offerName: "",
  description: "",
  couponCode: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscount: "",
  minOrderValue: "",
  validityStart: "",
  validityEnd: "",
  eligibility: "ALL_USERS",
  usageLimit: "UNLIMITED",
  status: "ACTIVE",
};

const validateCoupon = (f) => {
  const e = {};
  if (f.offerName.trim().length < 2) e.offerName = "Give the offer a name.";
  if (!/^[A-Z0-9_-]{3,20}$/.test(f.couponCode)) e.couponCode = "3–20 characters: letters, numbers, - or _.";
  const value = Number(f.discountValue);
  if (!(value > 0)) e.discountValue = "Enter a discount greater than 0.";
  else if (f.discountType === "PERCENTAGE" && value > 100) e.discountValue = "A percentage can't exceed 100.";
  if (f.maxDiscount !== "" && Number(f.maxDiscount) < 0) e.maxDiscount = "Can't be negative.";
  if (f.minOrderValue !== "" && Number(f.minOrderValue) < 0) e.minOrderValue = "Can't be negative.";
  if (!f.validityStart) e.validityStart = "Pick a start date.";
  if (!f.validityEnd) e.validityEnd = "Pick an end date.";
  else if (f.validityStart && f.validityEnd <= f.validityStart) e.validityEnd = "Must be after the start date.";
  return e;
};

function CouponDrawer({ coupon, onClose, onSaved }) {
  const editing = Boolean(coupon?._id);
  const [form, setForm] = useState(() =>
    editing
      ? {
          ...EMPTY_COUPON,
          ...coupon,
          description: coupon.description || "",
          discountValue: String(coupon.discountValue ?? ""),
          maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
          minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
          validityStart: toInputDate(coupon.validityStart),
          validityEnd: toInputDate(coupon.validityEnd),
        }
      : { ...EMPTY_COUPON, validityStart: today(), validityEnd: plusDays(30) }
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const value = key === "couponCode" ? e.target.value.toUpperCase().replace(/\s/g, "") : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateCoupon(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      offerName: form.offerName.trim(),
      description: form.description.trim(),
      couponCode: form.couponCode,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.discountType === "PERCENTAGE" && form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
      minOrderValue: form.minOrderValue !== "" ? Number(form.minOrderValue) : 0,
      validityStart: new Date(`${form.validityStart}T00:00:00`).toISOString(),
      validityEnd: new Date(`${form.validityEnd}T23:59:59`).toISOString(),
      eligibility: form.eligibility,
      usageLimit: form.usageLimit,
      status: form.status,
    };

    setSaving(true);
    try {
      const { data } = editing ? await api.put(`/coupon/update/${coupon._id}`, payload) : await api.post("/coupon/save", payload);
      toast.success(editing ? "Coupon updated" : "Coupon created");
      onSaved(data.coupon, editing);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't save the coupon."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={editing ? "Edit coupon" : "New coupon"}
      description="Customers apply coupons while booking. Discounts are always checked on the server."
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="coupon-form" loading={saving}>{editing ? "Save changes" : "Create coupon"}</Button>
        </div>
      }
    >
      <form id="coupon-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Offer name" htmlFor="offerName" error={errors.offerName}>
          <Input id="offerName" value={form.offerName} onChange={set("offerName")} placeholder="Welcome offer" autoFocus />
        </Field>
        <Field label="Description" htmlFor="description" hint="Shown to customers on the Offers page.">
          <Textarea id="description" rows={2} value={form.description} onChange={set("description")} placeholder="10% off your first visit" maxLength={300} />
        </Field>
        <Field label="Coupon code" htmlFor="couponCode" error={errors.couponCode}>
          <Input id="couponCode" value={form.couponCode} onChange={set("couponCode")} placeholder="WELCOME10" className="font-mono tracking-wider" maxLength={20} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Discount type" htmlFor="discountType">
            <Select id="discountType" value={form.discountType} onChange={set("discountType")}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat amount (₹)</option>
            </Select>
          </Field>
          <Field label={form.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (₹)"} htmlFor="discountValue" error={errors.discountValue}>
            <Input id="discountValue" type="number" min="0" step="any" value={form.discountValue} onChange={set("discountValue")} />
          </Field>
          {form.discountType === "PERCENTAGE" && (
            <Field label="Max discount (₹)" htmlFor="maxDiscount" hint="Optional cap" error={errors.maxDiscount}>
              <Input id="maxDiscount" type="number" min="0" value={form.maxDiscount} onChange={set("maxDiscount")} />
            </Field>
          )}
          <Field label="Minimum order (₹)" htmlFor="minOrderValue" hint="Optional" error={errors.minOrderValue}>
            <Input id="minOrderValue" type="number" min="0" value={form.minOrderValue} onChange={set("minOrderValue")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Valid from" htmlFor="validityStart" error={errors.validityStart}>
            <Input id="validityStart" type="date" value={form.validityStart} onChange={set("validityStart")} />
          </Field>
          <Field label="Valid until" htmlFor="validityEnd" error={errors.validityEnd}>
            <Input id="validityEnd" type="date" value={form.validityEnd} onChange={set("validityEnd")} min={form.validityStart || undefined} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Who can use it" htmlFor="eligibility">
            <Select id="eligibility" value={form.eligibility} onChange={set("eligibility")}>
              {Object.entries(ELIGIBILITY).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Usage limit" htmlFor="usageLimit">
            <Select id="usageLimit" value={form.usageLimit} onChange={set("usageLimit")}>
              {Object.entries(USAGE).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Status" htmlFor="status">
          <Select id="status" value={form.status} onChange={set("status")}>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="EXPIRED">Expired</option>
          </Select>
        </Field>
      </form>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ Coupons */

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null); // coupon object or {} for new
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons((await api.get("/coupon/get-all")).data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load coupons."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = useCallback(async (coupon) => {
    const next = effectiveStatus(coupon) === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (next === "ACTIVE" && new Date(coupon.validityEnd) < new Date()) {
      toast.error("This coupon has ended. Edit its end date to re-activate it.");
      return;
    }
    setToggling(coupon._id);
    try {
      const { data } = await api.put(`/coupon/update/${coupon._id}`, { status: next });
      setCoupons((list) => list.map((c) => (c._id === coupon._id ? data.coupon : c)));
      toast.success(next === "ACTIVE" ? `${coupon.couponCode} enabled` : `${coupon.couponCode} disabled`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  }, []);

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/coupon/delete/${deleting._id}`);
      setCoupons((list) => list.filter((c) => c._id !== deleting._id));
      toast.success("Coupon deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const options = useMemo(() => {
    const count = (s) => coupons.filter((c) => effectiveStatus(c) === s).length;
    return [
      { value: "all", label: "All", count: coupons.length },
      { value: "ACTIVE", label: "Active", count: count("ACTIVE") },
      { value: "DISABLED", label: "Disabled", count: count("DISABLED") },
      { value: "EXPIRED", label: "Expired", count: count("EXPIRED") },
    ];
  }, [coupons]);

  const filtered = useMemo(() => coupons.filter((c) => filter === "all" || effectiveStatus(c) === filter), [coupons, filter]);

  const columns = useMemo(
    () => [
      {
        id: "offer",
        header: "Offer",
        accessorFn: (c) => `${c.offerName} ${c.couponCode}`,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-ink">{row.original.offerName}</p>
            <code className="mt-1 inline-block rounded-md bg-sand px-2 py-0.5 font-mono text-xs tracking-wider text-gold-dark">{row.original.couponCode}</code>
          </div>
        ),
      },
      {
        id: "discount",
        header: "Discount",
        accessorFn: (c) => c.discountValue,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-ink">{discountSummary(row.original)}</p>
            {row.original.minOrderValue > 0 && <p className="text-xs text-muted">Min. order {formatCurrency(row.original.minOrderValue)}</p>}
          </div>
        ),
      },
      {
        id: "validity",
        header: "Valid",
        accessorFn: (c) => new Date(c.validityEnd).getTime(),
        cell: ({ row }) => (
          <span className="text-sm">
            {shortDate(row.original.validityStart)} – {shortDate(row.original.validityEnd)}
          </span>
        ),
      },
      {
        id: "rules",
        header: "Rules",
        enableSorting: false,
        accessorFn: (c) => `${ELIGIBILITY[c.eligibility]} ${USAGE[c.usageLimit]}`,
        cell: ({ row }) => (
          <div className="text-xs leading-relaxed text-muted">
            <p>{ELIGIBILITY[row.original.eligibility] || "Everyone"}</p>
            <p>{USAGE[row.original.usageLimit] || "Unlimited"}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (c) => effectiveStatus(c),
        cell: ({ getValue }) => (
          <Badge tone={COUPON_TONE[getValue()]} dot>
            {getValue().charAt(0) + getValue().slice(1).toLowerCase()}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          const status = effectiveStatus(c);
          return (
            <RowActions>
              {status !== "EXPIRED" && (
                <Button size="sm" variant="ghost" loading={toggling === c._id} onClick={() => toggleStatus(c)}>
                  {status === "ACTIVE" ? "Disable" : "Enable"}
                </Button>
              )}
              <IconButton icon={Pencil} label="Edit coupon" onClick={() => setEditing(c)} />
              <IconButton icon={Trash2} label="Delete coupon" tone="danger" onClick={() => setDeleting(c)} />
            </RowActions>
          );
        },
      },
    ],
    [toggling, toggleStatus]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">Offers & coupons</h2>
          <p className="mt-1 text-sm text-muted">Active coupons appear on the website's Offers page and at checkout.</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search offers or codes…"
        onRowClick={(c) => setEditing(c)}
        toolbar={<FilterPills value={filter} onChange={setFilter} options={options} />}
        emptyState={
          <EmptyState
            icon={TicketPercent}
            title={coupons.length ? "No coupons match" : "No coupons yet"}
            description={coupons.length ? "Try another filter or search." : "Create a welcome offer to reward first-time customers."}
            action={!coupons.length && <Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New coupon</Button>}
          />
        }
      />

      {editing && (
        <CouponDrawer
          coupon={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, wasEdit) => {
            setCoupons((list) => (wasEdit ? list.map((c) => (c._id === saved._id ? saved : c)) : [saved, ...list]));
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={deleteBusy}
        tone="danger"
        title="Delete this coupon?"
        description={`${deleting?.couponCode || ""} will stop working immediately. Past bookings that used it are not affected. Consider disabling it instead if you may reuse it.`}
        confirmLabel="Delete coupon"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Page */

export default function Settings() {
  const [tab, setTab] = useState("coupons");

  return (
    <div>
      <PageHeader title="Offers & payments" description="Manage discount coupons and how customers pay." />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "coupons", label: "Offers & coupons", icon: TicketPercent },
          { value: "payments", label: "Payment methods", icon: CreditCard },
        ]}
      />
      {tab === "coupons" ? <Coupons /> : <PaymentMethods />}
    </div>
  );
}
