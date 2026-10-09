import { describe, expect, it } from "vitest";
import { LIBRARY_RESOURCES, RESOURCE_CATEGORIES, filterResources } from "@/config/resources";

describe("learning library", () => {
  it("filters by topic", () => {
    expect(filterResources(LIBRARY_RESOURCES, "All Resources")).toHaveLength(
      LIBRARY_RESOURCES.length,
    );
    const mf = filterResources(LIBRARY_RESOURCES, "Mutual Funds");
    expect(mf.length).toBeGreaterThan(0);
    expect(mf.every((r) => r.categories.includes("Mutual Funds"))).toBe(true);
  });

  it("covers every filter category with at least one resource", () => {
    for (const c of RESOURCE_CATEGORIES) {
      if (c === "All Resources") continue;
      expect(filterResources(LIBRARY_RESOURCES, c).length).toBeGreaterThan(0);
    }
  });

  it("uses only verified https URLs from known publishers", () => {
    for (const r of LIBRARY_RESOURCES) {
      expect(r.url.startsWith("https://")).toBe(true);
      expect(["Zerodha Varsity", "SEBI Investor"]).toContain(r.publisher);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.description.length).toBeGreaterThan(0);
    }
  });
});
