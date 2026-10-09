/**
 * Learning Library catalogue — official external education only.
 * Every URL below was verified (HTTP 200) before shipping.
 * Nothing here is authored by First Step; cards link out with
 * secure attributes. No reading times shown — none were verified.
 */

export const RESOURCE_CATEGORIES = [
  "All Resources",
  "Investing Basics",
  "Stocks",
  "Mutual Funds",
  "SIPs & Compounding",
  "Risk & Investor Safety",
  "Personal Finance",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export type LibraryResource = {
  id: string;
  title: string;
  publisher: string;
  categories: Exclude<ResourceCategory, "All Resources">[];
  description: string;
  url: string;
};

export const LIBRARY_RESOURCES: LibraryResource[] = [
  {
    id: "varsity",
    title: "Free and Open Stock Market Education",
    publisher: "Zerodha Varsity",
    categories: ["Investing Basics", "Stocks"],
    description:
      "Explore structured lessons covering stock markets, financial concepts, trading, and investing.",
    url: "https://zerodha.com/varsity/",
  },
  {
    id: "sebi-howto",
    title: "Let's Learn How to Invest in the Securities Market",
    publisher: "SEBI Investor",
    categories: ["Investing Basics", "Mutual Funds"],
    description:
      "Understand securities, shares, mutual funds, ETFs, investment risks, and the basics of getting started.",
    url: "https://investor.sebi.gov.in/securities-howtoinvest.html",
  },
  {
    id: "sebi-material",
    title: "Investor Education Reading Material",
    publisher: "SEBI Investor",
    categories: ["Mutual Funds", "Risk & Investor Safety"],
    description:
      "Explore educational material on mutual funds, financial planning, securities markets, KYC, and investor protection.",
    url: "https://investor.sebi.gov.in/iematerial.html",
  },
  {
    id: "sebi-videos",
    title: "Video-Based Financial Education",
    publisher: "SEBI Investor",
    categories: ["SIPs & Compounding", "Risk & Investor Safety", "Personal Finance"],
    description:
      "Learn about personal finance, mutual funds, compounding, risk appetite, avoiding scams, and responsible investing.",
    url: "https://investor.sebi.gov.in/inv_aware_edu_videos.html",
  },
];

export function filterResources(
  resources: LibraryResource[],
  category: ResourceCategory,
): LibraryResource[] {
  if (category === "All Resources") return resources;
  return resources.filter((r) => r.categories.includes(category));
}
