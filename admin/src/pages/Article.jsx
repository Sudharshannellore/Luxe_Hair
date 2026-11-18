import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, Field, Input, PageHeader, Tabs, Textarea } from "../components/ui";
import { DataTable, IconButton, ImageUpload, RowActions, TagInput } from "../components/ui/admin";
import { getErrorMessage, imageUrl } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { createArticleApi, deleteArticleApi, fetchArticlesApi, updateArticleApi } from "../apis/articleApi";

const EMPTY = { title: "", context: "", content: "", tags: [] };

const validate = (f) => {
  const e = {};
  if (f.title.trim().length < 2) e.title = "Enter a title";
  if (f.context.trim().length < 2) e.context = "Add a short summary";
  if (f.context.trim().length > 500) e.context = "Keep the summary under 500 characters";
  if (f.content.trim().length < 10) e.content = "Write at least a few sentences";
  return e;
};

const paragraphs = (text = "") => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const readingTime = (text = "") => Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 200));

/** Read-only rendering of an article, matching the website's typography. */
function ArticlePreview({ form, image }) {
  return (
    <article className="overflow-hidden rounded-card border border-line/70 bg-white">
      {image && <img src={image} alt="" className="h-48 w-full object-cover" />}
      <div className="p-6">
        {form.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {form.tags.map((t) => <Badge key={t} tone="gold">{t}</Badge>)}
          </div>
        )}
        <h2 className="font-display text-3xl leading-tight">{form.title || "Untitled article"}</h2>
        <p className="mt-2 text-sm text-muted">{readingTime(form.content)} min read</p>
        {form.context && <p className="mt-4 text-base italic leading-relaxed text-ink-soft">{form.context}</p>}
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-soft">
          {paragraphs(form.content).length ? (
            paragraphs(form.content).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)
          ) : (
            <p className="italic text-muted">Your article body will appear here.</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Article() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [mode, setMode] = useState("write");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setArticles(await fetchArticlesApi());
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load articles"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (article) => {
    setEditing(article || {});
    setForm(
      article
        ? { title: article.title || "", context: article.context || "", content: article.content || "", tags: article.tags || [] }
        : EMPTY
    );
    setImage(null);
    setImagePreview(imageUrl(article?.image));
    setMode("write");
    setErrors({});
  };
  const closeForm = () => !saving && setEditing(null);

  const onImage = (file) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e?.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMode("write");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("context", form.context.trim());
    fd.append("content", form.content.trim());
    fd.append("tags", JSON.stringify(form.tags));
    if (image) fd.append("image", image);

    setSaving(true);
    try {
      if (editing?._id) {
        const { article } = await updateArticleApi(editing._id, fd);
        setArticles((list) => list.map((a) => (a._id === article._id ? article : a)));
        toast.success("Article updated");
      } else {
        const { article } = await createArticleApi(fd);
        setArticles((list) => [article, ...list]);
        toast.success("Article published");
      }
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't save the article"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteArticleApi(toDelete._id);
      setArticles((list) => list.filter((a) => a._id !== toDelete._id));
      toast.success("Article deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete the article"));
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Article",
        cell: ({ row }) => {
          const a = row.original;
          const src = imageUrl(a.image);
          return (
            <div className="flex items-center gap-3">
              {src ? (
                <img src={src} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-sand text-gold-dark">
                  <BookOpen className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{a.title}</p>
                <p className="max-w-sm truncate text-xs text-muted">{a.context}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "tags",
        header: "Tags",
        enableSorting: false,
        accessorFn: (a) => (a.tags || []).join(" "),
        cell: ({ row }) => (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {(row.original.tags || []).slice(0, 3).map((t) => <Badge key={t}>{t}</Badge>)}
            {row.original.tags?.length > 3 && <span className="text-xs text-muted">+{row.original.tags.length - 3}</span>}
          </div>
        ),
      },
      {
        id: "readingTime",
        header: "Length",
        accessorFn: (a) => readingTime(a.content),
        cell: ({ getValue }) => <span className="text-muted">{getValue()} min read</span>,
      },
      {
        id: "publishDate",
        header: "Published",
        accessorFn: (a) => new Date(a.publishDate || a.createdAt || 0).getTime(),
        cell: ({ row }) => <span className="whitespace-nowrap text-muted">{formatDateTime(row.original.publishDate || row.original.createdAt)}</span>,
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
        title="Articles"
        description="Hair care tips and stories published on the website."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> New article
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={articles}
        loading={loading}
        searchPlaceholder="Search articles…"
        onRowClick={openForm}
        initialSorting={[{ id: "publishDate", desc: true }]}
        emptyState={
          <EmptyState
            icon={BookOpen}
            title={articles.length ? "No matching articles" : "No articles yet"}
            description={articles.length ? "Try a different search." : "Share hair care tips to bring visitors back to the site."}
            action={!articles.length && <Button onClick={() => openForm()}><Plus className="h-4 w-4" /> New article</Button>}
          />
        }
      />

      <Drawer
        open={editing !== null}
        onClose={closeForm}
        dismissible={!saving}
        title={editing?._id ? "Edit article" : "New article"}
        description={editing?._id ? editing.title : "Published immediately on the Articles page."}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">{readingTime(form.content)} min read</span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button>
              <Button onClick={save} loading={saving}>{editing?._id ? "Save changes" : "Publish"}</Button>
            </div>
          </div>
        }
      >
        <div className="mb-6">
          <Tabs
            value={mode}
            onChange={setMode}
            tabs={[
              { value: "write", label: "Write", icon: Pencil },
              { value: "preview", label: "Preview", icon: Eye },
            ]}
          />
        </div>

        {mode === "preview" ? (
          <ArticlePreview form={form} image={imagePreview} />
        ) : (
          <form onSubmit={save} className="space-y-5" noValidate>
            <ImageUpload value={imagePreview} onChange={onImage} label="Cover image" />
            <Field label="Title" htmlFor="art-title" error={errors.title}>
              <Input id="art-title" value={form.title} onChange={set("title")} placeholder="5 ways to keep colour vibrant" />
            </Field>
            <Field label="Summary" htmlFor="art-context" error={errors.context} hint={`${form.context.length}/500 · Shown on the article card.`}>
              <Textarea id="art-context" rows={2} value={form.context} onChange={set("context")} />
            </Field>
            <Field label="Content" htmlFor="art-content" error={errors.content} hint="Leave a blank line between paragraphs.">
              <Textarea id="art-content" rows={14} value={form.content} onChange={set("content")} className="font-[450] leading-relaxed" />
            </Field>
            <Field label="Tags">
              <TagInput value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} placeholder="e.g. Hair care" />
            </Field>
            <button type="submit" className="hidden" />
          </form>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        tone="danger"
        title="Delete article?"
        description={`"${toDelete?.title}" will be removed from the website.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
