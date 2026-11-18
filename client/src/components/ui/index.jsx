import { forwardRef, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Loader2, Star, X } from "lucide-react";
import { imageUrl } from "../../lib/api";
import { initials } from "../../lib/format";

const cx = (...classes) => classes.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ Button */

const BUTTON_VARIANTS = {
  primary: "bg-ink text-cream hover:bg-ink-soft shadow-soft",
  gold: "bg-gold text-white hover:bg-gold-dark shadow-soft",
  outline: "border border-ink/15 bg-white/60 text-ink hover:border-ink/40 hover:bg-white",
  ghost: "text-ink hover:bg-sand",
  light: "bg-white text-ink hover:bg-cream shadow-soft",
  danger: "bg-danger text-white hover:brightness-110",
};

const BUTTON_SIZES = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-sm gap-2",
  lg: "h-13 px-8 text-base gap-2",
  icon: "h-10 w-10",
};

/**
 * <Button variant="primary|gold|outline|ghost|light|danger" size="sm|md|lg|icon" loading to="/path" />
 * Renders a react-router <Link> when `to` is set, an <a> when `href` is set.
 */
export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className, children, to, href, type = "button", ...props },
  ref
) {
  const classes = cx(
    "inline-flex items-center justify-center rounded-full font-medium tracking-wide transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none whitespace-nowrap",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </>
  );
  if (to) return <Link ref={ref} to={to} className={classes} {...props}>{content}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...props}>{content}</a>;
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  );
});

/* ------------------------------------------------------------------ Badge */

const BADGE_TONES = {
  neutral: "bg-sand text-ink-soft",
  gold: "bg-gold-light/70 text-gold-dark",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-600/15",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/15",
  dark: "bg-ink text-cream",
};

export const Badge = ({ tone = "neutral", className, children, dot = false }) => (
  <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", BADGE_TONES[tone], className)}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
    {children}
  </span>
);

/** Consistent colours for booking / payment / order statuses. */
// eslint-disable-next-line react-refresh/only-export-components
export const STATUS_TONE = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
  active: "success",
  expired: "neutral",
};

/* ------------------------------------------------------------------ Card */

export const Card = ({ className, children, as: Tag = "div", ...props }) => (
  <Tag className={cx("rounded-card border border-line/70 bg-white shadow-soft", className)} {...props}>
    {children}
  </Tag>
);

/* ------------------------------------------------------------------ Form fields */

const fieldBase =
  "w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted/70 transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15 disabled:bg-sand disabled:text-muted";

export const Input = forwardRef(function Input({ className, icon: Icon, ...props }, ref) {
  if (!Icon) return <input ref={ref} className={cx(fieldBase, "h-12", className)} {...props} />;
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input ref={ref} className={cx(fieldBase, "h-12 pl-11", className)} {...props} />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cx(fieldBase, "py-3", className)} {...props} />;
});

/** Label + control + hint/error. Pass the control as children; `id` is provided via render prop or useId. */
export const Field = ({ label, hint, error, children, className, htmlFor }) => (
  <div className={cx("space-y-1.5", className)}>
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
    )}
    {children}
    {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
  </div>
);

/* ------------------------------------------------------------------ Loading */

export const Spinner = ({ className }) => <Loader2 className={cx("h-6 w-6 animate-spin text-gold", className)} aria-label="Loading" />;

export const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner className="h-8 w-8" />
  </div>
);

export const Skeleton = ({ className }) => <div className={cx("skeleton rounded-xl", className)} aria-hidden />;

/** Placeholder card matching the service/combo card layout. */
export const CardSkeleton = () => (
  <div className="overflow-hidden rounded-card border border-line/70 bg-white">
    <Skeleton className="h-56 rounded-none" />
    <div className="space-y-3 p-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ Empty state */

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cx("flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-white/60 px-6 py-14 text-center", className)}>
    {Icon && (
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand text-gold-dark">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
    )}
    <h3 className="font-display text-2xl">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ Headings */

export const SectionHeading = ({ eyebrow, title, description, align = "center", action, className }) => (
  <div
    className={cx(
      "mb-12 flex flex-col gap-4",
      align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      className
    )}
  >
    <div className={cx(align === "center" && "max-w-2xl")}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display text-4xl font-medium leading-tight md:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

/** Compact header for inner pages (replaces the old full-screen hero). */
export const PageHeader = ({ eyebrow, title, description, children, image }) => (
  <header className="relative overflow-hidden bg-ink pt-32 pb-16 text-cream md:pt-32 md:pb-20">
    {image && (
      <>
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" aria-hidden />
      </>
    )}
    <div className="container-page relative animate-fade-up">
      {eyebrow && <p className="eyebrow mb-4 !text-gold-light">{eyebrow}</p>}
      <h1 className="max-w-3xl font-display text-5xl font-medium leading-[1.05] !text-cream md:text-5xl">{title}</h1>
      {description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/75 md:text-lg">{description}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  </header>
);

/* ------------------------------------------------------------------ Avatar */

export const Avatar = ({ name, image, size = "md", className }) => {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };
  const src = imageUrl(image);
  return src ? (
    <img src={src} alt={name || ""} className={cx("shrink-0 rounded-full object-cover ring-2 ring-white", sizes[size], className)} />
  ) : (
    <span className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-gold-light font-semibold text-gold-dark ring-2 ring-white", sizes[size], className)}>
      {initials(name)}
    </span>
  );
};

/* ------------------------------------------------------------------ Stars */

export const Stars = ({ value = 0, size = "h-4 w-4", className }) => (
  <div className={cx("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={cx(size, i <= value ? "fill-gold text-gold" : "fill-transparent text-line")} aria-hidden />
    ))}
  </div>
);

