import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { isUnlocked } from "../lib/gate";
import { Shell } from "@/components/Shell";

function NotFoundComponent() {
  return (
    <Shell>
      <div className="py-16 text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="btn btn-primary mt-6">
          Go home
        </Link>
      </div>
    </Shell>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or head home.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn btn-outline">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    // The landing page and the educational Growth Simulator / Knowledge Hub
    // (/risk) stay public — exploring content must never require the
    // declaration gate. Every other route requires the session-scoped gate
    // for the current visit — direct URLs, refreshes, back/forward, and
    // internal links all pass through here.
    if (location.pathname === "/" || location.pathname === "/risk") return;
    if (isUnlocked()) return;
    throw redirect({ to: "/", hash: "discover" });
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "First Step | Invest at Your Own Pace" },
      {
        name: "description",
        content:
          "A flexible first-investment planner for young Indians. Explore your financial readiness, simulate flexible SIP contributions, and build confidence before investing.",
      },
      { name: "theme-color", content: "#050807" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "First Step" },
      { property: "og:title", content: "First Step | Invest at Your Own Pace" },
      {
        property: "og:description",
        content: "A flexible first-investment planner built around your financial reality.",
      },
      { property: "og:url", content: "https://first-step-groww.vercel.app/" },
      { property: "og:image", content: "https://first-step-groww.vercel.app/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "First Step — a flexible first-investment planning experience.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "First Step | Invest at Your Own Pace" },
      {
        name: "twitter:description",
        content:
          "Explore your financial readiness and plan your first investment at your own pace.",
      },
      {
        name: "twitter:image",
        content: "https://first-step-groww.vercel.app/og-image.png",
      },
    ],
    links: [
      { rel: "canonical", href: "https://first-step-groww.vercel.app/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Shell>
        <ScrollToTop />
        <Outlet />
      </Shell>
    </QueryClientProvider>
  );
}

/**
 * Scroll to the top whenever navigation lands on a different page.
 * Router-level, no new dependencies. The built-in restoration cache is
 * intentionally disabled (see router.tsx): it restores stale positions
 * when revisiting a page, while this app always starts a different page
 * at the top. Hash navigations are left alone so anchor links (e.g.
 * /risk#knowledge-hub) keep working, and same-page re-renders never
 * trigger a scroll.
 */
export function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}
