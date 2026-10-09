/**
 * The Learning Library — trusted external education (SEBI Investor,
 * Zerodha Varsity). Cards link out; nothing is copied or claimed.
 * Renders after the Knowledge Hub on the Growth Simulator page.
 */
import { ArrowUpRight, BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { SECTION_ANCHORS } from "@/config/site";
import {
  LIBRARY_RESOURCES,
  RESOURCE_CATEGORIES,
  filterResources,
  type ResourceCategory,
} from "@/config/resources";
import { cn } from "@/lib/utils";
import { Eyebrow, Reveal } from "./Reveal";

export function LearningLibrary() {
  const [category, setCategory] = useState<ResourceCategory>("All Resources");
  const resources = useMemo(() => filterResources(LIBRARY_RESOURCES, category), [category]);

  return (
    <section
      id={SECTION_ANCHORS.learningLibrary}
      aria-labelledby="library-heading"
      className="relative scroll-mt-20 border-t border-white/10 bg-background"
    >
      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <Reveal className="max-w-2xl">
          <Eyebrow>THE LEARNING LIBRARY</Eyebrow>
          <h2
            id="library-heading"
            className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl"
          >
            Go beyond the basics.
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Learn at your own pace with trusted guides on investing, mutual funds, risk, and
            managing your money.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div
            role="group"
            aria-label="Filter resources by topic"
            className="mt-8 flex flex-wrap gap-2"
          >
            {RESOURCE_CATEGORIES.map((c) => (
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
            Showing {resources.length} of {LIBRARY_RESOURCES.length} resources
            {category !== "All Resources" ? ` in ${category}` : ""}.
          </p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {resources.map((r, i) => (
            <Reveal key={r.id} delay={Math.min(i, 3) * 80} className="h-full">
              <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-surface/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgb(0_230_184/0.35)]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
                  {r.publisher.toUpperCase()}
                </p>
                <h3 className="mt-1.5 font-display text-[17px] font-bold leading-snug tracking-tight text-foreground">
                  {r.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
                <p className="mt-3 text-xs font-semibold text-primary">
                  {r.categories.join(" · ")}
                </p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read article: ${r.title} (opens ${r.publisher} in a new tab)`}
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  Read article
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            These guides live on their publishers&apos; websites — First Step doesn&apos;t own or
            author them. Prefer credible sources over social-media tips and unverified finfluencers.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
