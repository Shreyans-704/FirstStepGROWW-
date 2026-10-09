/**
 * Market Lab device composition — laptop chart + overlapping phone.
 * Pure presentational building block shared by the homepage showcase
 * and the readiness page. Expects an `.sc-on` ancestor for entrances;
 * pointer parallax is self-contained and disabled on touch/reduced-motion.
 */
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/learn";

/* Deterministic illustrative candles — clearly fictional, choppy and flat. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Candle = { o: number; h: number; l: number; c: number };

function buildCandles(): Candle[] {
  const rand = mulberry32(42);
  const out: Candle[] = [];
  let prev = 100;
  for (let i = 0; i < 26; i += 1) {
    const drift = Math.sin(i / 3.2) * 1.6;
    const o = prev;
    const c = o + (rand() - 0.5) * 5 + drift * 0.4;
    const h = Math.max(o, c) + rand() * 2.2;
    const l = Math.min(o, c) - rand() * 2.2;
    out.push({ o, h, l, c });
    prev = c;
  }
  return out;
}

const CANDLES = buildCandles();
const C_MIN = Math.min(...CANDLES.map((k) => k.l));
const C_MAX = Math.max(...CANDLES.map((k) => k.h));
const yOf = (p: number) => 178 - ((p - C_MIN) / (C_MAX - C_MIN)) * 150;

const WATCHLIST = [
  { name: "Large-cap Index", value: "24,180", chg: "+0.4%", up: true },
  { name: "Bank Index", value: "51,320", chg: "−0.6%", up: false },
  { name: "IT Index", value: "33,940", chg: "+1.1%", up: true },
  { name: "Gold", value: "7,240", chg: "+0.2%", up: true },
];

const PHONE_LINE =
  "M4 62 C 26 58 34 44 56 46 C 78 48 86 58 108 50 C 130 42 138 28 160 30 C 182 32 190 44 212 38";

export function MarketLabVisual() {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const laptopRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const finePointer = useRef(false);

  useEffect(() => {
    finePointer.current =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches &&
      !prefersReducedMotion();
  }, []);

  function onMove(e: React.MouseEvent) {
    if (!finePointer.current || !zoneRef.current) return;
    const r = zoneRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (laptopRef.current)
      laptopRef.current.style.transform = `translate3d(${(x * 8).toFixed(1)}px, ${(y * 6).toFixed(1)}px, 0)`;
    if (phoneRef.current)
      phoneRef.current.style.transform = `translate3d(${(x * -12).toFixed(1)}px, ${(y * -9).toFixed(1)}px, 0)`;
  }

  function onLeave() {
    if (laptopRef.current) laptopRef.current.style.transform = "";
    if (phoneRef.current) phoneRef.current.style.transform = "";
  }

  return (
    <div
      ref={zoneRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative px-1 pb-16 pt-2 sm:px-6 sm:pb-20"
    >
      {/* laptop */}
      <div className="sc-device">
        <div ref={laptopRef} className="transition-transform duration-200 ease-out">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a100e] shadow-[0_48px_100px_-32px_rgb(0_0_0/0.9)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </span>
              <p className="ml-2 truncate text-xs font-semibold text-foreground">
                First Step · Market Lab
              </p>
              <span className="ml-auto rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                DEMO
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5">
              {["1D", "1W", "1M", "1Y"].map((t) => (
                <span
                  key={t}
                  aria-hidden="true"
                  className={
                    t === "1M"
                      ? "rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
                      : "rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground"
                  }
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-3 px-4 pb-2">
              <div className="min-w-0 flex-1">
                <svg
                  viewBox="0 0 320 200"
                  role="img"
                  aria-label="Illustrative candlestick chart with fictional data"
                  className="w-full"
                >
                  <defs>
                    <linearGradient id="sc-sweep-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#65f5d2" stopOpacity="0" />
                      <stop offset="0.5" stopColor="#65f5d2" stopOpacity="0.9" />
                      <stop offset="1" stopColor="#65f5d2" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
                    {[30, 70, 110, 150].map((y) => (
                      <line key={y} x1="0" y1={y} x2="320" y2={y} />
                    ))}
                  </g>
                  <line
                    x1="0"
                    y1={yOf(101.5)}
                    x2="320"
                    y2={yOf(101.5)}
                    stroke="#65f5d2"
                    strokeOpacity="0.5"
                    strokeDasharray="5 5"
                    strokeWidth="1.2"
                  />
                  <text
                    x="312"
                    y={yOf(101.5) - 6}
                    textAnchor="end"
                    fontSize="10"
                    fill="#65f5d2"
                    opacity="0.9"
                  >
                    Level to watch
                  </text>
                  {CANDLES.map((k, i) => {
                    const up = k.c >= k.o;
                    const x = 10 + i * 12;
                    const color = up ? "#00e6b8" : "#f25555";
                    return (
                      <g
                        key={i}
                        className="sc-candle"
                        style={{ animationDelay: `${0.55 + i * 0.045}s` }}
                      >
                        <line
                          x1={x + 3}
                          y1={yOf(k.h)}
                          x2={x + 3}
                          y2={yOf(k.l)}
                          stroke={color}
                          strokeWidth="1.4"
                          opacity="0.85"
                        />
                        <rect
                          x={x}
                          y={yOf(Math.max(k.o, k.c))}
                          width={6}
                          height={Math.max(2.5, Math.abs(yOf(k.o) - yOf(k.c)))}
                          rx={1}
                          fill={color}
                          opacity={up ? 0.9 : 0.75}
                        />
                      </g>
                    );
                  })}
                  <g className="sc-travel">
                    <line
                      x1={14}
                      y1={10}
                      x2={14}
                      y2={190}
                      stroke="url(#sc-sweep-grad)"
                      strokeWidth="2"
                    />
                    <circle cx={14} cy={26} r={4} fill="#65f5d2" />
                  </g>
                </svg>
              </div>
              <div
                aria-label="Illustrative watchlist"
                className="hidden w-36 shrink-0 flex-col gap-2 md:flex"
              >
                {WATCHLIST.map((w) => (
                  <div
                    key={w.name}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
                  >
                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                      {w.name}
                    </p>
                    <p className="mt-0.5 font-display text-[15px] font-bold text-foreground">
                      {w.value}
                    </p>
                    <p
                      className={
                        w.up
                          ? "mt-0.5 text-[11px] font-bold text-primary"
                          : "mt-0.5 text-[11px] font-bold text-[#f25555]"
                      }
                    >
                      {w.chg} <span className="font-normal text-muted-foreground">demo</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="border-t border-white/10 px-4 py-2 text-[11px] text-muted-foreground">
              Illustrative demo · Fictional data — not live prices.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="mx-auto mt-0 h-2.5 w-[92%] rounded-b-xl bg-white/[0.07]"
          />
          <div
            aria-hidden="true"
            className="mx-auto h-1.5 w-[104%] -translate-x-[2%] rounded-full bg-white/[0.05]"
          />
        </div>
      </div>

      {/* phone overlapping lower-left */}
      <div className="sc-phone absolute bottom-0 left-0 w-36 sm:left-4 sm:w-44">
        <div ref={phoneRef} className="transition-transform duration-200 ease-out">
          <div className="overflow-hidden rounded-[1.8rem] border border-white/15 bg-[#0a100e] shadow-[0_32px_70px_-20px_rgb(0_0_0/0.9)]">
            <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
            <div className="p-3">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
                PORTFOLIO LAB
              </p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">₹48,200</p>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-bold text-primary">+₹1,240 demo</span> · Illustrative
              </p>
              <div aria-hidden="true" className="mt-2 flex gap-1">
                {["1M", "6M", "1Y"].map((t) => (
                  <span
                    key={t}
                    className={
                      t === "1Y"
                        ? "rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground"
                        : "rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
              <svg
                viewBox="0 0 220 76"
                role="img"
                aria-label="Illustrative growth sketch"
                className="mt-2 w-full"
              >
                <defs>
                  <linearGradient id="sc-phone-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#00e6b8" stopOpacity="0.3" />
                    <stop offset="1" stopColor="#00e6b8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${PHONE_LINE} L 212 72 L 4 72 Z`}
                  fill="url(#sc-phone-fill)"
                  opacity="0.8"
                />
                <path
                  className="sc-line"
                  d={PHONE_LINE}
                  fill="none"
                  stroke="#00e6b8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx={212} cy={38} r={3.5} fill="#65f5d2" />
              </svg>
              <div className="mt-2 rounded-xl border border-primary/25 bg-primary/[0.07] p-2.5">
                <p className="text-[10px] font-bold text-primary">INSIGHT</p>
                <p className="mt-0.5 text-[11px] leading-snug text-foreground/90">
                  Prices move both ways. Zoom out before you judge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
