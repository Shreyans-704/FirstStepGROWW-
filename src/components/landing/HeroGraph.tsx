/**
 * Conceptual market graph — interactive edition.
 * Mint line draws on view with a luminous travelling endpoint, milestones
 * pop in as the line reaches them, and each milestone is hover/tap-focusable
 * with an honest, figure-free tooltip. No numbers, no returns — the
 * "Conceptual illustration · Not real returns" caption stays.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/learn";
import { cn } from "@/lib/utils";

const LINE_D =
  "M0 158 C 30 156 44 138 70 140 C 96 142 104 158 130 152 C 156 146 164 124 192 122 C 220 120 228 142 256 138 C 284 134 292 108 320 106 C 348 104 356 128 384 122 C 412 116 420 92 448 88 C 476 84 496 96 520 82 C 536 73 548 68 560 64";
const FILL_D = `${LINE_D} L 560 200 L 0 200 Z`;
const DRAW_DELAY_MS = 1100;
const DRAW_MS = 2400;
const END_X = 560;
const END_Y = 64;

type Milestone = { fraction: number; title: string; sub: string };

const MILESTONES: Milestone[] = [
  {
    fraction: 0.3,
    title: "Market movement",
    sub: "Prices move both ways — often on news and mood.",
  },
  {
    fraction: 0.58,
    title: "Learning milestone",
    sub: "Small, regular steps beat perfect timing.",
  },
  {
    fraction: 0.85,
    title: "Bumps along the way",
    sub: "Dips are normal — plans matter more than predictions.",
  },
];

const PARTICLES = [
  { cx: 90, cy: 120, r: 1.8, delay: "0.4s", dur: "7s" },
  { cx: 230, cy: 90, r: 1.4, delay: "2.2s", dur: "8.5s" },
  { cx: 370, cy: 130, r: 2.2, delay: "1.1s", dur: "7.6s" },
  { cx: 490, cy: 70, r: 1.5, delay: "3s", dur: "9s" },
];

function tipTransform(x: number, y: number): string {
  if (y < 62) return "translate(-50%, 42%)";
  if (x > 400) return "translate(-94%, -138%)";
  if (x < 90) return "translate(-8%, -138%)";
  return "translate(-50%, -138%)";
}

export function HeroGraph({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const motionRef = useRef<SVGAnimateMotionElement | null>(null);
  const holdUntil = useRef(0);
  const enterAt = useRef(0);

  const [entered, setEntered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [staticMode, setStaticMode] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  const live = entered && visible && !staticMode;

  /* Reduced-motion: static graph, interactions still work. */
  useEffect(() => {
    setStaticMode(prefersReducedMotion());
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setStaticMode(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Enter on view; track visibility to pause ambient motion off-screen. */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setVisible(e.isIntersecting);
          if (e.isIntersecting) {
            setEntered((was) => {
              if (!was) enterAt.current = Date.now();
              return true;
            });
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Measure milestone coordinates on the real path — always on-curve. */
  useEffect(() => {
    try {
      const path = pathRef.current;
      if (!path || typeof path.getTotalLength !== "function") return;
      const len = path.getTotalLength();
      setPoints(
        MILESTONES.map((m) => {
          const p = path.getPointAtLength(len * m.fraction);
          return { x: p.x, y: p.y };
        }),
      );
    } catch {
      /* keep points hidden rather than misplaced */
    }
  }, []);

  /* Launch the travelling endpoint in sync with the line draw. */
  useEffect(() => {
    if (!entered || staticMode) return;
    const t = window.setTimeout(() => {
      const el = motionRef.current;
      if (el && typeof el.beginElement === "function") {
        try {
          el.beginElement();
        } catch {
          /* SMIL unavailable — the line still draws via CSS */
        }
      }
    }, DRAW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [entered, staticMode]);

  /* Gentle auto-tour of milestones; any interaction takes over for a while. */
  useEffect(() => {
    if (!entered || !visible || staticMode) return;
    const id = window.setInterval(() => {
      if (Date.now() < holdUntil.current) return;
      if (Date.now() - enterAt.current < DRAW_DELAY_MS + DRAW_MS) return;
      setActive((a) => (a === null ? 0 : (a + 1) % MILESTONES.length));
    }, 2800);
    return () => window.clearInterval(id);
  }, [entered, visible, staticMode]);

  function hold() {
    holdUntil.current = Date.now() + 9000;
  }
  function release() {
    holdUntil.current = 0;
    setActive(null);
  }
  function select(i: number) {
    hold();
    setActive(i);
  }
  function toggle(i: number) {
    if (active === i) release();
    else select(i);
  }

  const activePoint = active !== null ? points[active] : undefined;
  const activeMilestone = active !== null ? MILESTONES[active] : undefined;

  return (
    <figure className={className} aria-label="Conceptual illustration of steady growth">
      <div
        ref={wrapRef}
        className={cn(
          "hg",
          entered && "hg-entered",
          live && "hg-live",
          staticMode && "hg-static",
          "relative",
        )}
      >
        <svg viewBox="0 0 560 210" role="img" aria-hidden="false" className="w-full">
          <title>Conceptual growth illustration — not real returns</title>
          <defs>
            <linearGradient id="fs-line-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00e6b8" stopOpacity="0.28" />
              <stop offset="0.6" stopColor="#00e6b8" stopOpacity="0.07" />
              <stop offset="1" stopColor="#00e6b8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fs-line-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#00e6b8" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#00e6b8" />
              <stop offset="1" stopColor="#65f5d2" />
            </linearGradient>
            <linearGradient id="hg-sheen-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#dffff5" stopOpacity="0" />
              <stop offset="0.5" stopColor="#dffff5" stopOpacity="0.9" />
              <stop offset="1" stopColor="#dffff5" stopOpacity="0" />
            </linearGradient>
            <filter id="fs-line-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="fs-pt" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#dffff5" />
              <stop offset="0.35" stopColor="#65f5d2" />
              <stop offset="1" stopColor="#00e6b8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* fine grid */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
            {[30, 66, 102, 138, 174].map((y) => (
              <line key={y} x1="0" y1={y} x2="560" y2={y} />
            ))}
            {[70, 140, 210, 280, 350, 420, 490].map((x) => (
              <line key={x} x1={x} y1="8" x2={x} y2="196" />
            ))}
          </g>

          {/* minimal ambient particles */}
          <g aria-hidden="true" fill="#65f5d2">
            {PARTICLES.map((p, i) => (
              <circle
                key={i}
                className="hg-particle"
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                style={{ animationDelay: p.delay, animationDuration: p.dur }}
              />
            ))}
          </g>

          {/* soft area beneath */}
          <path className="hg-fill" d={FILL_D} fill="url(#fs-line-fill)" />

          {/* main line — draws left to right on view */}
          <path
            ref={pathRef}
            className="hg-line"
            d={LINE_D}
            fill="none"
            stroke="url(#fs-line-stroke)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#fs-line-glow)"
          />

          {/* restrained travelling highlight */}
          <path
            aria-hidden="true"
            className="hg-sheen"
            d={LINE_D}
            fill="none"
            stroke="url(#hg-sheen-grad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* luminous endpoint that travels with the draw, then rests */}
          {!staticMode && (
            <g className="hg-comet" opacity={0}>
              <circle r={11} fill="url(#fs-pt)" opacity={0.6} />
              <circle
                className="hg-comet-pulse"
                r={6}
                fill="none"
                stroke="#65f5d2"
                strokeWidth={1.5}
              />
              <circle r={4} fill="#eafff8" />
              <animateMotion
                ref={motionRef}
                dur={`${DRAW_MS}ms`}
                begin="indefinite"
                fill="freeze"
                path={LINE_D}
              />
            </g>
          )}
          {staticMode && (
            <g>
              <circle cx={END_X} cy={END_Y} r={13} fill="url(#fs-pt)" opacity={0.6} />
              <circle cx={END_X} cy={END_Y} r={4.5} fill="#65f5d2" />
            </g>
          )}

          {/* interactive milestones */}
          <g>
            {MILESTONES.map((m, i) => {
              const pt = points[i];
              if (!pt) return null;
              const isActive = active === i;
              return (
                <g
                  key={m.title}
                  className="hg-point"
                  style={{ animationDelay: `${(DRAW_DELAY_MS + m.fraction * DRAW_MS) / 1000}s` }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`${m.title}. ${m.sub}`}
                  data-active={isActive}
                  onClick={() => toggle(i)}
                  onMouseEnter={() => select(i)}
                  onMouseLeave={release}
                  onFocus={() => select(i)}
                  onBlur={release}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(i);
                    }
                  }}
                >
                  <circle cx={pt.x} cy={pt.y} r={13} fill="transparent" />
                  <circle cx={pt.x} cy={pt.y} r={12} fill="url(#fs-pt)" opacity={0.5} />
                  {isActive && (
                    <circle
                      className="hg-ring"
                      cx={pt.x}
                      cy={pt.y}
                      r={7}
                      fill="none"
                      stroke="#65f5d2"
                      strokeWidth={1.5}
                    />
                  )}
                  <circle
                    className="hg-core"
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill="#0a100e"
                    stroke="#65f5d2"
                    strokeWidth={2}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* floating tooltip for the active milestone (visual; AT uses the point label) */}
        {activePoint && activeMilestone && (
          <div
            aria-hidden="true"
            className="hg-tip"
            style={
              {
                left: `${(activePoint.x / 560) * 100}%`,
                top: `${(activePoint.y / 210) * 100}%`,
                "--hg-tip-t": tipTransform(activePoint.x, activePoint.y),
              } as CSSProperties
            }
          >
            <p className="text-[12px] font-bold text-foreground">{activeMilestone.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {activeMilestone.sub}
            </p>
          </div>
        )}
      </div>
      <figcaption className="mt-2 text-[11px] tracking-wide text-muted-foreground/80">
        Conceptual illustration · Not real returns
      </figcaption>
    </figure>
  );
}