/** Keyboard-accessible star input (radio group). */
export const StarRatingInput = ({ value, onChange, name = "rating" }) => (
  <div role="radiogroup" aria-label="Rating" className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <label key={i} className="cursor-pointer rounded-md p-1 transition hover:scale-110 focus-within:ring-2 focus-within:ring-gold">
        <input type="radio" name={name} value={i} checked={value === i} onChange={() => onChange(i)} className="sr-only" />
        <Star className={cx("h-8 w-8", i <= value ? "fill-gold text-gold" : "fill-transparent text-line")} aria-hidden />
        <span className="sr-only">{i} star{i > 1 ? "s" : ""}</span>
      </label>
    ))}
  </div>
);

/* ------------------------------------------------------------------ Modal & Drawer */

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])';

function useDialogBehaviour(open, onClose, panelRef, dismissible) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const el = panelRef.current?.querySelector("[autofocus]") || panelRef.current?.querySelector(FOCUSABLE);
      (el || panelRef.current)?.focus();
    };
    const t = setTimeout(focusFirst, 30);

    const onKey = (e) => {
      if (e.key === "Escape" && dismissible) onClose?.();
      if (e.key === "Tab" && panelRef.current) {
        const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef, dismissible]);
}

/**
 * Accessible modal: focus trap, Esc / backdrop to close, scroll lock.
 * <Modal open onClose title="..." description="..." size="sm|md|lg" footer={...}>
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", dismissible = true }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useDialogBehaviour(open, onClose, panelRef, dismissible);
  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cx(
          "relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift outline-none sm:rounded-3xl",
          widths[size]
        )}
      >
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b border-line/70 px-6 py-5">
            <div>
              {title && <h2 id={titleId} className="font-display text-2xl font-medium">{title}</h2>}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            {dismissible && (
              <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted transition hover:bg-sand hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line/70 bg-cream/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Right-side sheet on desktop, bottom sheet on mobile. Same API as Modal. */
export function Drawer({ open, onClose, title, description, children, footer, dismissible = true }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useDialogBehaviour(open, onClose, panelRef, dismissible);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} aria-hidden />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-xl animate-slide-in-right flex-col bg-cream shadow-lift outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line/70 bg-white px-6 py-5">
          <div>
            <h2 id={titleId} className="font-display text-2xl font-medium">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {dismissible && (
            <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted transition hover:bg-sand hover:text-ink" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-line/70 bg-white px-6 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ Confirm dialog */

export const ConfirmDialog = ({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", tone = "primary", loading }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    }
  >
    <p className="text-sm leading-relaxed text-muted">{description}</p>
  </Modal>
);

/* ------------------------------------------------------------------ Tabs (segmented) */

export const Tabs = ({ tabs, value, onChange, className }) => (
  <div role="tablist" className={cx("inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1 shadow-soft", className)}>
    {tabs.map((t) => (
      <button
        key={t.value}
        role="tab"
        aria-selected={value === t.value}
        onClick={() => onChange(t.value)}
        className={cx(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
          value === t.value ? "bg-ink text-cream shadow-soft" : "text-muted hover:text-ink"
        )}
      >
        {t.icon && <t.icon className="h-4 w-4" aria-hidden />}
        {t.label}
        {t.count !== undefined && (
          <span className={cx("rounded-full px-2 py-0.5 text-xs", value === t.value ? "bg-white/15" : "bg-sand")}>{t.count}</span>
        )}
      </button>
    ))}
  </div>
);

/* ------------------------------------------------------------------ Price summary */

export const PriceSummary = ({ price, discount = 0, total, couponCode, formatCurrency }) => (
  <dl className="space-y-2 text-sm">
    <div className="flex justify-between text-muted">
      <dt>Subtotal</dt>
      <dd>{formatCurrency(price)}</dd>
    </div>
    {discount > 0 && (
      <div className="flex justify-between text-success">
        <dt>Discount{couponCode ? ` (${couponCode})` : ""}</dt>
        <dd>− {formatCurrency(discount)}</dd>
      </div>
    )}
    <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
      <dt>Total</dt>
      <dd>{formatCurrency(total ?? price - discount)}</dd>
    </div>
  </dl>
);

// eslint-disable-next-line react-refresh/only-export-components
export { cx };
