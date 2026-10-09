/**
 * Knowledge Hub catalogue — Part 2.
 * Every entry is a real, verified YouTube video (IDs validated via oEmbed).
 * Thumbnails reuse the videos' own YouTube artwork; embeds use
 * youtube-nocookie without autoplay. To add a lesson, append an entry —
 * no card or player redesign needed.
 */

export const VIDEO_CATEGORIES = [
  "All Videos",
  "Stock Market Basics",
  "Mutual Funds",
  "SIPs & Compounding",
  "Risk Management",
  "Financial Myths",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export type HubVideo = {
  id: string;
  youtubeId: string;
  title: string;
  category: Exclude<VideoCategory, "All Videos">;
  source: string;
  difficulty: "Beginner" | "Intermediate";
  description: string;
};

const yt = (youtubeId: string) => ({
  embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
  watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
  thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
});

export const videoLinks = yt;

export const HUB_VIDEOS: HubVideo[] = [
  {
    id: "wealth-basics",
    youtubeId: "W_dd4PIFBXI",
    title: "How to Create Wealth?",
    category: "Stock Market Basics",
    source: "Zerodha Varsity",
    difficulty: "Beginner",
    description:
      "How much is enough to begin, when to start investing, and why starting early matters. Basic Finance, Class 1.",
  },
  {
    id: "prices-fluctuate",
    youtubeId: "HaiM8jPDEhk",
    title: "Why Do Stock Prices Fluctuate?",
    category: "Stock Market Basics",
    source: "Zerodha Varsity",
    difficulty: "Beginner",
    description:
      "Demand, supply, earnings and news — the basic forces that move a stock's price after it lists.",
  },
  {
    id: "equity-mf-start",
    youtubeId: "nW5DTqJ7REY",
    title: "Getting Started with Equity Mutual Funds",
    category: "Mutual Funds",
    source: "Zerodha Varsity",
    difficulty: "Beginner",
    description:
      "How an equity fund works and what to understand before your first mutual fund investment.",
  },
  {
    id: "sip-compounding",
    youtubeId: "uHjmcCCnsjI",
    title: "Power of SIP Compounding, Explained",
    category: "SIPs & Compounding",
    source: "StocksVerse Studio",
    difficulty: "Beginner",
    description:
      "How regular investing builds over time, explained with examples by market experts.",
  },
  {
    id: "compounding-sip",
    youtubeId: "pz9XoguH1l4",
    title: "How Compounding Works in a SIP",
    category: "SIPs & Compounding",
    source: "Learn With PRT",
    difficulty: "Beginner",
    description: "Wealth-creation basics: why time in the market matters more than timing it.",
  },
  {
    id: "diversification-risk",
    youtubeId: "C1j3asSi2tA",
    title: "Does Diversification Reduce Risk?",
    category: "Risk Management",
    source: "Zerodha Varsity",
    difficulty: "Intermediate",
    description:
      "What diversification can and cannot do for your returns — and the risk it leaves behind.",
  },
  {
    id: "big-risks",
    youtubeId: "3dcblfngojk",
    title: "Big Risks, Bigger Regrets?",
    category: "Risk Management",
    source: "Zerodha Varsity",
    difficulty: "Beginner",
    description: "A straight look at investment risk — and what ignoring it can cost.",
  },
  {
    id: "market-myths",
    youtubeId: "LzgU68r9fQ8",
    title: "Myths About Stock Market Trading",
    category: "Financial Myths",
    source: "Rapid Rashmi",
    difficulty: "Beginner",
    description:
      "Karthik Rangappa (Zerodha) on common myths about markets, mutual funds and savings. Interview.",
  },
];
