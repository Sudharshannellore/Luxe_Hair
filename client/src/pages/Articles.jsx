import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, BookOpen, Calendar, Clock } from "lucide-react";
import api, { getErrorMessage, imageUrl } from "../lib/api";
import { Badge, Button, EmptyState, Modal, Skeleton, cx } from "../components/ui";
import { Parallax, Reveal, TiltCard } from "../components/fx";
import CinematicHeader from "../components/CinematicHeader";

const FALLBACK = "https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=1200";
const PAGE_SIZE = 9;
const EASE = [0.22, 1, 0.36, 1];

const formatPublished = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

const readingTime = (text = "") => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tag, setTag] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [reading, setReading] = useState(null);

  useEffect(() => {
    api
      .get("/article/get")
      .then(({ data }) => setArticles(Array.isArray(data) ? data : []))
      .catch((err) => setError(getErrorMessage(err, "Couldn't load articles.")))
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => ["All", ...new Set(articles.flatMap((a) => a.tags || []).filter(Boolean))], [articles]);
  const filtered = tag === "All" ? articles : articles.filter((a) => a.tags?.includes(tag));
  const [featured, ...rest] = filtered;

  return (
    <>
      <CinematicHeader
        eyebrow="The journal"
        title="Hair care, *beautifully* explained"
        description="Expert advice, treatment guides and seasonal trends — straight from our stylists' chairs."
        image="https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1600"
      >
        {!loading && articles.length > 0 && (
          <p className="text-sm text-cream/60">
            <span className="font-display text-3xl text-gold-light">{articles.length}</span> stories ·{" "}
            {tags.length - 1} topics
          </p>
        )}
      </CinematicHeader>

      <section className="container-page py-14 md:py-20">
        {tags.length > 2 && (
          <Reveal className="mb-12">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTag(t);
                    setVisible(PAGE_SIZE);
                  }}
                  aria-pressed={tag === t}
                  className={cx(
                    "relative rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    tag === t ? "border-ink text-cream" : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink"
                  )}
                >
                  {tag === t && (
                    <motion.span
                      layoutId="article-tag-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative">{t}</span>
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-[28rem] rounded-card" />
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-card" />
              ))}
            </div>
          </div>
        ) : error ? (
          <EmptyState icon={BookOpen} title="Articles are unavailable" description={error} />
        ) : !featured ? (
          <EmptyState icon={BookOpen} title="No articles yet" description="Our stylists are writing — check back soon." />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tag}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <FeaturedArticle article={featured} onOpen={() => setReading(featured)} />

              {rest.length > 0 && (
                <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                  {rest.slice(0, visible).map((a, i) => (
                    <motion.div
                      key={a._id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: EASE }}
                    >
                      <ArticleCard article={a} onOpen={() => setReading(a)} />
                    </motion.div>
                  ))}
                </div>
              )}

              {rest.length > visible && (
                <div className="mt-14 flex justify-center">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more articles
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      <Modal open={Boolean(reading)} onClose={() => setReading(null)} size="xl" title={reading?.title}>
        {reading && <ArticleReader article={reading} />}
      </Modal>
    </>
  );
}

function Meta({ article, className }) {
  return (
    <p className={cx("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs", className)}>
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        {formatPublished(article.publishDate || article.createdAt)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {readingTime(article.content)} min read
      </span>
    </p>
  );
}

function FeaturedArticle({ article, onOpen }) {
  return (
    <article className="group relative isolate min-h-[30rem] overflow-hidden rounded-[2rem] bg-ink shadow-lift md:min-h-[34rem]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Parallax speed={0.12} className="absolute -inset-y-[15%] inset-x-0">
          <img
            src={imageUrl(article.image, FALLBACK)}
            alt=""
            className="h-full w-full object-cover transition duration-[1.4s] ease-out group-hover:scale-105"
          />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
      </div>

      <div className="flex h-full min-h-[30rem] flex-col justify-end p-7 md:min-h-[34rem] md:p-12">
        <Reveal>
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold" className="!bg-gold !text-white">Featured story</Badge>
            {article.tags?.slice(0, 2).map((t) => (
              <Badge key={t} className="!bg-white/10 !text-cream backdrop-blur">{t}</Badge>
            ))}
          </div>
          <h2 className="mt-5 max-w-3xl font-display text-4xl font-medium leading-[1.05] !text-cream md:text-5xl">{article.title}</h2>
          <p className="mt-4 line-clamp-2 max-w-2xl leading-relaxed text-cream/75">{article.context}</p>
          <div className="mt-7 flex flex-wrap items-center gap-6">
            <button
              onClick={onOpen}
              className="group/btn shine relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-cream px-6 text-sm font-medium text-ink shadow-soft transition hover:bg-white"
            >
              Read the story
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </button>
            <Meta article={article} className="text-cream/60" />
          </div>
        </Reveal>
      </div>
    </article>
  );
}

function ArticleCard({ article, onOpen }) {
  return (
    <article className="group flex h-full flex-col">
      <TiltCard max={6} className="rounded-card">
        <button
          onClick={onOpen}
          className="shine relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-sand shadow-soft"
          aria-label={`Read ${article.title}`}
        >
          <img
            src={imageUrl(article.image, FALLBACK)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-3 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-lift transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </button>
      </TiltCard>
      <div className="mt-5 flex flex-1 flex-col">
        {article.tags?.[0] && <p className="eyebrow">{article.tags[0]}</p>}
        <h3 className="mt-2 font-display text-2xl leading-snug">
          <button onClick={onOpen} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat text-left transition-[background-size,color] duration-500 hover:bg-[length:100%_1px] hover:text-gold-dark">
            {article.title}
          </button>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{article.context}</p>
        <Meta article={article} className="mt-4 text-muted" />
      </div>
    </article>
  );
}

function ArticleReader({ article }) {
  return (
    <div className="-mx-6 -mt-5">
      <div className="relative h-64 overflow-hidden md:h-80">
        <motion.img
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          src={imageUrl(article.image, FALLBACK)}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        className="mx-auto max-w-2xl px-6 pb-10"
      >
        <Meta article={article} className="text-muted" />
        {article.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <Badge key={t} tone="gold">{t}</Badge>
            ))}
          </div>
        )}
        {article.context && (
          <p className="mt-6 border-l-2 border-gold pl-5 font-display text-2xl italic leading-snug text-ink">{article.context}</p>
        )}
        <div className="mt-8 space-y-5 text-base leading-8 text-ink-soft first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-gold-dark">
          {(article.content || "")
            .split(/\n\s*\n/)
            .filter((p) => p.trim())
            .map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p.trim()}
              </p>
            ))}
        </div>
      </motion.div>
    </div>
  );
}
