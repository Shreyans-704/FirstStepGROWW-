import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GrowthBars, GrowthDonut } from "@/components/landing/GrowthCharts";

describe("GrowthBars", () => {
  it("renders dynamically calculated scenario values, not hardcoded ones", () => {
    render(<GrowthBars monthly={1000} years={5} />);
    // 1000 × 60 mo = 60,000 in; 4% → 66,299, 8% → 73,477, 12% → 81,670.
    expect(screen.getByText("₹73,477")).toBeInTheDocument();
    expect(screen.getByText(/could be worth approximately ₹73,477/)).toBeInTheDocument();
    const byFullLine =
      (line: string) =>
      (_content: string, el: Element | null): boolean =>
        el?.tagName === "P" && el.textContent === line;
    expect(screen.getByText(byFullLine("₹60,000 put in + ₹6,299 growth"))).toBeInTheDocument();
    expect(screen.getByText(byFullLine("₹60,000 put in + ₹21,670 growth"))).toBeInTheDocument();
  });

  it("summarises the moderate reference scenario in plain words", () => {
    render(<GrowthBars monthly={1000} years={5} />);
    expect(screen.getByText(/Over 5 years, you would contribute ₹60,000/)).toBeInTheDocument();
    expect(screen.getByText(/could be worth approximately ₹73,477/)).toBeInTheDocument();
  });

  it("updates every figure when inputs change", () => {
    const { rerender } = render(<GrowthBars monthly={500} years={1} />);
    expect(screen.getByText(/Over 1 year, you would contribute ₹6,000/)).toBeInTheDocument();
    rerender(<GrowthBars monthly={2000} years={10} />);
    expect(screen.getByText(/Over 10 years, you would contribute ₹2,40,000/)).toBeInTheDocument();
  });
});

describe("GrowthDonut", () => {
  it("splits the moderate ending value into contributions and growth", () => {
    render(<GrowthDonut monthly={1000} years={5} />);
    expect(screen.getByText("₹60,000")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_content: string, el: Element | null): boolean =>
          el?.tagName === "STRONG" && el.textContent === "+₹13,477",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("₹73,477")).toHaveLength(2);
  });
});
