import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, Field, Input, PageHeader, Textarea } from "../components/ui";
import { DataTable, FilterPills, IconButton, ImageUpload, RowActions, TagInput } from "../components/ui/admin";
import { getErrorMessage, imageUrl } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { createServiceApi, deleteServiceApi, fetchServicesApi, updateServiceApi } from "../apis/serviceApi";

const EMPTY = { title: "", category: "", price: "", duration: "", description: "", benefits: [] };

const validate = (f) => {
  const e = {};
  if (f.title.trim().length < 2) e.title = "Enter a title";
  if (f.category.trim().length < 2) e.category = "Enter a category";
  if (f.price === "" || Number(f.price) < 0 || Number.isNaN(Number(f.price))) e.price = "Enter a valid price";
  if (!f.duration.trim()) e.duration = "Enter a duration, e.g. 60 min";
  if (f.description.trim().length < 5) e.description = "Add a short description (5+ characters)";
  return e;
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  const [editing, setEditing] = useState(null); // null = closed, {} = new, service = edit
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setServices(await fetchServicesApi());
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load services"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set(services.map((s) => s.category).filter(Boolean))].sort(), [services]);
  const filtered = useMemo(
    () => (category === "all" ? services : services.filter((s) => s.category === category)),
    [services, category]
  );

  const openForm = (service) => {
    setEditing(service || {});
    setForm(
      service
        ? {
            title: service.title || "",
            category: service.category || "",
            price: service.price ?? "",
            duration: service.duration || "",
            description: service.description || "",
            benefits: service.benefits || [],
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
    fd.append("category", form.category.trim());
    fd.append("price", String(form.price));
    fd.append("duration", form.duration.trim());
    fd.append("description", form.description.trim());
    fd.append("benefits", JSON.stringify(form.benefits));
    if (image) fd.append("image", image);

    setSaving(true);
    try {
      if (editing?._id) {
        const { service } = await updateServiceApi(editing._id, fd);
        setServices((list) => list.map((s) => (s._id === service._id ? service : s)));
        toast.success("Service updated");
      } else {
        const { service } = await createServiceApi(fd);
        setServices((list) => [service, ...list]);
        toast.success("Service created");
      }
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't save the service"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteServiceApi(toDelete._id);
      setServices((list) => list.filter((s) => s._id !== toDelete._id));
      toast.success("Service deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete the service"));
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Service",
        cell: ({ row }) => {
          const s = row.original;
          const src = imageUrl(s.image);
          return (
            <div className="flex items-center gap-3">
              {src ? (
                <img src={src} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand text-gold-dark">
                  <Scissors className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{s.title}</p>
                <p className="max-w-xs truncate text-xs text-muted">{s.description}</p>
              </div>
            </div>
          );
        },
      },
      { accessorKey: "category", header: "Category", cell: ({ getValue }) => <Badge tone="gold">{getValue()}</Badge> },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ getValue }) => <span className="font-medium text-ink tabular-nums">{formatCurrency(getValue())}</span>,
      },
      { accessorKey: "duration", header: "Duration" },
      {
        id: "benefits",
        header: "Benefits",
        accessorFn: (s) => s.benefits?.length || 0,
        cell: ({ getValue }) => <span className="text-muted">{getValue()}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions>
            <IconButton icon={Pencil} label="Edit" onClick={() => openForm(row.original)} />
            <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => setToDelete(row.original)} />
          </RowActions>
        ),
      },
    ],
    []
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Services"
        description="Treatments customers can book online."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> New service
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search services…"
        onRowClick={openForm}
        toolbar={
          categories.length > 1 && (
            <FilterPills
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "All", count: services.length },
                ...categories.map((c) => ({ value: c, label: c, count: services.filter((s) => s.category === c).length })),
              ]}
            />
          )
        }
        emptyState={
          <EmptyState
            icon={Scissors}
            title={services.length ? "No matching services" : "No services yet"}
            description={services.length ? "Try a different search or category." : "Add your first service so customers can book it."}
            action={!services.length && <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> New service</Button>}
          />
        }
      />

      <Drawer
        open={editing !== null}
        onClose={closeForm}
        dismissible={!saving}
        title={editing?._id ? "Edit service" : "New service"}
        description={editing?._id ? editing.title : "Shown on the Services page of the website."}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing?._id ? "Save changes" : "Create service"}</Button>
          </div>
        }
      >
        <form onSubmit={save} className="space-y-5" noValidate>
          <ImageUpload value={imageUrl(editing?.image)} onChange={setImage} label="Cover image" />
          <Field label="Title" htmlFor="svc-title" error={errors.title}>
            <Input id="svc-title" value={form.title} onChange={set("title")} placeholder="Keratin smoothing" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="svc-category" error={errors.category}>
              <Input id="svc-category" value={form.category} onChange={set("category")} placeholder="Treatment" list="svc-categories" />
              <datalist id="svc-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Duration" htmlFor="svc-duration" error={errors.duration}>
              <Input id="svc-duration" value={form.duration} onChange={set("duration")} placeholder="60 min" />
            </Field>
          </div>
          <Field label="Price (₹)" htmlFor="svc-price" error={errors.price}>
            <Input id="svc-price" type="number" min="0" step="1" inputMode="numeric" value={form.price} onChange={set("price")} placeholder="1500" />
          </Field>
          <Field label="Description" htmlFor="svc-desc" error={errors.description}>
            <Textarea id="svc-desc" rows={4} value={form.description} onChange={set("description")} placeholder="What the treatment involves and who it's for." />
          </Field>
          <Field label="Benefits" hint="Press Enter after each benefit. The first three appear on the website card.">
            <TagInput value={form.benefits} onChange={(benefits) => setForm((f) => ({ ...f, benefits }))} placeholder="e.g. Reduces frizz" />
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
        title="Delete service?"
        description={`"${toDelete?.title}" will be removed from the website. Existing bookings keep their details.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
