import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Card, ConfirmDialog, Drawer, EmptyState, Field, Input, PageHeader, Skeleton, Textarea } from "../components/ui";
import { FilterPills, IconButton, ImageUpload, Switch } from "../components/ui/admin";
import { getErrorMessage, imageUrl } from "../lib/api";
import { createStaff, deleteStaff, getAllStaff, updateStaff } from "../apis/staffApi";

const EMPTY = { name: "", email: "", phone: "", experience: "", specialization: "", address: "", status: "active" };

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = "Enter a name";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (f.phone.trim().length < 7) e.phone = "Enter a valid phone number";
  if (!f.experience.trim()) e.experience = "e.g. 5 years";
  if (f.specialization.trim().length < 2) e.specialization = "Enter a specialization";
  if (f.address.trim().length < 2) e.address = "Enter an address";
  return e;
};

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setStaff(await getAllStaff());
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load staff"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({ all: staff.length, active: staff.filter((s) => s.status === "active").length, inactive: staff.filter((s) => s.status !== "active").length }),
    [staff]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter(
      (s) =>
        (status === "all" || (status === "active" ? s.status === "active" : s.status !== "active")) &&
        (!q || [s.name, s.email, s.phone, s.specialization].join(" ").toLowerCase().includes(q))
    );
  }, [staff, query, status]);

  const openForm = (member) => {
    setEditing(member || {});
    setForm(
      member
        ? {
            name: member.name || "",
            email: member.email || "",
            phone: member.phone || "",
            experience: member.experience || "",
            specialization: member.specialization || "",
            address: member.address || "",
            status: member.status || "active",
          }
        : EMPTY
    );
    setImage(null);
    setErrors({});
  };
  const closeForm = () => !saving && setEditing(null);

  const replace = (updated) => setStaff((list) => list.map((s) => (s._id === updated._id ? updated : s)));

  const save = async (e) => {
    e?.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
    if (image) payload.image = image;

    setSaving(true);
    try {
      if (editing?._id) {
        const { staff: updated } = await updateStaff(editing._id, payload);
        replace(updated);
        toast.success("Staff member updated");
      } else {
        const { staff: created } = await createStaff(payload);
        setStaff((list) => [created, ...list]);
        toast.success("Staff member added");
      }
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't save the staff member"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (member, active) => {
    setToggling(member._id);
    try {
      const { staff: updated } = await updateStaff(member._id, { status: active ? "active" : "inactive" });
      replace(updated);
      toast.success(`${member.name} is now ${active ? "active" : "inactive"}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't update status"));
    } finally {
      setToggling(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteStaff(toDelete._id);
      setStaff((list) => list.filter((s) => s._id !== toDelete._id));
      toast.success("Staff member removed");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't remove the staff member"));
    } finally {
      setDeleting(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Stylists who can be assigned to appointments and combo services."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        }
      />

      {!loading && staff.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff…" className="h-10" />
          </div>
          <FilterPills
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "inactive", label: "Inactive", count: counts.inactive },
            ]}
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={staff.length ? "No matching staff" : "No staff yet"}
          description={staff.length ? "Try a different search or filter." : "Add your stylists so you can assign them to bookings."}
          action={!staff.length && <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> Add staff</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <Card key={m._id} className="flex flex-col p-6">
              <div className="flex items-start gap-4">
                <Avatar name={m.name} image={m.image} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-display text-2xl leading-tight">{m.name}</h3>
                    <Badge tone={m.status === "active" ? "success" : "neutral"} dot>
                      {m.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-gold-dark">{m.specialization}</p>
                </div>
              </div>

              <ul className="mb-5 mt-5 space-y-2 text-sm text-ink-soft">
                <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0 text-muted" /> {m.experience} experience</li>
                <li className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-muted" /> <a href={`mailto:${m.email}`} className="truncate hover:text-ink">{m.email}</a></li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted" /> <a href={`tel:${m.phone}`} className="hover:text-ink">{m.phone}</a></li>
                <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> <span className="line-clamp-2">{m.address}</span></li>
              </ul>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <div className="flex-1">
                  <Switch
                    label="Active"
                    description="Can be assigned"
                    checked={m.status === "active"}
                    disabled={toggling === m._id}
                    onChange={(checked) => toggleStatus(m, checked)}
                  />
                </div>
                <div className="flex gap-1">
                  <IconButton icon={Pencil} label="Edit" onClick={() => openForm(m)} />
                  <IconButton icon={Trash2} label="Remove" tone="danger" onClick={() => setToDelete(m)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={closeForm}
        dismissible={!saving}
        title={editing?._id ? "Edit staff member" : "Add staff member"}
        description={editing?._id ? editing.name : "Active staff appear on the website's stylist section."}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing?._id ? "Save changes" : "Add staff member"}</Button>
          </div>
        }
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <ImageUpload value={imageUrl(editing?.image)} onChange={setImage} label="Photo" />
          <Field label="Full name" htmlFor="st-name" error={errors.name}>
            <Input id="st-name" value={form.name} onChange={set("name")} autoComplete="off" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" htmlFor="st-email" error={errors.email}>
              <Input id="st-email" type="email" value={form.email} onChange={set("email")} autoComplete="off" />
            </Field>
            <Field label="Phone" htmlFor="st-phone" error={errors.phone}>
              <Input id="st-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="off" />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Specialization" htmlFor="st-spec" error={errors.specialization}>
              <Input id="st-spec" value={form.specialization} onChange={set("specialization")} placeholder="Colour expert" />
            </Field>
            <Field label="Experience" htmlFor="st-exp" error={errors.experience}>
              <Input id="st-exp" value={form.experience} onChange={set("experience")} placeholder="5 years" />
            </Field>
          </div>
          <Field label="Address" htmlFor="st-address" error={errors.address}>
            <Textarea id="st-address" rows={2} value={form.address} onChange={set("address")} />
          </Field>
          <div className="rounded-2xl border border-line bg-white p-4">
            <Switch
              label="Active (can be assigned)"
              description="Inactive staff are hidden from assignment lists and the website. Availability per time slot is checked automatically."
              checked={form.status === "active"}
              onChange={(checked) => setForm((f) => ({ ...f, status: checked ? "active" : "inactive" }))}
            />
          </div>
          <button type="submit" className="hidden" />
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        tone="danger"
        title="Remove staff member?"
        description={`${toDelete?.name} will be removed permanently. To keep their history, set them to inactive instead.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
