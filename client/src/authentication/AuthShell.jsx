import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Lock, Star } from "lucide-react";
import { Input } from "../components/ui";
import { AmbientBlobs, Grain } from "../components/fx";

const IMAGE = "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1400";
const EASE = [0.22, 1, 0.36, 1];

/** Split-screen layout for sign in / sign up. */
export function AuthShell({ title, subtitle, quote, children, footer }) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative isolate hidden overflow-hidden bg-ink lg:block">
        {/* Slow Ken Burns zoom */}
        <motion.img
          src={IMAGE}
          alt=""
          initial={{ scale: 1.25, x: "-3%" }}
          animate={{ scale: 1.05, x: "2%" }}
          transition={{ duration: 22, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <AmbientBlobs className="-z-10 opacity-60" />
        <Grain className="-z-10" />

        <Link to="/" className="absolute left-10 top-10 font-display text-2xl tracking-[0.25em] text-cream">
          LUXE <span className="text-gold-gradient">HAIR</span>
        </Link>

        {/* Floating glass review card */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ delay: 0.6, duration: 1, ease: EASE }}
          className="absolute right-10 top-28 w-64"
        >
          <div className="animate-float rounded-2xl border border-white/20 bg-white/10 p-4 text-cream shadow-lift backdrop-blur-xl">
          <div className="flex gap-0.5" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-gold-light text-gold-light" aria-hidden />
            ))}
          </div>
          <p className="mt-2 text-sm leading-snug text-cream/90">“Best balayage I've ever had — I walked out glowing.”</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cream/50">Sneha · Verified client</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: EASE }}
          className="absolute bottom-0 left-0 max-w-lg p-12 text-cream"
        >
          <p className="font-display text-4xl leading-snug !text-cream">“{quote}”</p>
          <p className="mt-4 flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-gold-light">
            <span className="h-px w-10 bg-gold" aria-hidden /> Luxe Hair Studio
          </p>
        </motion.div>
      </aside>

      <div className="relative flex flex-col overflow-hidden px-6 py-8 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gold-light/40 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.25em] text-ink lg:hidden">
            LUXE HAIR
          </Link>
          <Link to="/" className="group ml-auto inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden /> Back to site
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center py-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="w-full max-w-md"
          >
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
              className="font-display text-5xl font-medium"
            >
              {title}
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
              className="mt-3 text-muted"
            >
              {subtitle}
            </motion.p>
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
              className="mt-8"
            >
              {children}
            </motion.div>
            {footer && (
              <motion.div
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.7 } } }}
                className="mt-8 text-center text-sm text-muted"
              >
                {footer}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/** Password input with show/hide toggle. */
export function PasswordInput({ id, value, onChange, autoComplete = "current-password", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} icon={Lock} type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-sand hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}
