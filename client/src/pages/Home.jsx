import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gem,
  Leaf,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import api, { imageUrl } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import { Avatar, Button, Skeleton, Stars, cx } from "../components/ui";
import {
  AmbientBlobs,
  BeforeAfter,
  CountUp,
  Grain,
  Magnetic,
  Marquee,
  Parallax,
  Reveal,
  SplitText,
  Spotlight,
  Stagger,
  StaggerItem,
  TiltCard,
} from "../components/fx";

const px = (id, w = 1200) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const HERO = { main: px(3065209, 1100), side: px(3993449, 700), small: px(7755226, 600) };
const TRANSFORM_IMAGE = px(3764119, 1200);
const CTA_IMAGE = px(3993133, 1800);
const FALLBACK_IMAGE = px(3065171, 900);

const MARQUEE_WORDS = ["Balayage", "Keratin", "Hair Spa", "Bridal Styling", "Scalp Detox", "Precision Cuts", "Curl Care", "Gloss & Tone"];

const PROMISES = [
  { icon: Leaf, title: "Clean formulas", text: "Ammonia-free colour and sulphate-free care." },
  { icon: ShieldCheck, title: "Certified stylists", text: "Every artist trained in advanced techniques." },
  { icon: Gem, title: "Luxury, not fuss", text: "Calm studio, honest advice, zero upselling." },
];

const STEPS = [
  { icon: Scissors, title: "Choose your ritual", text: "Browse treatments or save with a curated combo package." },
  { icon: CalendarCheck, title: "Pick your moment", text: "Live availability — reserve the slot that suits you in seconds." },
  { icon: Sparkles, title: "Relax & glow", text: "Pay online or at the studio. We take care of everything else." },
];

const IconSlot = ({ icon, ...props }) => {
  const Icon = icon;
  return <Icon {...props} />;
};

/** Fetches a list endpoint; returns { data, loading }. Failures resolve to an empty list. */
function useList(url) {
  const [state, setState] = useState({ data: [], loading: true });
  useEffect(() => {
    let alive = true;
    api
      .get(url)
      .then(({ data }) => alive && setState({ data: Array.isArray(data) ? data : [], loading: false }))
      .catch(() => alive && setState({ data: [], loading: false }));
    return () => {
      alive = false;
    };
  }, [url]);
  return state;
}

export default function Home() {
  const services = useList("/service/get");
  const combos = useList("/package/get");
  const reviews = useList("/review/public?limit=12");
  const staff = useList("/staff/public");
  const articles = useList("/article/get");

  const avgRating = reviews.data.length ? reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length : 4.9;

  return (
    <div className="overflow-x-clip">
      <Hero reviews={reviews.data} avgRating={avgRating} services={services.data} />
      <WordBand />
      <Stats services={services.data.length} staff={staff.data.length} rating={avgRating} />
      <ServicesShowcase services={services} />
      <Transformation />
      <Journey />
      <CombosSection combos={combos} />
      {(reviews.loading || reviews.data.length > 0) && <Testimonials reviews={reviews} />}
      {!staff.loading && staff.data.length > 0 && <Stylists staff={staff.data} />}
      {!articles.loading && articles.data.length > 0 && <Journal articles={articles.data.slice(0, 3)} />}
      <FinalCta />
    </div>
  );
}

/* ------------------------------------------------------------------ Hero */

