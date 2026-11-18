import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Scissors } from "lucide-react";
import { AmbientBlobs, Grain, Magnetic } from "../components/fx";

const EASE = [0.22, 1, 0.36, 1];

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[90vh] items-center overflow-hidden bg-ink pt-24 text-cream">
      <AmbientBlobs className="-z-10" />
      <Grain className="-z-10" />

      <div className="container-page relative text-center">
        <div className="relative mx-auto inline-block">
          <motion.p
            initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            className="text-gold-gradient select-none font-display text-[7rem] font-semibold leading-none md:text-[11rem]"
            aria-hidden
          >
            4
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              0
            </motion.span>
            4
          </motion.p>
          <motion.span
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
            className="absolute -right-6 top-6 md:-right-10"
            aria-hidden
          >
            <span className="flex h-16 w-16 animate-float items-center justify-center rounded-full bg-white/10 text-gold-light ring-1 ring-white/20 backdrop-blur md:h-20 md:w-20">
              <Scissors className="h-8 w-8 -rotate-45 md:h-10 md:w-10" />
            </span>
          </motion.span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
        >
          <h1 className="mt-2 font-display text-4xl !text-cream md:text-5xl">
            This page took a <span className="text-gold-gradient italic">day off</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-cream/65">
            The page you're looking for doesn't exist or has moved. Let's get you back somewhere beautiful.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic>
              <Link
                to="/"
                className="group shine relative inline-flex h-13 items-center gap-2 overflow-hidden rounded-full bg-gold px-8 text-base font-medium text-white shadow-lift transition hover:bg-gold-dark"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to home
              </Link>
            </Magnetic>
            <Link
              to="/services"
              className="inline-flex h-13 items-center rounded-full border border-white/25 px-8 text-base font-medium text-cream transition hover:bg-white/10"
            >
              Browse services
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
