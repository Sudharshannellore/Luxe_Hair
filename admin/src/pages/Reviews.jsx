import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquareText, Package, Scissors, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Card, ConfirmDialog, EmptyState, Input, PageHeader, Skeleton, Stars, Tabs } from "../components/ui";
import { FilterPills, IconButton, StatCard } from "../components/ui/admin";
import api, { getErrorMessage } from "../lib/api";
import { formatDateTime } from "../lib/format";

const normalise = (data) => [
  ...(data.serviceBookingReviews || []).map((r) => ({ ...r, type: "service", docId: r.bookingId, itemTitle: r.serviceTitle })),
  ...(data.packageOrderReviews || []).map((r) => ({ ...r, type: "package", docId: r.orderId, itemTitle: r.packageTitle })),
];

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("service");
  const [rating, setRating] = useState("all");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/review/all-reviews");
      setReviews(normalise(data));
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load reviews"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const five = reviews.filter((r) => r.rating === 5).length;
    return { total, avg, fiveShare: total ? (five / total) * 100 : 0 };
  }, [reviews]);

  const inTab = useMemo(() => reviews.filter((r) => r.type === tab), [reviews, tab]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inTab
      .filter((r) => rating === "all" || r.rating === Number(rating))
      .filter((r) => !q || [r.username, r.userEmail, r.comment, r.itemTitle].join(" ").toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [inTab, rating, query]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/review/${toDelete.type}/${toDelete.docId}/${toDelete.reviewId}`);
      setReviews((list) => list.filter((r) => r.reviewId !== toDelete.reviewId));
      toast.success("Review removed");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't remove the review"));
    } finally {
      setDeleting(false);
    }
  };

  const ratingOptions = [
    { value: "all", label: "All", count: inTab.length },
    ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}★`, count: inTab.filter((r) => r.rating === n).length })),
  ];

  return (
    <div>
      <PageHeader title="Reviews" description="What customers say after their appointments and combos." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Average rating" value={stats.total ? `${stats.avg.toFixed(1)} / 5` : "—"} icon={Star} loading={loading} />
        <StatCard label="Total reviews" value={stats.total} icon={MessageSquareText} loading={loading} />
        <StatCard label="5-star share" value={`${stats.fiveShare.toFixed(0)}%`} icon={Star} loading={loading} hint={stats.total ? "of all reviews" : undefined} />
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={tab}
          onChange={(v) => {
            setTab(v);
            setRating("all");
          }}
          tabs={[
            { value: "service", label: "Services", icon: Scissors, count: reviews.filter((r) => r.type === "service").length },
            { value: "package", label: "Combos", icon: Package, count: reviews.filter((r) => r.type === "package").length },
          ]}
        />
        <div className="w-full lg:max-w-xs">
          <Input icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reviews…" className="h-10" />
        </div>
      </div>

      <div className="mb-6">
        <FilterPills options={ratingOptions} value={rating} onChange={setRating} />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title={inTab.length ? "No matching reviews" : "No reviews yet"}
          description={inTab.length ? "Try a different rating or search." : "Reviews appear here once customers rate completed visits."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((r) => (
            <Card key={r.reviewId} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.username} image={r.userImage} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{r.username}</p>
                    {r.userEmail && <p className="truncate text-xs text-muted">{r.userEmail}</p>}
                  </div>
                </div>
                <IconButton icon={Trash2} label="Remove review" tone="danger" onClick={() => setToDelete(r)} />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Stars value={r.rating} />
                <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                {r.comment?.trim() ? `“${r.comment}”` : <span className="italic text-muted">No written comment</span>}
              </p>
              {r.itemTitle && (
                <div className="mt-4">
                  <Badge tone="gold">
                    {r.type === "service" ? <Scissors className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                    {r.itemTitle}
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        tone="danger"
        title="Remove this review?"
        description={`The ${toDelete?.rating}-star review by ${toDelete?.username} will be removed from the website. This can't be undone.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
