import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { isUnlocked, lock, unlock } from "@/lib/gate";
import { routeTree } from "@/routeTree.gen";

function guardedRouter(initialPath: string) {
  return createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe("declaration gate store", () => {
  beforeEach(() => {
    lock();
    localStorage.clear();
  });

  it("starts locked on a fresh load, even with stored browser data", () => {
    localStorage.setItem(
      "firststep.checklist.v1",
      JSON.stringify(["safety-net", "budget", "goals", "age"]),
    );
    localStorage.setItem(
      "firststep.plan.v1",
      JSON.stringify({
        base: 2000,
        optional: 0,
        status: "active",
        pauseMonths: null,
        resumeDate: null,
        createdAt: "",
      }),
    );
    expect(isUnlocked()).toBe(false);
  });

  it("unlocks only with all four declarations", () => {
    expect(unlock(3)).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(unlock(4)).toBe(true);
    expect(isUnlocked()).toBe(true);
  });

  it("mirrors the unlock to the tab session and clears it on lock", () => {
    expect(unlock(4)).toBe(true);
    expect(sessionStorage.getItem("firststep.unlocked.v1")).toBe("1");
    lock();
    expect(sessionStorage.getItem("firststep.unlocked.v1")).toBeNull();
    expect(isUnlocked()).toBe(false);
  });

  it("restores the unlock from the tab session after a fresh module load", async () => {
    unlock(4);
    vi.resetModules();
    const fresh = await import("@/lib/gate");
    expect(fresh.isUnlocked()).toBe(true);
    fresh.lock();
    expect(fresh.isUnlocked()).toBe(false);
  });
});

describe("route guard", () => {
  beforeEach(() => {
    lock();
  });

  it("keeps the landing page public", async () => {
    const router = guardedRouter("/");
    await router.load();
    expect(router.state.location.pathname).toBe("/");
  });

  it("redirects direct protected URLs to the declaration section", async () => {
    const router = guardedRouter("/flex-sip");
    await router.load();
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.hash).toBe("discover");
  });

  it("guards nested protected paths too", async () => {
    const router = guardedRouter("/risk/deep/nested");
    await router.load();
    expect(router.state.location.pathname).toBe("/");
  });

  it("keeps the Growth Simulator public while locked", async () => {
    const router = guardedRouter("/risk");
    await router.load();
    expect(router.state.location.pathname).toBe("/risk");
  });

  it("keeps Knowledge Hub hash navigation public while locked", async () => {
    const router = guardedRouter("/");
    await router.load();
    await router.navigate({ to: "/risk", hash: "knowledge-hub" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/risk");
      expect(router.state.location.hash).toBe("knowledge-hub");
    });
  });

  it("allows protected navigation normally after completion", async () => {
    unlock(4);
    const router = guardedRouter("/risk");
    await router.load();
    expect(router.state.location.pathname).toBe("/risk");
    await router.navigate({ to: "/flex-sip" });
    expect(router.state.location.pathname).toBe("/flex-sip");
  });

  it("back and forward cannot reach gated content while locked", async () => {
    const router = guardedRouter("/");
    await router.load();
    await router.navigate({ to: "/my-plan" });
    expect(router.state.location.pathname).toBe("/");
    router.history.back();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    router.history.forward();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
      expect(router.state.location.hash).toBe("discover");
    });
  });
});
