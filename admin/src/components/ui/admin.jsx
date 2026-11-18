import { useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, ImagePlus, Search, X } from "lucide-react";
import { cx, Input, Skeleton } from "./index";

/* ------------------------------------------------------------------ StatCard */

/**
 * KPI tile. `change` is a percentage (number) compared to the previous period.
 * <StatCard label="Revenue" value="₹12,000" icon={IndianRupee} change={12.5} hint="vs last month" />
 */
export const StatCard = ({ label, value, icon: Icon, change, hint, loading }) => (
  <div className="rounded-card border border-line/70 bg-white p-5 shadow-soft">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-muted">{label}</p>
      {Icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand text-gold-dark">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      )}
    </div>
    {loading ? (
      <Skeleton className="mt-3 h-8 w-28" />
    ) : (
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
    )}
    {(change !== undefined && change !== null && Number.isFinite(change)) || hint ? (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        {Number.isFinite(change) && (
          <span className={cx("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
            {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {hint}
      </p>
    ) : null}
  </div>
);

/* ------------------------------------------------------------------ Switch */

export const Switch = ({ checked, onChange, label, description, disabled }) => (
  <label className={cx("flex cursor-pointer items-center justify-between gap-4", disabled && "cursor-not-allowed opacity-60")}>
    <span>
      <span className="block text-sm font-medium text-ink">{label}</span>
      {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
    </span>
    <span className="relative inline-flex shrink-0">
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-gold peer-focus-visible:ring-4 peer-focus-visible:ring-gold/20" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </span>
  </label>
);

/* ------------------------------------------------------------------ Select */

export const Select = ({ className, children, ...props }) => (
  <select
    className={cx(
      "h-11 w-full appearance-none rounded-xl border border-line bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2378716c%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_14px_center] bg-no-repeat pl-4 pr-10 text-sm text-ink transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15",
      className
    )}
    {...props}
  >
    {children}
  </select>
);

/* ------------------------------------------------------------------ Image upload */

/** Click / drop to choose an image; shows a preview. `value` is the current image URL. */
export const ImageUpload = ({ value, onChange, label = "Image" }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const shown = preview || value;

  const pick = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={cx(
          "group relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition",
          dragging ? "border-gold bg-gold-light/30" : "border-line bg-cream hover:border-gold/60"
        )}
      >
        {shown ? (
          <>
            <img src={shown} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
              Change image
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm text-muted">
            <ImagePlus className="h-6 w-6 text-gold" />
            Click or drop an image (JPG, PNG, WEBP · max 5 MB)
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
};

/* ------------------------------------------------------------------ Tag input */

/** Edits a string[] as removable chips. Enter or comma adds. */
export const TagInput = ({ value = [], onChange, placeholder = "Type and press Enter" }) => {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().replace(/,$/, "");
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/15">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="text-muted hover:text-danger">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted/70"
      />
    </div>
  );
};

/* ------------------------------------------------------------------ Filter pills */

/** Row of status filter pills with counts. options: [{ value, label, count }] */
export const FilterPills = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
          value === o.value ? "border-ink bg-ink text-cream" : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink"
        )}
      >
        {o.label}
        {o.count !== undefined && (
          <span className={cx("rounded-full px-1.5 text-xs", value === o.value ? "bg-white/15" : "bg-sand")}>{o.count}</span>
        )}
      </button>
    ))}
  </div>
);

/* ------------------------------------------------------------------ DataTable */

/**
 * Sortable, searchable, paginated table built on TanStack Table v8.
 *
 * <DataTable
 *   columns={[{ accessorKey: "title", header: "Title" }, { id: "actions", cell: ({ row }) => ..., enableSorting: false }]}
 *   data={rows}
 *   loading={loading}
 *   searchPlaceholder="Search services…"
 *   toolbar={<FilterPills …/>}          // optional, rendered next to search
 *   onRowClick={(row) => …}              // optional
 *   emptyState={<EmptyState …/>}         // optional
 *   pageSize={10}
 * />
 */
export function DataTable({ columns, data, loading, searchPlaceholder = "Search…", toolbar, onRowClick, emptyState, pageSize = 10, initialSorting = [] }) {
  const [sorting, setSorting] = useState(initialSorting);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: useMemo(() => data || [], [data]),
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    autoResetPageIndex: true,
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: size } = table.getState().pagination;

  return (
    <div className="overflow-hidden rounded-card border border-line/70 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-line/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xs">
          <Input icon={Search} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} className="h-10" />
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-cream/70 text-xs uppercase tracking-wider text-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="whitespace-nowrap px-4 py-3 font-semibold" style={{ width: header.column.columnDef.size !== 150 ? header.column.columnDef.size : undefined }}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-ink">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? <ArrowUp className="h-3 w-3" /> : dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line/60">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cx("transition hover:bg-cream/60", onRowClick && "cursor-pointer")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 align-middle text-ink-soft">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <div className="p-8">{emptyState || <p className="text-center text-sm text-muted">No results found.</p>}</div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line/70 px-4 py-3 text-sm text-muted sm:flex-row">
          <span>
            Showing {pageIndex * size + 1}–{Math.min((pageIndex + 1) * size, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={size}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-9 rounded-lg border border-line bg-white px-2 text-sm"
              aria-label="Rows per page"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-line p-2 hover:bg-cream disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="tabular-nums">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-lg border border-line p-2 hover:bg-cream disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Row actions menu */

/** Small inline action buttons for table rows (stops row click). */
export const RowActions = ({ children }) => (
  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const IconButton = ({ icon: Icon, label, onClick, tone = "default", disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={cx(
      "rounded-lg p-2 transition disabled:opacity-40",
      tone === "danger" ? "text-muted hover:bg-red-50 hover:text-danger" : "text-muted hover:bg-sand hover:text-ink"
    )}
  >
    <Icon className="h-4 w-4" />
  </button>
);
