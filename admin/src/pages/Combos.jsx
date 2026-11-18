import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, ConfirmDialog, Drawer, EmptyState, Field, Input, PageHeader, Skeleton } from "../components/ui";
import { IconButton, ImageUpload, TagInput } from "../components/ui/admin";
import { getErrorMessage, imageUrl } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { createPackageApi, deletePackageApi, fetchPackagesApi, updatePackageApi } from "../apis/packageApi";
import { fetchServicesApi } from "../apis/serviceApi";

const EMPTY = { title: "", subtitle: "", price: "", validityDays: 30, services: [], features: [] };

const validate = (f) => {
  const e = {};
  if (f.title.trim().length < 2) e.title = "Enter a title";
  if (f.subtitle.trim().length < 2) e.subtitle = "Enter a short subtitle";
  if (f.price === "" || Number(f.price) < 0 || Number.isNaN(Number(f.price))) e.price = "Enter a valid price";
  const days = Number(f.validityDays);
  if (!Number.isInteger(days) || days < 1 || days > 365) e.validityDays = "Between 1 and 365 days";
  if (!f.services.length) e.services = "Add at least one service";
  return e;
};

export default function Combos() {
  const [combos, setCombos] = useState([]);
  const [serviceNames, setServiceNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pkgs, services] = await Promise.all([fetchPackagesApi(), fetchServicesApi().catch(() => [])]);
      setCombos(pkgs);
      setServiceNames([...new Set(services.map((s) => s.title))]);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load combos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return combos;
    return combos.filter((c) => [c.title, c.subtitle, ...(c.services || [])].join(" ").toLowerCase().includes(q));
  }, [combos, query]);

  const openForm = (combo) => {
    setEditing(combo || {});
    setForm(
      combo
        ? {
            title: combo.title || "",
            subtitle: combo.subtitle || "",
            price: combo.price ?? "",
            validityDays: combo.validityDays ?? 30,
            services: combo.services || [],
            features: combo.features || [],
          }
        : EMPTY
    );
    setImage(null);
    setErrors({});
  };
  const closeForm = () => !saving && setEditing(null);

  const save = async (e) => {
    e?.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("subtitle", form.subtitle.trim());
    fd.append("price", String(form.price));
    fd.append("validityDays", String(form.validityDays));
    fd.append("services", JSON.stringify(form.services));
    fd.append("features", JSON.stringify(form.features));
    if (image) fd.append("image", image);

    setSaving(true);
    try {
      if (editing?._id) {
        const { package: pkg } = await updatePackageApi(editing._id, fd);
        setCombos((list) => list.map((c) => (c._id === pkg._id ? pkg : c)));
        toast.success("Combo updated");
      } else {
        const { package: pkg } = await createPackageApi(fd);
        setCombos((list) => [...list, pkg].sort((a, b) => a.price - b.price));
        toast.success("Combo created");
      }
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't save the combo"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePackageApi(toDelete._id);
      setCombos((list) => list.filter((c) => c._id !== toDelete._id));
      toast.success("Combo deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete the combo"));
    } finally {
      setDeleting(false);
    }
  };

  const unusedSuggestions = serviceNames.filter((n) => !form.services.includes(n));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Combos"
        description="Bundled packages customers buy once and redeem service by service."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> New combo
          </Button>
        }
      />

      {!loading && combos.length > 0 && (
        <div className="mb-6 max-w-xs">
          <Input icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search combos…" className="h-10" />
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Package}
          title={combos.length ? "No matching combos" : "No combos yet"}
          description={combos.length ? "Try a different search." : "Bundle a few services together at a special price."}
          action={!combos.length && <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> New combo</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => {
            const src = imageUrl(c.image);
            return (
              <Card key={c._id} className="group flex flex-col overflow-hidden transition hover:shadow-lift">
                <div className="relative h-44 overflow-hidden bg-sand">
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gold-dark">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3 flex gap-1 rounded-xl bg-white/90 p-1 shadow-soft backdrop-blur">
                    <IconButton icon={Pencil} label="Edit" onClick={() => openForm(c)} />
                    <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => setToDelete(c)} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl leading-tight">{c.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{c.subtitle}</p>
                    </div>
                    <p className="shrink-0 font-display text-2xl font-semibold text-ink">{formatCurrency(c.price)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(c.services || []).map((s) => (
                      <Badge key={s} tone="gold">{s}</Badge>
                    ))}
                  </div>
                  {c.features?.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm text-ink-soft">
                      {c.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted">
                    <CalendarClock className="h-3.5 w-3.5" /> Valid {c.validityDays || 30} days after purchase · {c.services?.length || 0} services
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={closeForm}
        dismissible={!saving}
        title={editing?._id ? "Edit combo" : "New combo"}
        description={editing?._id ? editing.title : "Shown on the Combos page of the website."}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing?._id ? "Save changes" : "Create combo"}</Button>
          </div>
        }
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <ImageUpload value={imageUrl(editing?.image)} onChange={setImage} label="Cover image" />
          <Field label="Title" htmlFor="pkg-title" error={errors.title}>
            <Input id="pkg-title" value={form.title} onChange={set("title")} placeholder="Gold Glow" />
          </Field>
          <Field label="Subtitle" htmlFor="pkg-subtitle" error={errors.subtitle}>
            <Input id="pkg-subtitle" value={form.subtitle} onChange={set("subtitle")} placeholder="Complete makeover for special occasions" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price (₹)" htmlFor="pkg-price" error={errors.price}>
              <Input id="pkg-price" type="number" min="0" inputMode="numeric" value={form.price} onChange={set("price")} placeholder="4999" />
            </Field>
            <Field label="Valid for (days)" htmlFor="pkg-validity" error={errors.validityDays} hint="Counted from the purchase date">
              <Input id="pkg-validity" type="number" min="1" max="365" value={form.validityDays} onChange={set("validityDays")} />
            </Field>
          </div>
          <Field label="Included services" error={errors.services} hint="Each one is redeemed separately by the customer.">
            <TagInput value={form.services} onChange={(services) => setForm((f) => ({ ...f, services }))} placeholder="Add a service" />
            {unusedSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {unusedSuggestions.slice(0, 12).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, services: [...f.services, n] }))}
                    className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-muted transition hover:border-gold hover:text-ink"
                  >
                    + {n}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Highlights" hint="Short selling points, e.g. “Complimentary hair spa”.">
            <TagInput value={form.features} onChange={(features) => setForm((f) => ({ ...f, features }))} placeholder="Add a highlight" />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        tone="danger"
        title="Delete combo?"
        description={`"${toDelete?.title}" will no longer be sold. Customers who already bought it keep their orders.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
