import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Avatar, cx } from "./ui";
import { AmbientBlobs, Grain, Magnetic } from "./fx";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Combos", path: "/combos" },
  { name: "Offers", path: "/offers" },
  { name: "Journal", path: "/articles" },
  { name: "Contact", path: "/contact" },
];

const EASE = [0.22, 1, 0.36, 1];

const isActivePath = (pathname, path) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Esc closes the mobile menu; lock body scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Light text over dark page headers until the bar turns into the glass pill.
  const light = !scrolled || open;
  const indicator = hovered ?? NAV_ITEMS.find((i) => isActivePath(pathname, i.path))?.path;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        initial={false}
        animate={
          scrolled && !open
            ? { marginTop: 12, paddingLeft: 12, paddingRight: 12 }
            : { marginTop: 0, paddingLeft: 0, paddingRight: 0 }
        }
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto max-w-7xl"
      >
        <motion.nav
          aria-label="Main"
          initial={false}
          animate={{ borderRadius: scrolled && !open ? 999 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={cx(
            "relative flex h-18 items-center justify-between gap-6 px-4 transition-[background-color,box-shadow,border-color,height] duration-500 sm:px-6 lg:px-8",
            scrolled && !open
              ? "!h-16 border border-white/60 bg-cream/75 shadow-[0_8px_40px_rgb(28_25_23/0.12)] backdrop-blur-xl backdrop-saturate-150"
              : "border border-transparent bg-transparent"
          )}
        >
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Luxe Hair home">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.06 }}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-xl font-display text-xl transition-colors duration-500",
                light ? "bg-white/15 text-gold-light ring-1 ring-white/25 backdrop-blur" : "bg-ink text-gold-light"
              )}
            >
              L
            </motion.span>
            <span
              className={cx(
                "font-display text-2xl font-medium tracking-[0.12em] transition-colors duration-500",
                light ? "text-white" : "text-ink"
              )}
            >
              LUXE <span className={light ? "text-gold-gradient" : "text-gold-dark"}>HAIR</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex" onPointerLeave={() => setHovered(null)}>
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.path);
              return (
                <li key={item.path} className="relative" onPointerEnter={() => setHovered(item.path)}>
                  {indicator === item.path && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className={cx("absolute inset-0 rounded-full", light ? "bg-white/12 ring-1 ring-white/20" : "bg-ink/[0.06]")}
                      aria-hidden
                    />
                  )}
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    className={cx(
                      "relative z-10 block rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-colors",
                      light ? (active ? "text-white" : "text-white/75 hover:text-white") : active ? "text-ink" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {item.name}
                    {active && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold"
                        aria-hidden
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className={cx(
                  "flex items-center gap-2.5 rounded-full py-1 pl-1 pr-4 text-sm font-medium transition",
                  light ? "text-white hover:bg-white/10" : "text-ink hover:bg-sand"
                )}
              >
                <Avatar name={user?.username} image={user?.image} size="sm" />
                <span className="max-w-[8rem] truncate">{user?.username?.split(" ")[0] || "Account"}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={cx("px-3 text-sm font-medium transition", light ? "text-white/80 hover:text-white" : "text-ink-soft hover:text-ink")}
              >
                Sign in
              </Link>
            )}
            <Magnetic strength={0.3}>
              <Link
                to="/services"
                className={cx(
                  "group shine relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-full px-5 text-sm font-medium tracking-wide shadow-soft transition-colors duration-500",
                  light ? "bg-white text-ink hover:bg-cream" : "bg-ink text-cream hover:bg-ink-soft"
                )}
              >
                Book now
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
          </div>

          <button
            ref={toggleRef}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cx(
              "relative z-[60] rounded-full p-2 transition lg:hidden",
              light ? "text-white hover:bg-white/10" : "text-ink hover:bg-sand"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </motion.nav>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "circle(0% at calc(100% - 2.5rem) 2.25rem)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 2.5rem) 2.25rem)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 2.5rem) 2.25rem)" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed inset-0 z-40 overflow-y-auto bg-ink lg:hidden"
          >
            <AmbientBlobs />
            <Grain />
            <div className="container-page relative flex min-h-full flex-col pb-10 pt-28">
              <motion.ul
                className="space-y-1"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
              >
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.path}
                    variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
                    className="overflow-hidden"
                  >
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        cx(
                          "group flex items-baseline gap-4 border-b border-white/10 py-4 font-display text-5xl transition-colors",
                          isActive ? "text-gold-light" : "text-cream hover:text-gold-light"
                        )
                      }
                    >
                      <span className="font-sans text-xs tracking-widest text-cream/40">0{i + 1}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-2">{item.name}</span>
                    </NavLink>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
                className="mt-auto space-y-3 pt-12"
              >
                {isAuthenticated ? (
                  <Link to="/profile" className="flex items-center gap-3 rounded-card border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <Avatar name={user?.username} image={user?.image} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-cream">{user?.username}</p>
                      <p className="text-sm text-cream/60">View bookings & profile</p>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="flex h-13 w-full items-center justify-center rounded-full border border-white/20 text-base font-medium text-cream transition hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                )}
                <Link
                  to="/services"
                  className="group shine relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold text-base font-medium text-white shadow-lift"
                >
                  Book an appointment <ArrowUpRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
