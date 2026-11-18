/*
 * Visual effects kit for the customer site (built on `motion`).
 * Every effect respects prefers-reduced-motion via <MotionConfig reducedMotion="user"> in App.jsx.
 *
 *   <Reveal>…</Reveal>                       fade + rise when scrolled into view
 *   <Stagger><StaggerItem/>…</Stagger>       children reveal one after another
 *   <SplitText text="…" />                   words slide up from a mask
 *   <Parallax speed={0.2}>…</Parallax>       moves at a different speed while scrolling
 *   <TiltCard>…</TiltCard>                   3D tilt + glare following the pointer
 *   <Spotlight>…</Spotlight>                 soft light that follows the pointer
 *   <CountUp to={1200} suffix="+" />         animated number when visible
 *   <Marquee items={[…]} />                  infinite scrolling band
 *   <Magnetic>…</Magnetic>                   element is gently pulled toward the cursor
 *   <BeforeAfter before after />             draggable comparison slider
 *   <ScrollProgress />, <CursorGlow />, <AmbientBlobs />, <Grain />
 */
import { Children, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { MoveHorizontal } from "lucide-react";
import { cx } from "./ui";

const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ Reveal */

export function Reveal({ children, delay = 0, y = 28, x = 0, scale = 1, className, as = "div", amount = 0.25, once = true }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ Stagger */

const staggerParent = (gap) => ({ hidden: {}, show: { transition: { staggerChildren: gap } } });
const staggerChild = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Stagger({ children, className, gap = 0.09, amount = 0.15, as = "div" }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag className={className} variants={staggerParent(gap)} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, as = "div", ...props }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag className={className} variants={staggerChild} {...props}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ SplitText */

/**
 * Words rise from behind a mask. Wrap a word in *asterisks* to render it in the
 * gold italic accent style, e.g. text="Hair that turns *heads.*"
 */
export function SplitText({ text, className, delay = 0, stagger = 0.06, as = "h1", animateOnMount = false }) {
  const Tag = motion[as] || motion.h1;
  const words = text.split(" ");
  const variants = { hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } };
  const word = { hidden: { y: "110%" }, show: { y: "0%", transition: { duration: 0.9, ease: EASE } } };
  const trigger = animateOnMount ? { animate: "show" } : { whileInView: "show", viewport: { once: true, amount: 0.5 } };

  return (
    <Tag className={className} variants={variants} initial="hidden" {...trigger} aria-label={text.replace(/\*/g, "")}>
      {words.map((w, i) => {
        const accent = /^\*.*\*[.,!?]?$/.test(w);
        const clean = w.replace(/\*/g, "");
        return (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
            <motion.span variants={word} className={cx("inline-block", accent && "text-gold-gradient italic")}>
              {clean}
            </motion.span>
            {i < words.length - 1 && " "}
          </span>
        );
      })}
    </Tag>
  );
}

/* ------------------------------------------------------------------ Parallax */

export function Parallax({ children, speed = 0.15, className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ TiltCard */

export function TiltCard({ children, className, max = 8, glare = true }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  const gx = useTransform(px, [0, 1], ["0%", "100%"]);
  const gy = useTransform(py, [0, 1], ["0%", "100%"]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.28), transparent 55%)`;

  const onMove = (e) => {
    if (reduce || e.pointerType === "touch") return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cx("group/tilt relative will-change-transform", className)}
    >
      {children}
      {glare && !reduce && (
        <motion.div
          aria-hidden
          style={{ background: glareBg }}
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover/tilt:opacity-100"
        />
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ Spotlight */

export function Spotlight({ children, className, color = "rgba(176,141,87,0.18)", size = 380 }) {
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const bg = useMotionTemplate`radial-gradient(${size}px circle at ${mx}px ${my}px, ${color}, transparent 70%)`;
  return (
    <div
      className={cx("group/spot relative", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
    >
      <motion.div aria-hidden style={{ background: bg }} className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ CountUp */

export function CountUp({ to = 0, duration = 2, prefix = "", suffix = "", decimals = 0, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setValue });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={cx("tabular-nums", className)}>
      {prefix}
      {value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ Marquee */

export function Marquee({ children, speed = 40, reverse = false, className, pauseOnHover = true }) {
  const items = Children.toArray(children);
  return (
    <div className={cx("group/marquee relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]", className)}>
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cx("flex shrink-0 items-center animate-marquee", pauseOnHover && "group-hover/marquee:[animation-play-state:paused]")}
          style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : "normal" }}
        >
          {items}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Magnetic */

export function Magnetic({ children, strength = 0.35, className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });
  return (
    <motion.div
      ref={ref}
      className={cx("inline-block", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType === "touch") return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ BeforeAfter */

/**
 * Draggable comparison slider. `beforeClassName` lets you style the "before" layer
 * (e.g. a CSS filter) when the same photo is used for both sides.
 */
export function BeforeAfter({ before, after, beforeLabel = "Before", afterLabel = "After", beforeClassName = "", className, alt = "" }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [hinted, setHinted] = useState(false);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  // Gentle "peek" animation once, so visitors know it's interactive.
  useEffect(() => {
    if (!inView || hinted) return;
    setHinted(true);
    const controls = animate(50, [50, 28, 72, 50], { duration: 2.2, ease: "easeInOut", onUpdate: setPos });
    return () => controls.stop();
  }, [inView, hinted]);

  const update = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={ref}
      className={cx("relative select-none overflow-hidden touch-pan-y", dragging ? "cursor-grabbing" : "cursor-ew-resize", className)}
      onPointerDown={(e) => {
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging && update(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <img src={after} alt={alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="" draggable={false} className={cx("absolute inset-0 h-full w-full object-cover", beforeClassName)} />
      </div>

      <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-cream backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-medium uppercase tracking-widest text-white">
        {afterLabel}
      </span>

      <div className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_20px_rgba(0,0,0,0.35)]" style={{ left: `${pos}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lift ring-4 ring-white/40 transition hover:scale-110"
        >
          <MoveHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Page chrome */

/** Thin gold bar at the top showing scroll progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light"
    />
  );
}

/**
 * Floating page scrollbar (desktop / fine pointers). Hides the native page scrollbar —
 * which always reserves a light strip beside dark sections — and draws a slim thumb
 * over the content instead. It fades in while scrolling or hovering, turns gold on
 * hover, can be dragged, and clicking the track jumps there. Touch devices keep their
 * native overlay scrollbars.
 */
export function PageScrollbar() {
  const [metrics, setMetrics] = useState({ top: 0, height: 0 });
  const [scrolling, setScrolling] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const hideTimer = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("custom-scrollbar");
    setEnabled(true);

    const update = (fromScroll) => {
      const vh = window.innerHeight;
      const sh = root.scrollHeight;
      if (sh <= vh + 1) {
        setMetrics({ top: 0, height: 0 });
        return;
      }
      const height = Math.max(48, (vh * vh) / sh);
      const top = (window.scrollY / (sh - vh)) * (vh - height);
      setMetrics({ top, height });
      if (fromScroll) {
        setScrolling(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setScrolling(false), 1100);
      }
    };
    const onScroll = () => update(true);
    const onResize = () => update(false);

    update(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      clearTimeout(hideTimer.current);
      root.classList.remove("custom-scrollbar");
    };
  }, []);

  if (!enabled || !metrics.height) return null;

  const scrollRatio = () => {
    const vh = window.innerHeight;
    return (document.documentElement.scrollHeight - vh) / (vh - metrics.height);
  };

  const onThumbDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, scroll: window.scrollY, ratio: scrollRatio() };
    setDragging(true);
  };
  const onThumbMove = (e) => {
    if (!drag.current) return;
    window.scrollTo({ top: drag.current.scroll + (e.clientY - drag.current.y) * drag.current.ratio, behavior: "instant" });
  };
  const onThumbUp = () => {
    drag.current = null;
    setDragging(false);
  };
  const onTrackDown = (e) => {
    const target = (e.clientY - metrics.height / 2) * scrollRatio();
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  const shown = scrolling || dragging;

  return (
    <div aria-hidden className="group/sb fixed inset-y-0 right-0 z-[70] w-4" onPointerDown={onTrackDown}>
      <div
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
        style={{ transform: `translateY(${metrics.top}px)`, height: metrics.height }}
        className={cx(
          "absolute right-[3px] top-0 cursor-grab rounded-full transition-[width,background-color,opacity] duration-200 active:cursor-grabbing",
          "bg-[rgb(28_25_23/0.38)] shadow-[0_0_0_1px_rgb(255_255_255/0.45)] backdrop-blur-sm",
          "group-hover/sb:w-2 group-hover/sb:bg-gold group-hover/sb:opacity-100",
          dragging ? "w-2 bg-gold-dark opacity-100" : "w-1.5",
          shown ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

/** Soft golden light that follows the cursor (desktop only). */
export function CursorGlow() {
  const x = useSpring(-400, { stiffness: 80, damping: 20 });
  const y = useSpring(-400, { stiffness: 80, damping: 20 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e) => {
      x.set(e.clientX - 200);
      y.set(e.clientY - 200);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y, reduce]);

  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(176,141,87,0.10),transparent_65%)] md:block"
    />
  );
}

/** Slow-moving blurred colour blobs for dark sections. */
export function AmbientBlobs({ className }) {
  return (
    <div aria-hidden className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] animate-blob rounded-full bg-gold/25 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-[24rem] w-[24rem] animate-blob rounded-full bg-[#8a4f3f]/25 blur-3xl [animation-delay:-6s]" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] animate-blob rounded-full bg-gold-light/15 blur-3xl [animation-delay:-12s]" />
    </div>
  );
}

/** Subtle film-grain texture overlay. */
export function Grain({ className, opacity = 0.08 }) {
  return (
    <div
      aria-hidden
      className={cx("pointer-events-none absolute inset-0 mix-blend-overlay", className)}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/** Wraps a page so it fades/rises in on route change. Key it by pathname. */
export function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}>
      {children}
    </motion.div>
  );
}
