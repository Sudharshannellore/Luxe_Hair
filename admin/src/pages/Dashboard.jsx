import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, CalendarDays, Clock, IndianRupee, Package, RefreshCw, TrendingUp, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { formatCurrency, formatSlot } from "../lib/format";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton, STATUS_TONE, cx } from "../components/ui";
import { Select, StatCard } from "../components/ui/admin";

const REFRESH_MS = 60000;

const STATUS_COLORS = {
  pending: "#d4a24c",
  confirmed: "#5b8db8",
  completed: "#3f7d58",
  cancelled: "#b4483c",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const compactCurrency = (v) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${v}`;

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3 text-xs shadow-lift">
      <p className="mb-2 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-6 text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-ink">{formatCurrency(p.value)}</span>
        </p>
      ))}
      <p className="mt-2 flex justify-between border-t border-line pt-2 font-semibold text-ink">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </p>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get("/dashboard/get");
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, "Couldn't load the dashboard."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load({ silent: true });
    const id = setInterval(() => load({ silent: true }), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const loading = !stats;

  const years = useMemo(() => {
    const set = new Set((stats?.monthlyRevenue || []).map((r) => r.year));
    set.add(new Date().getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [stats]);

  const chartData = useMemo(
    () =>
      MONTHS.map((month, i) => {
        const row = (stats?.monthlyRevenue || []).find((r) => r.year === year && r.month === i + 1);
        return { month, services: row?.services || 0, combos: row?.combos || 0 };
      }),
    [stats, year]
  );
  const yearTotal = chartData.reduce((s, r) => s + r.services + r.combos, 0);

  const statusData = useMemo(
    () =>
      Object.entries(STATUS_COLORS)
        .map(([status, color]) => ({ status, color, value: stats?.statusBreakdown?.[status] || 0 }))
        .filter((d) => d.value > 0),
    [stats]
  );
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);

  const change =
    stats && stats.previousMonthRevenue > 0
      ? ((stats.thisMonthRevenue - stats.previousMonthRevenue) / stats.previousMonthRevenue) * 100
      : null;

  const today = useMemo(
    () => [...(stats?.todayServiceBookings || [])].sort((a, b) => (a.timeSlot || "").localeCompare(b.timeSlot || "")),
    [stats]
  );
  const maxTop = Math.max(1, ...(stats?.topServices || []).map((s) => s.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          lastUpdated
            ? `Live overview · updated ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : "Live overview of bookings and revenue"
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => load()} loading={refreshing}>
            {!refreshing && <RefreshCw className="h-4 w-4" />} Refresh
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Revenue this month"
          value={formatCurrency(stats?.thisMonthRevenue)}
          icon={IndianRupee}
          change={change}
          hint={change === null ? "No revenue last month to compare" : "vs last month"}
          loading={loading}
        />
        <StatCard label="Total revenue" value={formatCurrency(stats?.totalRevenue)} icon={TrendingUp} hint="All paid bookings & combos" loading={loading} />
        <StatCard label="Pending payments" value={stats?.pendingPayments ?? 0} icon={Wallet} hint="Active bookings not yet paid" loading={loading} />
        <StatCard label="Service bookings" value={stats?.totalServiceBookings ?? 0} icon={CalendarDays} hint="All time" loading={loading} />
        <StatCard label="Combo orders" value={stats?.totalPackageOrders ?? 0} icon={Package} hint="All time" loading={loading} />
        <StatCard label="Customers" value={stats?.totalCustomers ?? 0} icon={Users} hint="Registered accounts" loading={loading} />
      </div>

      {/* Revenue chart + status donut */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Revenue</h2>
              <p className="mt-1 text-sm text-muted">
                {loading ? "Loading…" : `${formatCurrency(yearTotal)} collected in ${year}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-4 text-xs text-muted sm:flex">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gold" /> Services</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" /> Combos</span>
              </div>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-28" aria-label="Year">
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gServices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b08d57" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#b08d57" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gCombos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1c1917" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1c1917" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#efe8dd" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#78716c", fontSize: 12 }} tickFormatter={compactCurrency} width={56} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e7e0d5" }} />
                  <Area type="monotone" dataKey="services" name="Services" stackId="1" stroke="#b08d57" strokeWidth={2.5} fill="url(#gServices)" />
                  <Area type="monotone" dataKey="combos" name="Combos" stackId="1" stroke="#1c1917" strokeWidth={2} fill="url(#gCombos)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <h2 className="font-display text-2xl">Booking status</h2>
          <p className="mt-1 text-sm text-muted">All service bookings</p>
          {loading ? (
            <Skeleton className="mx-auto mt-6 h-48 w-48 rounded-full" />
          ) : statusTotal === 0 ? (
            <p className="mt-10 text-center text-sm text-muted">No bookings yet.</p>
          ) : (
            <>
              <div className="relative mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="status" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
                      {statusData.map((d) => (
                        <Cell key={d.status} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-semibold text-ink">{statusTotal}</span>
                  <span className="text-xs text-muted">bookings</span>
                </div>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {statusData.map((d) => (
                  <li key={d.status} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2">
                    <span className="flex items-center gap-2 capitalize text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.status}
                    </span>
                    <span className="font-semibold text-ink">{d.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Today + top services */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Today's schedule</h2>
              <p className="mt-1 text-sm text-muted">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/appointments")}>
              All appointments <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : today.length === 0 ? (
            <EmptyState icon={CalendarDays} title="A quiet day" description="No appointments are booked for today." />
          ) : (
            <ol className="relative space-y-4 border-l border-line pl-6">
              {today.map((b) => (
                <li key={b._id} className="relative">
                  <span
                    className={cx(
                      "absolute -left-[31px] top-4 h-3 w-3 rounded-full ring-4 ring-white",
                      b.status === "completed" ? "bg-success" : b.status === "confirmed" ? "bg-sky-500" : "bg-gold"
                    )}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-cream/50 px-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="flex min-w-[76px] items-center gap-1.5 text-sm font-semibold text-ink">
                        <Clock className="h-3.5 w-3.5 text-gold" />
                        {b.timeSlot ? formatSlot(b.timeSlot) : "—"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{b.service?.title || "Service"}</p>
                        <p className="text-xs text-muted">
                          {b.user?.username || "Customer"}
                          {b.user?.phone ? ` · ${b.user.phone}` : ""}
                          {b.assignedStaff?.name ? ` · with ${b.assignedStaff.name}` : " · no stylist yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={STATUS_TONE[b.status]} className="capitalize">{b.status}</Badge>
                      <Badge tone={STATUS_TONE[b.paymentStatus]} className="capitalize">{b.paymentStatus}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-2xl">Top services</h2>
          <p className="mt-1 text-sm text-muted">By number of bookings</p>
          {loading ? (
            <div className="mt-6 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !stats.topServices?.length ? (
            <p className="mt-10 text-center text-sm text-muted">No bookings yet.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {stats.topServices.map((s, i) => (
                <li key={s.serviceId || s.title}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink">
                      <span className="mr-2 text-muted">{i + 1}.</span>
                      {s.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {s.count} · {formatCurrency(s.revenue)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(s.count / maxTop) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {stats?.unreadMessages > 0 && (
            <button
              onClick={() => navigate("/message")}
              className="mt-8 flex w-full items-center justify-between rounded-2xl bg-ink px-4 py-3 text-left text-sm text-cream transition hover:bg-ink-soft"
            >
              <span>
                <span className="font-semibold">{stats.unreadMessages}</span> unread message{stats.unreadMessages > 1 ? "s" : ""}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
