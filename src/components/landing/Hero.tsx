import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HERO_COPY, SECTION_ANCHORS } from "@/config/site";
import { HeroGraph } from "./HeroGraph";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-background"
    >
      {/* cinematic illumination */}
      <div aria-hidden="true" className="fs-illuminate pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#00e6b8]/[0.09] blur-[140px]" />
        <div className="absolute left-[-160px] top-1/3 h-[420px] w-[420px] rounded-full bg-[#00e6b8]/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-120px] h-[460px] w-[460px] rounded-full bg-[#65f5d2]/[0.05] blur-[130px]" />
        {/* fine hairline grid */}
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 75%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-14 pt-24 md:px-8 md:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6 lg:pb-24 lg:pt-36">
        {/* copy */}
        <div className="max-w-2xl">
          <p
            className="fs-rise inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-4 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground"
            style={{ animationDelay: "0.55s" }}
          >
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[10px] tracking-[0.14em] text-primary-foreground">
              NEW
            </span>
            {HERO_COPY.eyebrow}
          </p>

          <h1
            id="hero-heading"
            className="mt-6 font-display text-[36px] font-bold leading-[1.04] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[52px]"
          >
            <span className="fs-rise block" style={{ animationDelay: "0.7s" }}>
              {HERO_COPY.lines[0]}
            </span>
            <span
              className="fs-rise block text-primary drop-shadow-[0_0_28px_rgb(0_230_184/0.35)]"
              style={{ animationDelay: "0.85s" }}
            >
              {HERO_COPY.lines[1]}
            </span>
          </h1>

          <p
            className="fs-rise mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-lg"
            style={{ animationDelay: "1.15s" }}
          >
            {HERO_COPY.support}
          </p>

          <div
            className="fs-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "1.3s" }}
          >
            <Link
              to="/readiness"
              className="btn btn-primary !h-[52px] !rounded-full !px-7 !text-[15px]"
            >
              {HERO_COPY.primaryCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={`#${SECTION_ANCHORS.discover}`}
              className="btn btn-outline !h-[52px] !rounded-full !px-7 !text-[15px]"
            >
              {HERO_COPY.secondaryCta}
            </a>
          </div>

          <p
            className="fs-rise mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground"
            style={{ animationDelay: "1.45s" }}
          >
            {HERO_COPY.micro.map((m, i) => (
              <span key={m} className="inline-flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary/60" />
                )}
                {m}
              </span>
            ))}
          </p>
        </div>

        {/* visual — bull photo + graph */}
        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-6 h-[80%] w-[86%] -translate-x-1/2 rounded-[32px] border border-white/10 bg-surface/60 blur-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(0,230,184,0.12), transparent 70%), #0A100E",
            }}
          />
          <div className="fs-bull relative">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_32px_80px_-24px_rgb(0_0_0/0.8)]">
              <img
                src="/images.jpeg"
                alt="Charging bull running through glowing market charts"
                width={597}
                height={335}
                loading="eager"
                fetchPriority="high"
                className="h-auto w-full object-cover"
              />
              {/* cinematic grade — melt edges into the dark stage */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(5,8,7,0.55), transparent 32%), linear-gradient(to bottom, rgba(5,8,7,0.28), transparent 26%), radial-gradient(ellipse 80% 60% at 50% 40%, transparent 55%, rgba(5,8,7,0.45) 100%), linear-gradient(to right, rgba(0,230,184,0.08), transparent 30%, transparent 70%, rgba(0,230,184,0.08))",
                }}
              />
              {/* light sweep across the frame */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div
                  className="fs-sweep absolute inset-y-0 w-24 opacity-0"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(200,255,240,0.35), transparent)",
                  }}
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
            </div>
          </div>
          <div className="fs-fade-late relative -mt-10 px-2 sm:-mt-14 md:px-6">
            <div className="rounded-2xl border border-white/10 bg-[#050807]/70 p-4 backdrop-blur-md">
              <HeroGraph />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