function Hero({ reviews, avgRating, services }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const imgSideY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const imgSmallY = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);

  const faces = reviews.filter((r) => r.userImage).slice(0, 4);
  const featured = services.find((s) => s.category === "Colour") || services[0];

  return (
    <section ref={ref} className="relative isolate min-h-[100svh] overflow-hidden bg-ink pt-28 text-cream md:pt-32">
      <AmbientBlobs />
      <Grain opacity={0.1} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,87,0.18),transparent_60%)]" aria-hidden />

      <div className="container-page relative grid items-center gap-14 pb-24 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* Copy */}
        <motion.div style={{ y: contentY, opacity: contentOpacity }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-light backdrop-blur"
          >
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-gold" aria-hidden />
            Now booking · Premium hair studio
          </motion.p>

          <SplitText
            animateOnMount
            delay={0.15}
            text="Hair that turns *heads,* care that lasts."
            className="mt-7 font-display text-[2.75rem] font-medium leading-[0.98] !text-cream sm:text-6xl xl:text-7xl"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-7 max-w-lg text-base leading-relaxed text-cream/65 md:text-lg"
          >
            Colour artistry, precision cuts and restorative rituals by expert stylists — in a calm studio designed entirely around you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <Button to="/services" variant="gold" size="lg" className="group relative overflow-hidden shine">
                Book an appointment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Magnetic>
            <Button to="/combos" variant="outline" size="lg" className="!border-white/20 !bg-white/5 !text-cream backdrop-blur hover:!bg-white/10">
              Explore combos
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-12 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {faces.length
                ? faces.map((r) => <Avatar key={r._id} name={r.username} image={r.userImage} size="md" className="!ring-ink" />)
                : ["S", "K", "R"].map((l) => (
                    <span key={l} className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-light text-sm font-semibold text-gold-dark ring-2 ring-ink">
                      {l}
                    </span>
                  ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Stars value={5} size="h-3.5 w-3.5" />
                <span className="text-sm font-semibold text-cream">{avgRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-cream/55">Loved by our clients</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Collage */}
        <div className="relative mx-auto h-[30rem] w-full max-w-xl sm:h-[31rem] lg:h-[34rem]">
          <motion.div
            style={{ y: imgY }}
            initial={{ opacity: 0, scale: 0.92, clipPath: "inset(100% 0 0 0 round 999px 999px 24px 24px)" }}
            animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0 0 0 round 999px 999px 24px 24px)" }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute right-0 top-0 h-[86%] w-[68%] overflow-hidden arch shadow-lift"
          >
            <img src={HERO.main} alt="Stylist creating soft curls" className="h-full w-full scale-110 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
          </motion.div>

          <motion.div
            style={{ y: imgSideY }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 left-0 h-[46%] w-[44%] overflow-hidden rounded-[2rem] border-4 border-ink shadow-lift"
          >
            <img src={HERO.side} alt="Relaxing hair spa wash" className="h-full w-full object-cover" />
          </motion.div>

          <motion.div
            style={{ y: imgSmallY }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute left-[12%] top-[6%] hidden h-28 w-28 overflow-hidden rounded-full border-4 border-ink shadow-lift sm:block"
          >
            <img src={HERO.small} alt="" className="h-full w-full object-cover" />
          </motion.div>

          {/* Rotating badge */}
          <motion.div
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="absolute -right-2 bottom-[18%] hidden h-32 w-32 sm:block"
            aria-hidden
          >
            <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow">
              <defs>
                <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text fontSize="9.5" letterSpacing="3.2" fill="#d9bf8c" fontFamily="Inter, sans-serif" fontWeight="600">
                <textPath href="#circle">LUXE HAIR · STUDIO · EST 2020 ·</textPath>
              </text>
            </svg>
            <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-lift">
              <Sparkles className="h-6 w-6" />
            </span>
          </motion.div>

          {/* Floating glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.25 }}
            className="absolute left-[38%] top-[44%] animate-float rounded-2xl border border-white/15 bg-white/10 p-3.5 pr-5 shadow-lift backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-white">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-cream/60">Next available</p>
                <p className="text-sm font-semibold text-cream">Today · 3:00 PM</p>
              </div>
            </div>
          </motion.div>

          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.45 }}
              className="absolute -bottom-2 right-[6%] animate-float rounded-2xl bg-cream p-3 pr-5 text-ink shadow-lift [animation-delay:-3s]"
            >
              <div className="flex items-center gap-3">
                <img src={imageUrl(featured.image, FALLBACK_IMAGE)} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted">Trending</p>
                  <p className="text-sm font-semibold">{featured.title}</p>
                  <p className="text-xs text-gold-dark">from {formatCurrency(featured.price)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-cream/40 md:flex"
        aria-hidden
      >
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-gold"
            animate={{ y: ["-100%", "250%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ Word band */

function WordBand() {
  return (
    <section aria-label="Our specialities" className="relative -mt-px overflow-hidden bg-gold py-5 text-ink">
      <div className="-rotate-1 scale-105">
        <Marquee speed={35}>
          {MARQUEE_WORDS.map((w) => (
            <span key={w} className="flex items-center gap-8 px-4 font-display text-3xl italic md:text-5xl">
              {w}
              <Sparkles className="h-5 w-5 text-ink/60" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Stats */

function Stats({ services, staff, rating }) {
  const stats = [
    { value: 2400, suffix: "+", label: "Happy clients" },
    { value: services || 11, suffix: "", label: "Signature services" },
    { value: staff || 5, suffix: "", label: "Expert stylists" },
    { value: rating, suffix: "★", label: "Average rating", decimals: 1 },
  ];
  return (
    <section className="relative bg-cream py-20">
      <div className="container-page">
        <Stagger className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StaggerItem key={s.label} className={cx("text-center", i > 0 && "lg:border-l lg:border-line")}>
              <p className="font-display text-5xl font-semibold text-ink md:text-5xl">
                <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-muted">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="mt-16 grid gap-4 md:grid-cols-3" gap={0.12}>
          {PROMISES.map((p) => (
            <StaggerItem key={p.title}>
              <Spotlight className="h-full rounded-card border border-line/70 bg-white p-6 shadow-soft">
                <div className="relative z-10 flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-gold-light">
                    <IconSlot icon={p.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted">{p.text}</p>
                  </div>
                </div>
              </Spotlight>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Section title */

function Title({ eyebrow, text, description, light, action }) {
  return (
    <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Reveal>
          <p className={cx("eyebrow mb-4 flex items-center gap-3", light && "!text-gold-light")}>
            <span className="h-px w-10 bg-current" aria-hidden />
            {eyebrow}
          </p>
        </Reveal>
        <SplitText as="h2" text={text} className={cx("font-display text-4xl font-medium leading-[1.05] md:text-5xl", light && "!text-cream")} />
        {description && (
          <Reveal delay={0.2}>
            <p className={cx("mt-5 text-base leading-relaxed md:text-lg", light ? "text-cream/60" : "text-muted")}>{description}</p>
          </Reveal>
        )}
      </div>
      {action && <Reveal delay={0.25}>{action}</Reveal>}
    </div>
  );
}

/* ------------------------------------------------------------------ Services */

function ServicesShowcase({ services }) {
  const list = services.data.slice(0, 5);
  const spans = ["md:col-span-2 md:row-span-2", "", "", "", ""]; // 1 hero tile + 4 tiles = two full rows

  return (
    <section className="bg-cream pb-20">
      <div className="container-page">
        <Title
          eyebrow="Signature services"
          text="Rituals crafted for *your* hair."
          description="From precision cuts to hand-painted colour and restorative spa rituals — every service begins with a personal consultation."
          action={
            <Button to="/services" variant="outline" className="group">
              All services <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Button>
          }
        />

        {services.loading ? (
          <div className="grid gap-5 md:grid-cols-4 md:auto-rows-[260px]">
            {spans.map((span, i) => (
              <Skeleton key={i} className={cx("h-64 rounded-card md:h-auto", span)} />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-5 md:grid-cols-4 md:auto-rows-[260px]" gap={0.08}>
            {list.map((s, i) => (
              <StaggerItem key={s._id} className={cx("h-72 md:h-auto", spans[i])}>
                <TiltCard max={5} className="h-full rounded-card">
                  <Link
                    to="/services"
                    state={{ serviceId: s._id }}
                    className="group relative flex h-full flex-col justify-end overflow-hidden rounded-card bg-ink shine"
                  >
                    <img
                      src={imageUrl(s.image, FALLBACK_IMAGE)}
                      alt={s.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {formatCurrency(s.price)}
                    </span>
                    <div className="relative p-6 text-cream">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">{s.category}</p>
                      <h3 className={cx("mt-2 font-display font-medium !text-cream", i === 0 ? "text-4xl md:text-5xl" : "text-2xl")}>{s.title}</h3>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-cream/70">
                          <Clock className="h-3.5 w-3.5" /> {s.duration}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-gold-light opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:-translate-x-3">
                          Book now <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                      {i === 0 && <p className="mt-3 line-clamp-2 max-w-md text-sm text-cream/65">{s.description}</p>}
                    </div>
                  </Link>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Before / after */

function Transformation() {
  return (
    <section className="relative overflow-hidden bg-sand py-20">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <Reveal x={-30} y={0}>
          <BeforeAfter
            before={TRANSFORM_IMAGE}
            after={TRANSFORM_IMAGE}
            beforeClassName="grayscale-[85%] contrast-[0.85] brightness-[0.9] blur-[0.4px]"
            beforeLabel="Dull & dry"
            afterLabel="Luxe glow"
            alt="Glossy, vibrant red hair after a colour and gloss treatment"
            className="aspect-[4/5] w-full rounded-[2rem] shadow-lift"
          />
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-current" aria-hidden /> The transformation
            </p>
          </Reveal>
          <SplitText as="h2" text="Drag to see the *difference.*" className="font-display text-4xl font-medium leading-[1.05] md:text-5xl" />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
              Our gloss and colour rituals restore shine, depth and movement in a single visit — with formulas gentle enough for every week.
            </p>
          </Reveal>
          <Stagger className="mt-8 space-y-4" gap={0.1}>
            {[
              ["3×", "more shine after a single gloss ritual"],
              ["8 wks", "of vibrant, long-lasting colour"],
              ["0%", "ammonia in our colour formulas"],
            ].map(([n, t]) => (
              <StaggerItem key={t} className="flex items-baseline gap-4 border-b border-line pb-4">
                <span className="w-24 shrink-0 font-display text-3xl font-semibold text-gold-gradient">{n}</span>
                <span className="text-sm text-ink-soft">{t}</span>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.3}>
            <Button to="/services" variant="primary" className="group mt-8">
              Book a colour consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Journey (how it works) */

function Journey() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} className="bg-cream py-20">
      <div className="container-page">
        <Title eyebrow="How it works" text="Three steps to your *best* hair day." />
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-line md:block" aria-hidden>
            <motion.div style={{ scaleX: lineScale }} className="h-full origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
          </div>
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.15} className="relative">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-gold-light shadow-lift">
                <IconSlot icon={s.icon} className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-white ring-4 ring-cream">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Combos */

function CombosSection({ combos }) {
  const list = combos.data.slice(0, 3);
  const featuredIndex = list.length === 3 ? 1 : -1;

  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-cream">
      <AmbientBlobs />
      <Grain />
      <div className="container-page relative">
        <Title
          light
          eyebrow="Combo packages"
          text="More rituals, *less* spend."
          description="Bundle your favourite services, save up to ₹2,000 and redeem each visit whenever it suits you."
        />

        {combos.loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[30rem] rounded-card !bg-white/5" />
            ))}
          </div>
        ) : (
          <Stagger className="grid items-stretch gap-6 lg:grid-cols-3" gap={0.12}>
            {list.map((c, i) => {
              const featured = i === featuredIndex;
              return (
                <StaggerItem key={c._id} className={cx(featured && "lg:-translate-y-6")}>
                  <TiltCard max={4} className="h-full rounded-[1.75rem]">
                    <div className={cx("h-full rounded-[1.75rem]", featured && "glow-border")}>
                      <div
                        className={cx(
                          "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border",
                          featured ? "border-transparent bg-cream text-ink" : "border-white/10 bg-white/[0.04] backdrop-blur"
                        )}
                      >
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={imageUrl(c.image, FALLBACK_IMAGE)}
                            alt={c.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                          />
                          <div className={cx("absolute inset-0 bg-gradient-to-t", featured ? "from-cream via-cream/10" : "from-ink via-ink/20", "to-transparent")} />
                          {featured && (
                            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white shadow-lift">
                              <Star className="h-3.5 w-3.5 fill-current" /> Most popular
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-7 pt-2">
                          <h3 className={cx("font-display text-3xl font-semibold", !featured && "!text-cream")}>{c.title}</h3>
                          <p className={cx("mt-1 text-sm", featured ? "text-muted" : "text-cream/60")}>{c.subtitle}</p>
                          <p className="mt-6 flex items-baseline gap-2">
                            <span className={cx("font-display text-5xl font-semibold", featured ? "text-ink" : "text-gold-gradient")}>
                              <CountUp to={c.price} prefix="₹" />
                            </span>
                            <span className={cx("text-xs", featured ? "text-muted" : "text-cream/50")}>/ {c.validityDays || 30} days</span>
                          </p>
                          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                            {c.services.map((name) => (
                              <li key={name} className="flex items-center gap-3">
                                <span className={cx("flex h-5 w-5 items-center justify-center rounded-full", featured ? "bg-gold text-white" : "bg-gold/20 text-gold-light")}>
                                  <Sparkles className="h-3 w-3" />
                                </span>
                                <span className={featured ? "text-ink-soft" : "text-cream/80"}>{name}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            to="/combos"
                            variant={featured ? "gold" : "light"}
                            className={cx("group/btn mt-8 w-full", featured && "relative overflow-hidden shine")}
                          >
                            Choose {c.title} <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Testimonials */

function Testimonials({ reviews }) {
  const list = reviews.data;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = list[index % Math.max(list.length, 1)];

  useEffect(() => {
    if (paused || list.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [paused, list.length]);

  const go = (d) => setIndex((i) => (i + d + list.length) % list.length);

  return (
    <section className="relative overflow-hidden bg-cream py-20">
      <div className="container-page">
        <Title eyebrow="Client love" text="Words from our *chair.*" />

        {reviews.loading ? (
          <Skeleton className="h-72 rounded-[2rem]" />
        ) : (
          <div
            className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-soft md:p-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Quote className="absolute right-8 top-8 h-24 w-24 text-gold/10 md:h-40 md:w-40" aria-hidden />
            <div className="relative min-h-[14rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.figure
                  key={current?._id || index}
                  initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Stars value={current?.rating || 5} size="h-5 w-5" />
                  <blockquote className="mt-6 max-w-4xl font-display text-2xl leading-snug text-ink md:text-4xl">“{current?.comment}”</blockquote>
                  <figcaption className="mt-8 flex items-center gap-4">
                    <Avatar name={current?.username} image={current?.userImage} size="lg" />
                    <div>
                      <p className="font-semibold text-ink">{current?.username}</p>
                      {current?.about && <p className="text-sm text-muted">{current.about}</p>}
                    </div>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>

            {list.length > 1 && (
              <div className="relative mt-10 flex items-center justify-between gap-4">
                <div className="flex flex-1 gap-1.5">
                  {list.map((r, i) => (
                    <button
                      key={r._id}
                      onClick={() => setIndex(i)}
                      aria-label={`Show review ${i + 1}`}
                      className="relative h-1 flex-1 overflow-hidden rounded-full bg-line"
                    >
                      {i === index && (
                        <motion.span
                          key={`${index}-${paused}`}
                          className="absolute inset-y-0 left-0 bg-gold"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: paused ? 0 : 6, ease: "linear" }}
                        />
                      )}
                      {i < index && <span className="absolute inset-0 bg-gold/50" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => go(-1)} className="rounded-full border border-line p-3 transition hover:border-ink hover:bg-ink hover:text-cream" aria-label="Previous review">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => go(1)} className="rounded-full border border-line p-3 transition hover:border-ink hover:bg-ink hover:text-cream" aria-label="Next review">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {list.length > 3 && (
        <div className="mt-12 space-y-4">
          <Marquee speed={60}>
            {list.map((r) => (
              <MiniReview key={r._id} review={r} />
            ))}
          </Marquee>
        </div>
      )}
    </section>
  );
}

function MiniReview({ review }) {
  return (
    <div className="mx-2 flex w-80 items-start gap-3 rounded-2xl border border-line/70 bg-white p-4 shadow-soft">
      <Avatar name={review.username} image={review.userImage} size="sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{review.username}</p>
          <Stars value={review.rating} size="h-3 w-3" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{review.comment}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Stylists */

function Stylists({ staff }) {
  return (
    <section className="bg-sand py-20">
      <div className="container-page">
        <Title eyebrow="The artists" text="Meet the hands behind the *magic.*" />
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5" gap={0.1}>
          {staff.map((s, i) => (
            <StaggerItem key={s._id} className={cx(i % 2 === 1 && "lg:translate-y-10")}>
              <div className="group">
                <div className="relative aspect-[3/4] overflow-hidden arch bg-ink">
                  <img
                    src={imageUrl(s.image, FALLBACK_IMAGE)}
                    alt={s.name}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink to-transparent p-5 pt-12 transition-transform duration-500 group-hover:translate-y-0">
                    <p className="text-xs text-cream/80">{s.experience} experience</p>
                  </div>
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold">{s.name}</h3>
                <p className="mt-1 text-sm text-gold-dark">{s.specialization}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Journal */

function Journal({ articles }) {
  return (
    <section className="bg-cream pb-20 pt-28">
      <div className="container-page">
        <Title
          eyebrow="The journal"
          text="Notes on *beautiful* hair."
          action={
            <Button to="/articles" variant="outline" className="group">
              Read the journal <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Button>
          }
        />
        <Stagger className="grid gap-8 md:grid-cols-3" gap={0.12}>
          {articles.map((a) => (
            <StaggerItem key={a._id}>
              <Link to="/articles" className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-card shine">
                  <img
                    src={imageUrl(a.image, FALLBACK_IMAGE)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                  />
                </div>
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  {formatDate(a.publishDate)} · {(a.tags || [])[0] || "Hair care"}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-snug transition-colors group-hover:text-gold-dark">{a.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{a.context}</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Final CTA */

function FinalCta() {
  return (
    <section className="bg-cream px-4 pb-24 sm:px-6 lg:px-8">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-24 text-center text-cream md:py-24">
        <Parallax speed={0.18} className="absolute inset-[-15%] -z-10">
          <img src={CTA_IMAGE} alt="" className="h-full w-full object-cover opacity-30" />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/90" aria-hidden />
        <AmbientBlobs className="-z-10 opacity-70" />
        <Grain />
        <Reveal>
          <p className="eyebrow !text-gold-light">Your chair is waiting</p>
        </Reveal>
        <SplitText as="h2" text="Your best hair day starts *here.*" className="mx-auto mt-5 max-w-4xl font-display text-5xl font-medium leading-[1.02] !text-cream md:text-6xl" />
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-cream/65">Book in under a minute. Pay online or at the studio — and enjoy 15% off your first visit with WELCOME15.</p>
        </Reveal>
        <Reveal delay={0.3} className="mt-10 flex flex-wrap justify-center gap-4">
          <Magnetic>
            <Button to="/services" variant="gold" size="lg" className="group relative overflow-hidden shine">
              Book your visit <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Magnetic>
          <Button to="/offers" variant="outline" size="lg" className="!border-white/20 !bg-white/5 !text-cream hover:!bg-white/10">
            See offers
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
