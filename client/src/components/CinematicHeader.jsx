import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { AmbientBlobs, Grain, SplitText } from "./fx";
import { cx } from "./ui";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Dark, animated page header: drifting gold blobs, film grain, a faint parallax
 * photo and a word-by-word title. Wrap a word in *asterisks* for the gold accent.
 *
 * <CinematicHeader eyebrow="Journal" title="Stories for *healthier* hair" description="…" image={url}>
 *   …optional extra content (buttons, stats)…
 * </CinematicHeader>
 */
export default function CinematicHeader({ eyebrow, title, description, image, children, className, align = "left" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const fade = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  return (
    <header ref={ref} className={cx("relative isolate overflow-hidden bg-ink pb-16 pt-32 text-cream md:pb-24 md:pt-36", className)}>
      {image && (
        <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 -z-10" aria-hidden>
          <img src={image} alt="" className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
        </motion.div>
      )}
      <AmbientBlobs className="-z-10" />
      <Grain className="-z-10" />

      {/* Decorative rotating ring */}
      <div aria-hidden className="pointer-events-none absolute -right-24 top-16 -z-10 hidden h-[26rem] w-[26rem] animate-spin-slow rounded-full border border-dashed border-gold/20 md:block" />
      <div aria-hidden className="pointer-events-none absolute -right-10 top-32 -z-10 hidden h-[18rem] w-[18rem] rounded-full border border-gold/10 md:block" />

      <motion.div style={{ opacity: fade }} className={cx("container-page relative", align === "center" && "text-center")}>
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className={cx(
              "mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-light backdrop-blur",
              align === "center" && "mx-auto"
            )}
          >
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gold" aria-hidden />
            {eyebrow}
          </motion.p>
        )}
        <SplitText
          text={title}
          animateOnMount
          delay={0.1}
          className={cx(
            "max-w-4xl font-display text-5xl font-medium leading-[1.02] !text-cream sm:text-5xl md:text-6xl",
            align === "center" && "mx-auto"
          )}
        />
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
            className={cx("mt-6 max-w-2xl text-base leading-relaxed text-cream/70 md:text-lg", align === "center" && "mx-auto")}
          >
            {description}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </header>
  );
}
