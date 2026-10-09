/**
 * Scroll-reveal infrastructure for Part 2 — no animation libraries.
 * IntersectionObserver adds visibility; CSS owns the motion.
 * Content stays visible when JS is off (SSR default) or when the user
 * prefers reduced motion.
 */
import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/learn";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <div ref={ref} id={id} style={style} className={cn("rv", inView && "rv-visible", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-primary">
      <span aria-hidden="true" className="h-px w-6 bg-primary/60" />
      {children}
    </p>
  );
}
