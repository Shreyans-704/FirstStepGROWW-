import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/my-plan";

const MyPlan = Route.options.component!;

function renderMyPlan({ clear = true }: { clear?: boolean } = {}) {
  if (clear) localStorage.clear();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: MyPlan,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return router.load().then(() => {
    const view = render(<RouterProvider router={router} />);
    return { ...view, router };
  });
}

const seedPlan = {
  base: 2000,
  optional: 500,
  status: "active",
  pauseMonths: null,
  resumeDate: null,
  createdAt: new Date("2026-10-01T00:00:00Z").toISOString(),
};

describe("MyPlan page", () => {
  it("shows the premium empty state only when no plan exists", async () => {
    await renderMyPlan();
    expect(await screen.findByText("Your plan starts here")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Build a flexible SIP plan that fits your income, goals, and changing circumstances.",
      ),
    ).toBeInTheDocument();
    const build = screen.getByRole("link", { name: /Build my plan/ });
    expect(build.getAttribute("href")).toBe("/flex-sip");
    const risk = screen.getByRole("link", { name: "Explore Growth Simulator" });
    expect(risk.getAttribute("href")).toBe("/risk");
    expect(screen.queryByText("Monthly plan")).not.toBeInTheDocument();
  });

  it("renders the saved plan with status and actions", async () => {
    localStorage.clear();
    localStorage.setItem("firststep.plan.v1", JSON.stringify(seedPlan));
    await renderMyPlan({ clear: false });
    expect(await screen.findByText("Monthly plan")).toBeInTheDocument();
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getByText("Active", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getAllByText("₹2,500")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Pause for 1 mo/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit plan/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete plan/ })).toBeInTheDocument();
    expect(screen.queryByText("Your plan starts here")).not.toBeInTheDocument();
  });

  it("saves feedback rating and text to the device", async () => {
    await renderMyPlan();
    await screen.findByText("Help us improve");
    fireEvent.click(screen.getByRole("radio", { name: "Rate 4 out of 5" }));
    fireEvent.change(screen.getByPlaceholderText("What would make this better?"), {
      target: { value: "Clear and calm experience, thanks!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save feedback on this device" }));
    expect(await screen.findByText("Thanks! Feedback saved on this device.")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem("firststep.feedback") ?? "[]") as {
      rating: number;
    }[];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.rating).toBe(4);
  });

  it("validates feedback before saving", async () => {
    await renderMyPlan();
    await screen.findByText("Help us improve");
    fireEvent.click(screen.getByRole("button", { name: "Save feedback on this device" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(localStorage.getItem("firststep.feedback")).toBeNull();
  });
});
