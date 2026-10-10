import { createFileRoute } from "@tanstack/react-router";
import { FlexSipBuilder } from "@/components/flexsip/FlexSipBuilder";
import { MarketDashboard } from "@/components/market/MarketDashboard";
import { MutualFundExplorer } from "@/components/market/MutualFundExplorer";

export const Route = createFileRoute("/flex-sip")({
  head: () => ({
    meta: [
      { title: "Flex SIP Builder — First Step" },
      {
        name: "description",
        content: "Set a ₹500+ base, add an optional top-up and simulate pausing for 1–3 months.",
      },
      { property: "og:title", content: "Flex SIP Builder — First Step" },
      {
        property: "og:description",
        content: "A flexible SIP plan for irregular income. Simulated prototype.",
      },
    ],
  }),
  component: FlexSipPage,
});

function FlexSipPage() {
  return (
    <div className="grid items-start gap-7 lg:grid-cols-[43fr_57fr] lg:gap-8">
      <div className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
        <FlexSipBuilder />
      </div>
      <div className="min-w-0">
        <MarketDashboard />
        <MutualFundExplorer />
      </div>
    </div>
  );
}
