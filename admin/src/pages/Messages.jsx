import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Mail, MailOpen, Phone, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { Avatar, Button, Card, ConfirmDialog, Drawer, EmptyState, Input, PageHeader, Skeleton, cx } from "../components/ui";
import { FilterPills } from "../components/ui/admin";

const relative = (value) => {
  const diff = (Date.now() - new Date(value)) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

function MessageDetail({ message, onDelete, onToggleRead }) {
  const subject = encodeURIComponent("Re: your message to Luxe Hair");
  const body = encodeURIComponent(`Hi ${message.fullname},\n\n\n\n— Luxe Hair\n\n> ${message.message.replace(/\n/g, "\n> ")}`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-line/70 pb-5">
        <div className="flex items-center gap-3">
          <Avatar name={message.fullname} size="lg" />
          <div className="min-w-0">
            <p className="font-display text-2xl text-ink">{message.fullname}</p>
            <p className="truncate text-sm text-muted">{message.email}</p>
            <p className="text-xs text-muted">{formatDateTime(message.createdAt)}</p>
          </div>
        </div>
      </div>

      <p className="flex-1 whitespace-pre-wrap py-6 text-[15px] leading-relaxed text-ink-soft">{message.message}</p>

      <div className="flex flex-wrap gap-2 border-t border-line/70 pt-5">
        <Button variant="primary" href={`mailto:${message.email}?subject=${subject}&body=${body}`}>
          <Mail className="h-4 w-4" /> Reply by email
        </Button>
        {message.phone && (
          <Button variant="outline" href={`tel:${message.phone}`}>
            <Phone className="h-4 w-4" /> {message.phone}
          </Button>
        )}
        <Button variant="ghost" onClick={() => onToggleRead(message)}>
          <MailOpen className="h-4 w-4" /> Mark {message.read ? "unread" : "read"}
        </Button>
        <Button variant="ghost" className="!text-danger sm:ml-auto" onClick={() => onDelete(message)}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
}

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 1023px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMessages((await api.get("/message/get")).data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load messages."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRead = useCallback(async (message, read) => {
    setMessages((list) => list.map((m) => (m._id === message._id ? { ...m, read } : m)));
    try {
      await api.patch(`/message/read/${message._id}`, { read });
    } catch (err) {
      setMessages((list) => list.map((m) => (m._id === message._id ? { ...m, read: message.read } : m)));
      toast.error(getErrorMessage(err));
    }
  }, []);

  const open = (message) => {
    setSelectedId(message._id);
    if (!message.read) setRead(message, true);
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/message/delete/${deleting._id}`);
      setMessages((list) => list.filter((m) => m._id !== deleting._id));
      if (selectedId === deleting._id) setSelectedId(null);
      toast.success("Message deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const unread = messages.filter((m) => !m.read).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter(
      (m) =>
        (filter === "all" || !m.read) &&
        (!q || [m.fullname, m.email, m.phone, m.message].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [messages, query, filter]);

  const selected = messages.find((m) => m._id === selectedId) || null;
  const detailProps = selected && {
    message: selected,
    onDelete: setDeleting,
    onToggleRead: (m) => setRead(m, !m.read),
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        description={loading ? "Enquiries from the contact form" : `${messages.length} message${messages.length === 1 ? "" : "s"} · ${unread} unread`}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* List */}
        <Card className="flex flex-col overflow-hidden lg:h-[calc(100vh-220px)]">
          <div className="space-y-3 border-b border-line/70 p-4">
            <Input icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages…" className="h-10" />
            <FilterPills
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: messages.length },
                { value: "unread", label: "Unread", count: unread },
              ]}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Inbox}
                  title={messages.length ? "Nothing here" : "Inbox is empty"}
                  description={messages.length ? "No messages match this filter." : "Messages from the website's contact form will appear here."}
                  className="border-none bg-transparent"
                />
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {filtered.map((m) => (
                  <li key={m._id}>
                    <button
                      onClick={() => open(m)}
                      className={cx(
                        "flex w-full gap-3 px-4 py-3.5 text-left transition",
                        selectedId === m._id ? "bg-sand" : "hover:bg-cream"
                      )}
                    >
                      <div className="relative">
                        <Avatar name={m.fullname} size="md" />
                        {!m.read && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-gold ring-2 ring-white" aria-label="Unread" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cx("truncate text-sm", m.read ? "text-ink-soft" : "font-semibold text-ink")}>{m.fullname}</p>
                          <span className="shrink-0 text-xs text-muted">{relative(m.createdAt)}</span>
                        </div>
                        <p className={cx("mt-0.5 line-clamp-2 text-xs", m.read ? "text-muted" : "text-ink-soft")}>{m.message}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Detail (desktop) */}
        {!isMobile && (
          <Card className="p-6 lg:h-[calc(100vh-220px)] lg:overflow-y-auto">
            {selected ? (
              <MessageDetail {...detailProps} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState icon={Mail} title="Select a message" description="Choose a message from the list to read and reply." className="border-none bg-transparent" />
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Detail (mobile) */}
      {isMobile && selected && (
        <Drawer open onClose={() => setSelectedId(null)} title="Message">
          <MessageDetail {...detailProps} />
        </Drawer>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={deleteBusy}
        tone="danger"
        title="Delete this message?"
        description={`The message from ${deleting?.fullname || "this person"} will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
