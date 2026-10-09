/**
 * Section 3 — Cinematic trading-interface showcase.
 * Composes the shared Market Lab copy + device visual inside
 * cinematic section chrome. The Part 1 hero is untouched.
 */
import { useInView } from "@/lib/learn";
import { MarketLabCopy } from "./MarketLabCopy";
import { MarketLabVisual } from "./MarketLabVisual";

export function Showcase() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="relative scroll-mt-20 overflow-hidden border-t border-white/10 bg-[#050807]"
    >
      <div
        aria-hidden="true"
        className="sc-glow pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00e6b8]/[0.07] blur-[150px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 70% at 60% 50%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 60% 50%, black 20%, transparent 75%)",
        }}
      />

      <div ref={ref} className={inView ? "sc-on" : undefined}>
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <MarketLabCopy />
          <MarketLabVisual />
        </div>
      </div>
    </section>
  );
}
