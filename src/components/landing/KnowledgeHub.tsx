/**
 * Section 2 — The First Step Knowledge Hub.
 * Working category filters + accessible modal playback of real,
 * verified YouTube lessons (see src/config/videos.ts).
 */
import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { HUB_VIDEOS, VIDEO_CATEGORIES, videoLinks, type VideoCategory } from "@/config/videos";
import { SECTION_ANCHORS } from "@/config/site";
import { filterVideos } from "@/lib/learn";
import { cn } from "@/lib/utils";
import { Eyebrow, Reveal } from "./Reveal";
import { VideoModal } from "./VideoModal";

export function KnowledgeHub() {
  const [category, setCategory] = useState<VideoCategory>("All Videos");
  const [activeId, setActiveId] = useState<string | null>(null);

  const videos = useMemo(() => filterVideos(HUB_VIDEOS, category), [category]);
  const active = HUB_VIDEOS.find((v) => v.id === activeId) ?? null;

  return (
    <section
      id={SECTION_ANCHORS.knowledgeHub}
      aria-labelledby="hub-heading"
      className="relative scroll-mt-20 border-t border-white/10 bg-background-secondary"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-[#00e6b8]/[0.05] blur-[130px]"
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="max-w-2xl">
          <Eyebrow>THE FIRST STEP KNOWLEDGE HUB</Eyebrow>
          <h2
            id="hub-heading"
            className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl"
          >
            Your money education starts here.
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Understand the market, learn the fundamentals, and make more informed financial
            decisions — one concept at a time.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div
            role="group"
            aria-label="Filter videos by category"
            className="mt-8 flex flex-wrap gap-2"
          >
            {VIDEO_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-medium transition-all duration-200",
                  category === c
                    ? "border-primary bg-primary font-semibold text-primary-foreground shadow-[0_0_24px_-6px_rgb(0_230_184/0.6)]"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/25 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mt-3 text-[13px] text-muted-foreground">
            Showing {videos.length} of {HUB_VIDEOS.length} lessons
            {category !== "All Videos" ? ` in ${category}` : ""}.
          </p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {videos.map((v, i) => {
            const links = videoLinks(v.youtubeId);
            return (
              <Reveal key={v.id} delay={Math.min(i, 3) * 80} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgb(0_230_184/0.35)]">
                  <button
                    type="button"
                    onClick={() => setActiveId(v.id)}
                    aria-label={`Play ${v.title}`}
                    className="relative block w-full overflow-hidden text-left"
                  >
                    <span className="block aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={links.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        width={480}
                        height={360}
                        className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                      />
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_32px_rgb(0_230_184/0.6)] transition-transform duration-300 group-hover:scale-110"
                    >
                      <Play className="ml-0.5 h-6 w-6 fill-current" />
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-mint backdrop-blur-sm"
                    >
                      {v.category}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
                      {v.difficulty.toUpperCase()} · YOUTUBE
                    </p>
                    <h3 className="mt-1.5 font-display text-[17px] font-bold leading-snug tracking-tight text-foreground">
                      <button
                        type="button"
                        onClick={() => setActiveId(v.id)}
                        className="text-left transition-colors hover:text-primary"
                      >
                        {v.title}
                      </button>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {v.description}
                    </p>
                    <p className="mt-auto pt-3 text-xs text-muted-foreground/80">
                      Source: {v.source}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {active && <VideoModal video={active} onClose={() => setActiveId(null)} />}
      </div>
    </section>
  );
}
