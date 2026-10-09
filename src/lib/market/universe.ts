/**
 * Market data universe — every symbol and scheme code below was verified
 * against its provider before shipping. Only listed options are offered
 * in the UI; nothing here is fabricated.
 */

export type IndexKey = "nifty-50" | "nifty-next-50";

export type StockDef = { symbol: string; ticker: string; name: string };

export const UNIVERSES: Record<IndexKey, { label: string; note: string; stocks: StockDef[] }> = {
  "nifty-50": {
    label: "NIFTY 50",
    note: "Sample · 16 of 50 large-cap constituents",
    stocks: [
      { symbol: "RELIANCE.NS", ticker: "RELIANCE", name: "Reliance Industries" },
      { symbol: "TCS.NS", ticker: "TCS", name: "TCS" },
      { symbol: "HDFCBANK.NS", ticker: "HDFCBANK", name: "HDFC Bank" },
      { symbol: "INFY.NS", ticker: "INFY", name: "Infosys" },
      { symbol: "ICICIBANK.NS", ticker: "ICICIBANK", name: "ICICI Bank" },
      { symbol: "SBIN.NS", ticker: "SBIN", name: "State Bank of India" },
      { symbol: "ITC.NS", ticker: "ITC", name: "ITC" },
      { symbol: "LT.NS", ticker: "LT", name: "Larsen & Toubro" },
      { symbol: "AXISBANK.NS", ticker: "AXISBANK", name: "Axis Bank" },
      { symbol: "KOTAKBANK.NS", ticker: "KOTAKBANK", name: "Kotak Mahindra Bank" },
      { symbol: "TITAN.NS", ticker: "TITAN", name: "Titan Company" },
      { symbol: "SUNPHARMA.NS", ticker: "SUNPHARMA", name: "Sun Pharma" },
      { symbol: "MARUTI.NS", ticker: "MARUTI", name: "Maruti Suzuki" },
      { symbol: "TATASTEEL.NS", ticker: "TATASTEEL", name: "Tata Steel" },
      { symbol: "TRENT.NS", ticker: "TRENT", name: "Trent" },
      { symbol: "BEL.NS", ticker: "BEL", name: "Bharat Electronics" },
    ],
  },
  "nifty-next-50": {
    label: "NIFTY Next 50",
    note: "Sample · 11 of 50 constituents",
    stocks: [
      { symbol: "HAL.NS", ticker: "HAL", name: "HAL" },
      { symbol: "COFORGE.NS", ticker: "COFORGE", name: "Coforge" },
      { symbol: "PERSISTENT.NS", ticker: "PERSISTENT", name: "Persistent Systems" },
      { symbol: "MPHASIS.NS", ticker: "MPHASIS", name: "Mphasis" },
      { symbol: "INDIGO.NS", ticker: "INDIGO", name: "InterGlobe Aviation" },
      { symbol: "ABB.NS", ticker: "ABB", name: "ABB India" },
      { symbol: "SIEMENS.NS", ticker: "SIEMENS", name: "Siemens" },
      { symbol: "DLF.NS", ticker: "DLF", name: "DLF" },
      { symbol: "TORNTPHARM.NS", ticker: "TORNTPHARM", name: "Torrent Pharma" },
      { symbol: "CUMMINSIND.NS", ticker: "CUMMINSIND", name: "Cummins India" },
      { symbol: "PIDILITIND.NS", ticker: "PIDILITIND", name: "Pidilite Industries" },
    ],
  },
};

export const INDEX_KEYS = ["nifty-50", "nifty-next-50"] as const;

export type MfCategory =
  "Index Funds" | "Large-Cap Funds" | "Flexi-Cap Funds" | "Hybrid Funds" | "Debt Funds";

export const MF_CATEGORIES: ("All Funds" | MfCategory)[] = [
  "All Funds",
  "Index Funds",
  "Large-Cap Funds",
  "Flexi-Cap Funds",
  "Hybrid Funds",
  "Debt Funds",
];

export type FundDef = {
  code: number;
  name: string;
  plan: string;
  category: MfCategory;
  blurb: string;
};

/** Scheme codes verified against mfapi.in with current NAVs. */
export const FUNDS: FundDef[] = [
  {
    code: 119063,
    name: "HDFC Nifty 50 Index Fund",
    plan: "Direct · Growth",
    category: "Index Funds",
    blurb:
      "Mirrors the NIFTY 50. Costs are usually low; returns follow the index minus tracking error.",
  },
  {
    code: 120716,
    name: "UTI Nifty 50 Index Fund",
    plan: "Direct · Growth",
    category: "Index Funds",
    blurb: "Another NIFTY 50 tracker — compare costs and tracking error, not just past returns.",
  },
  {
    code: 120586,
    name: "ICICI Prudential Large Cap Fund",
    plan: "Direct · Growth",
    category: "Large-Cap Funds",
    blurb:
      "Invests mainly in the biggest companies. Steadier than smaller caps, still market-linked.",
  },
  {
    code: 122639,
    name: "Parag Parikh Flexi Cap Fund",
    plan: "Direct · Growth",
    category: "Flexi-Cap Funds",
    blurb: "Moves across company sizes and some foreign equity. Check what it currently holds.",
  },
  {
    code: 118955,
    name: "HDFC Flexi Cap Fund",
    plan: "Direct · Growth",
    category: "Flexi-Cap Funds",
    blurb: "One fund, shifting mix across caps — the current allocation drives behaviour.",
  },
  {
    code: 118968,
    name: "HDFC Balanced Advantage Fund",
    plan: "Direct · Growth",
    category: "Hybrid Funds",
    blurb:
      "Blends equity with debt to soften swings. The equity share decides most of the behaviour.",
  },
  {
    code: 118987,
    name: "HDFC Corporate Bond Fund",
    plan: "Direct · Growth",
    category: "Debt Funds",
    blurb: "Lends to companies via bonds. Interest-rate moves still affect its value.",
  },
];
