import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ExternalLink, Menu } from "lucide-react";
import Sidebar from "./Sidebar";

const TITLES = {
  "/": "Dashboard",
  "/appointments": "Appointments",
  "/orders": "Combo orders",
  "/services": "Services",
  "/combos": "Combos",
  "/staff": "Staff",
  "/review": "Reviews",
  "/message": "Messages",
  "/article": "Articles",
  "/setting": "Offers & payments",
};

const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5173";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line/70 bg-white/80 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink hover:bg-sand lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-medium text-muted">
              Luxe Hair <span className="mx-1.5 text-line">/</span>
              <span className="text-ink">{TITLES[pathname] || "Admin"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink sm:inline-flex"
            >
              View site <ExternalLink className="h-3 w-3" />
            </a>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-light/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark ring-1 ring-gold/30"
              title="Showcase mode: no admin login, changes are visible to everyone"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden /> Showcase
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 animate-fade-up" key={pathname}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
