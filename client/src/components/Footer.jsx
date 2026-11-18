import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Clock, Facebook, Instagram, Mail, MapPin, Phone, Sparkles, Twitter } from "lucide-react";
import { AmbientBlobs, Grain, Magnetic, Marquee, Reveal, Stagger, StaggerItem } from "./fx";

const EXPLORE = [
  { name: "Services", path: "/services" },
  { name: "Combo packages", path: "/combos" },
  { name: "Offers", path: "/offers" },
  { name: "Journal", path: "/articles" },
  { name: "Contact", path: "/contact" },
  { name: "My bookings", path: "/profile" },
];

const SOCIALS = [
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
];

const WORDS = ["Balayage", "Keratin", "Hair Spa", "Bridal Styling", "Precision Cuts", "Scalp Rituals", "Colour Craft"];

const IconSlot = ({ icon, ...props }) => {
  const Icon = icon;
  return <Icon {...props} />;
};

/** Giant wordmark whose letters rise and spread as the footer scrolls into view. */
function Wordmark() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["40%", "0%"]);
  const spacing = useTransform(scrollYProgress, [0, 1], ["-0.02em", "0.06em"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0.2, 1]);

  return (
    <div ref={ref} className="relative overflow-hidden" aria-hidden>
      <motion.p
        style={{ y, letterSpacing: spacing, opacity }}
        className="select-none whitespace-nowrap text-center font-display text-[16vw] font-semibold leading-[0.8] text-transparent [-webkit-text-stroke:1px_rgb(217_191_140/0.45)] lg:text-[12rem]"
      >
        LUXE <span className="text-gold-gradient [-webkit-text-stroke:0]">HAIR</span>
      </motion.p>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-cream/70">
      <AmbientBlobs className="opacity-60" />
      <Grain />

      {/* Scrolling band */}
      <div className="relative border-y border-white/10 py-5">
        <Marquee speed={45}>
          {WORDS.map((w) => (
            <span key={w} className="flex items-center gap-8 px-8 font-display text-3xl italic text-cream/80 md:text-4xl">
              {w}
              <Sparkles className="h-5 w-5 text-gold" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>

      <div className="container-page relative py-16 md:py-20">
        {/* CTA pill */}
        <Reveal className="mb-16 flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur md:flex-row md:items-center md:p-8">
          <div>
            <p className="eyebrow !text-gold-light">Your chair is waiting</p>
            <h2 className="mt-2 font-display text-3xl !text-cream md:text-4xl">
              Ready for your <span className="text-gold-gradient italic">best hair day?</span>
            </h2>
          </div>
          <Magnetic strength={0.25}>
            <Link
              to="/services"
              className="group shine relative inline-flex h-13 items-center gap-2 overflow-hidden rounded-full bg-gold px-7 text-base font-medium text-white shadow-lift transition hover:bg-gold-dark"
            >
              Book your visit
              <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
        </Reveal>

        <Stagger className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <StaggerItem className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Luxe Hair home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-display text-xl text-gold-light">L</span>
              <span className="font-display text-2xl tracking-[0.12em] text-cream">LUXE HAIR</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              A calm, considered hair studio. Expert colour, cuts and restorative treatments — designed around you.
            </p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ name, icon, href }) => (
                <motion.a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-cream/80 transition-colors hover:border-gold hover:bg-gold hover:text-white"
                >
                  <IconSlot icon={icon} className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem className="lg:col-span-2">
            <h3 className="eyebrow !text-gold-light">Explore</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {EXPLORE.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="group inline-flex items-center gap-1 transition hover:text-cream">
                    <span className="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3" aria-hidden />
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          <StaggerItem className="lg:col-span-3">
            <h3 className="eyebrow !text-gold-light">Visit us</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>123 Luxury Avenue, Beauty District</span>
              </li>
              <li>
                <a href="tel:+917890456132" className="flex gap-3 transition hover:text-cream">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  +91 78904 56132
                </a>
              </li>
              <li>
                <a href="mailto:hello@luxehair.com" className="flex gap-3 transition hover:text-cream">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  hello@luxehair.com
                </a>
              </li>
            </ul>
          </StaggerItem>

          <StaggerItem className="lg:col-span-3">
            <h3 className="eyebrow !text-gold-light">Opening hours</h3>
            <div className="mt-5 rounded-card border border-white/10 bg-white/5 p-5 text-sm backdrop-blur">
              <div className="flex items-center gap-3 text-cream">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <Clock className="h-4 w-4 text-gold" />
                Open every day
              </div>
              <dl className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <dt>Monday – Sunday</dt>
                  <dd className="text-cream">10:00 – 20:00</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last appointment</dt>
                  <dd className="text-cream">19:00</dd>
                </div>
              </dl>
            </div>
          </StaggerItem>
        </Stagger>
      </div>

      <Wordmark />

      <div className="container-page relative">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Luxe Hair. All rights reserved.</p>
          <p className="text-cream/50">Crafted with care for every crown.</p>
        </div>
      </div>
    </footer>
  );
}
