import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Built-in scroll-position caching is intentionally off: it restores
    // stale positions when revisiting a page. Cross-page scroll-to-top is
    // owned by <ScrollToTop /> in __root.tsx; hash-anchor scrolling still
    // works through the router's hash handling. Instant behavior avoids a
    // slow smooth glide on long pages (see html scroll-behavior in CSS).
    scrollRestoration: false,
    scrollRestorationBehavior: "instant",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
