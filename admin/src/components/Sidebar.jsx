import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Mail,
  Package,
  Receipt,
  Scissors,
  Settings,
  Star,
  Users,
  X,
} from "lucide-react";
import { cx } from "./ui";

const SECTIONS = [
  { title: "Overview", items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }] },
  {
    title: "Bookings",
    items: [
      { name: "Appointments", href: "/appointments", icon: CalendarDays },
      { name: "Combo orders", href: "/orders", icon: Receipt },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { name: "Services", href: "/services", icon: Scissors },
      { name: "Combos", href: "/combos", icon: Package },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Staff", href: "/staff", icon: Users },
      { name: "Reviews", href: "/review", icon: Star },
      { name: "Messages", href: "/message", icon: Mail },
    ],
  },
  {
    title: "Content & setup",
    items: [
      { name: "Articles", href: "/article", icon: BookOpen },
      { name: "Offers & payments", href: "/setting", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 animate-fade-in bg-ink/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line/70 bg-white transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0 shadow-lift" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-lg text-gold-light">L</span>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold tracking-wide text-ink">Luxe Hair</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-sand lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted/80">{section.title}</p>
              <ul className="space-y-0.5">
                {section.items.map(({ name, href, icon: Icon }) => (
                  <li key={href}>
                    <NavLink
                      to={href}
                      end={href === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cx(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                          isActive ? "bg-ink text-cream shadow-soft" : "text-ink-soft hover:bg-sand hover:text-ink"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={cx("h-4 w-4", isActive ? "text-gold-light" : "text-muted group-hover:text-ink")} aria-hidden />
                          {name}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line/70 p-4">
          <p className="text-xs leading-relaxed text-muted">
            Showcase mode — no sign-in required. Changes here are visible on the live site.
          </p>
        </div>
      </aside>
    </>
  );
}
