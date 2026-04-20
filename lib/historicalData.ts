import { PositionDelta } from '../types/portfolio';

// ── Sector / Industry map ─────────────────────────────────────
// Primary source: GICS sector classification
export const SECTOR_MAP: Record<string, { sector: string; industry: string }> = {
  // Technology
  APH:  { sector: 'Technology',              industry: 'Electronic Components' },
  MSFT: { sector: 'Technology',              industry: 'Software—Infrastructure' },
  NVDA: { sector: 'Technology',              industry: 'Semiconductors' },
  QCOM: { sector: 'Technology',              industry: 'Semiconductors' },
  ACN:  { sector: 'Technology',              industry: 'IT Services' },
  MSI:  { sector: 'Technology',              industry: 'Communication Equipment' },
  CHKP: { sector: 'Technology',              industry: 'Software—Infrastructure' },
  ROP:  { sector: 'Technology',              industry: 'Software—Application' },
  ADP:  { sector: 'Technology',              industry: 'Software—Application' },
  AAPL: { sector: 'Technology',              industry: 'Consumer Electronics' },
  PANW: { sector: 'Technology',              industry: 'Software—Infrastructure' },
  NOW:  { sector: 'Technology',              industry: 'Software—Application' },
  CRM:  { sector: 'Technology',              industry: 'Software—Application' },
  AVGO: { sector: 'Technology',             industry: 'Semiconductors' },
  PAYX: { sector: 'Technology',             industry: 'Software—Application' },
  // Communication Services
  GOOGL:{ sector: 'Comm. Services',          industry: 'Internet Content' },
  GOOG: { sector: 'Comm. Services',          industry: 'Internet Content' },
  DIS:  { sector: 'Comm. Services',          industry: 'Entertainment' },
  OMC:  { sector: 'Comm. Services',          industry: 'Advertising Agencies' },
  // Healthcare
  MRK:  { sector: 'Healthcare',              industry: 'Drug Manufacturers' },
  TMO:  { sector: 'Healthcare',              industry: 'Diagnostics & Research' },
  JNJ:  { sector: 'Healthcare',              industry: 'Drug Manufacturers' },
  DHR:  { sector: 'Healthcare',              industry: 'Diagnostics & Research' },
  SYK:  { sector: 'Healthcare',              industry: 'Medical Devices' },
  BSX:  { sector: 'Healthcare',              industry: 'Medical Devices' },
  LLY:  { sector: 'Healthcare',              industry: 'Drug Manufacturers' },
  ISRG: { sector: 'Healthcare',              industry: 'Medical Devices' },
  ZTS:  { sector: 'Healthcare',              industry: 'Drug Manufacturers' },
  AMGN: { sector: 'Healthcare',              industry: 'Drug Manufacturers' },
  // Industrials
  EXPD: { sector: 'Industrials',             industry: 'Freight & Logistics' },
  FAST: { sector: 'Industrials',             industry: 'Industrial Distribution' },
  ITW:  { sector: 'Industrials',             industry: 'Industrial Machinery' },
  RTX:  { sector: 'Industrials',             industry: 'Aerospace & Defense' },
  CAT:  { sector: 'Industrials',             industry: 'Farm & Heavy Machinery' },
  BA:   { sector: 'Industrials',             industry: 'Aerospace & Defense' },
  DAL:  { sector: 'Industrials',             industry: 'Airlines' },
  GEV:  { sector: 'Industrials',             industry: 'Electrical Equipment' },
  DE:   { sector: 'Industrials',             industry: 'Farm & Heavy Machinery' },
  EMR:  { sector: 'Industrials',             industry: 'Industrial Machinery' },
  HON:  { sector: 'Industrials',             industry: 'Conglomerates' },
  DCI:  { sector: 'Industrials',             industry: 'Pollution Controls' },
  // Consumer Discretionary
  AMZN: { sector: 'Consumer Discret.',       industry: 'Internet Retail' },
  MAR:  { sector: 'Consumer Discret.',       industry: 'Lodging' },
  SBUX: { sector: 'Consumer Discret.',       industry: 'Restaurants' },
  HD:   { sector: 'Consumer Discret.',       industry: 'Home Improvement' },
  MCD:  { sector: 'Consumer Discret.',       industry: 'Restaurants' },
  TGT:  { sector: 'Consumer Discret.',       industry: 'Discount Stores' },
  RCL:  { sector: 'Consumer Discret.',       industry: 'Leisure' },
  // Consumer Staples
  WMT:  { sector: 'Consumer Staples',        industry: 'Discount Stores' },
  CHD:  { sector: 'Consumer Staples',        industry: 'Household Products' },
  PEP:  { sector: 'Consumer Staples',        industry: 'Beverages' },
  // Financial Services
  V:    { sector: 'Financials',              industry: 'Credit Services' },
  ICE:  { sector: 'Financials',              industry: 'Fin. Data & Exchanges' },
  MA:   { sector: 'Financials',              industry: 'Credit Services' },
  'BRK-A': { sector: 'Financials',           industry: 'Insurance—Diversified' },
  'BRK-B': { sector: 'Financials',           industry: 'Insurance—Diversified' },
  JPM:  { sector: 'Financials',              industry: 'Banks—Diversified' },
  CB:   { sector: 'Financials',              industry: 'Insurance—P&C' },
  BLK:  { sector: 'Financials',              industry: 'Asset Management' },
  SPGI: { sector: 'Financials',              industry: 'Fin. Data & Exchanges' },
  // Materials
  SHW:  { sector: 'Materials',               industry: 'Specialty Chemicals' },
  LIN:  { sector: 'Materials',               industry: 'Specialty Chemicals' },
  // Energy
  DVN:  { sector: 'Energy',                  industry: 'Oil & Gas E&P' },
  BP:   { sector: 'Energy',                  industry: 'Oil & Gas Integrated' },
  XOM:  { sector: 'Energy',                  industry: 'Oil & Gas Integrated' },
  // Utilities
  NEE:  { sector: 'Utilities',               industry: 'Regulated Electric' },
  // ETFs
  VOO:  { sector: 'ETF',                     industry: 'Broad Market' },
  SPY:  { sector: 'ETF',                     industry: 'Broad Market' },
  RSP:  { sector: 'ETF',                     industry: 'Equal Weight' },
  VB:   { sector: 'ETF',                     industry: 'Small Cap' },
  JPSE: { sector: 'ETF',                     industry: 'Diversified Equity' },
  XLG:  { sector: 'ETF',                     industry: 'Large Cap' },
  EQWL: { sector: 'ETF',                     industry: 'Equal Weight Large Cap' },
  JPME: { sector: 'ETF',                     industry: 'Diversified' },
  VBR:  { sector: 'ETF',                     industry: 'Small Cap Value' },
  IWP:  { sector: 'ETF',                     industry: 'Mid Cap Growth' },
  SCHR: { sector: 'ETF',                     industry: 'Fixed Income' },
  VOE:  { sector: 'ETF',                     industry: 'Mid Cap Value' },
  IWD:  { sector: 'ETF',                     industry: 'Large Cap Value' },
  EFA:  { sector: 'ETF',                     industry: 'International' },
  JKH:  { sector: 'ETF',                     industry: 'Mid Cap Growth' },
  IWF:  { sector: 'ETF',                     industry: 'Large Cap Growth' },
  VTV:  { sector: 'ETF',                     industry: 'Large Cap Value' },
};

// ── Q3 2025 Share Counts (prior quarter for delta computation) ─
const Q3_2025_SHARES: Record<string, number> = {
  MSFT: 178990, APH: 726623,  GOOGL: 294608, FAST: 1413809, JNJ: 360122,
  TMO:  136450, MRK: 786868,  WMT: 629380,   NVDA: 346719,  V: 189141,
  MSI:  139186, QCOM: 375419, SYK: 167236,   SHW: 177259,   CHKP: 294810,
  EXPD: 496187, ICE: 356659,  ITW: 229871,   LIN: 125326,   ADP: 197811,
  DHR:  287737, ACN: 228160,  FISV: 432584,  ROP: 110147,   CHD: 609030,
  PANW: 89837,  AAPL: 63648,  RTX: 93720,    MA: 27323,     NOW: 16168,
  RCL:  44876,  MAR: 55670,   AMZN: 64635,   CAT: 27536,    LLY: 16301,
  BA:   57403,  ISRG: 24450,  CB: 36268,     CRM: 42759,    HD: 25001,
  DAL:  163845, GEV: 14846,   'BRK-A': 12,   SBUX: 88878,   DVN: 212641,
  ZTS:  48848,  'BRK-B': 8891, JPM: 9540,    DE: 5420,      AVGO: 6147,
  SGOV: 16568,  MCD: 4991,    SPGI: 2976,    BLK: 1200,     BP: 37525,
  SPY:  1910,   XOM: 10335,   GOOG: 4195,    VTV: 5078,     OMC: 10806,
  VO:   2945,   AMGN: 2345,   JPSE: 12170,   VB: 2380,      XLG: 10000,
  IWP:  3928,   HON: 2600,    PEP: 3788,     TGT: 5414,     PAYX: 3718,
  XLC:  3500,   SCHR: 16043,  VBR: 1880,     DCI: 4750,     JPME: 3370,
  EFA:  2666,   NEE: 3200,    EMR: 1800,     DIS: 1800,
};

// Symbols exited between Q3 and Q4 2025
export const EXITED_Q3_TO_Q4 = ['FISV','SGOV','VO','XLC','XLK','VCR','ABBV','CSCO','VEA','SLB','ORCL'];

// ── Full quarter history (shares, for trend analysis) ─────────
export const QUARTER_HISTORY: { quarter: string; shares: Record<string, number> }[] = [
  {
    quarter: 'Q1 2024',
    shares: {
      MSFT: 170287, SHW: 191095, APH: 575058, FAST: 842485, SYK: 178973,
      QCOM: 371908, GOOGL: 415659, V: 224287, ICE: 441473, CHKP: 368647,
      TMO: 103780, WMT: 996473, MRK: 454099, MSI: 167236, ROP: 105780,
      DHR: 236788, CHD: 564155, ITW: 218991, ACN: 168219, EXPD: 462946,
      JNJ: 353345, 'BRK-A': 9, AAPL: 16242, TGT: 6334, OMC: 10806, MCD: 3656,
      PEP: 3788, HD: 1350, SPY: 919, EMR: 1800, LLY: 260,
    },
  },
  {
    quarter: 'Q2 2024',
    shares: {
      MSFT: 163241, GOOGL: 362808, APH: 955749, WMT: 937193, MSI: 160274,
      QCOM: 304361, CHKP: 366162, SYK: 176709, ICE: 433224, ROP: 104681,
      EXPD: 469688, ACN: 192541, V: 221090, SHW: 192108, CHD: 552627,
      DHR: 229226, TMO: 102839, MRK: 441219, JNJ: 370993, FAST: 860334,
      ADP: 224226, ITW: 225506, 'BRK-A': 12, AAPL: 14821, OMC: 10806,
      MCD: 3656, TGT: 6121, PEP: 3788, DIS: 5830, HD: 1350, SPY: 825, LLY: 260,
    },
  },
  {
    quarter: 'Q3 2024',
    shares: {
      MSFT: 162860, SHW: 181433, MSI: 151865, WMT: 842143, ACN: 189421,
      ICE: 404486, CHKP: 336703, TMO: 102137, SYK: 174860, DHR: 226928,
      ADP: 225066, V: 224533, EXPD: 469080, FAST: 858554, GOOGL: 369164,
      APH: 938581, ITW: 231696, JNJ: 368411, CHD: 564171, ROP: 105372,
      LIN: 120839, QCOM: 333912, MRK: 464509, 'BRK-A': 12, AAPL: 14396,
      OMC: 10806, MCD: 3656, TGT: 6122, PEP: 3788, HD: 1350, SPY: 820,
      DIS: 4348, LLY: 260,
    },
  },
  {
    quarter: 'Q4 2024',
    shares: {
      MSFT: 162443, GOOGL: 360799, V: 214012, WMT: 719178, MSI: 138970,
      ACN: 180204, ADP: 216514, APH: 907718, SYK: 171604, CHKP: 328194,
      SHW: 178027, CHD: 561241, ICE: 394135, FAST: 813941, ITW: 227436,
      TMO: 108875, ROP: 105297, DHR: 237922, QCOM: 354995, JNJ: 368038,
      EXPD: 475342, MRK: 487347, LIN: 114201, SPY: 41169, 'BRK-A': 12,
      AAPL: 14396, MCD: 3656, OMC: 10806, TGT: 6123, PEP: 3788, HD: 1350,
      DIS: 3718, VOO: 520, EMR: 1800, LLY: 260,
    },
  },
  {
    quarter: 'Q1 2025',
    shares: {
      V: 198284, CHKP: 293252, ICE: 375587, ADP: 207624, SYK: 170093,
      FAST: 812025, SHW: 178719, ROP: 105065, MSI: 141183, MSFT: 164493,
      JNJ: 371633, CHD: 558180, APH: 917153, EXPD: 495801, LIN: 125958,
      WMT: 656270, ACN: 184288, ITW: 229055, TMO: 111784, QCOM: 360993,
      GOOGL: 352625, DHR: 263615, 'BRK-A': 12, AAPL: 13830, MCD: 3656,
      OMC: 10806, TGT: 6125, PEP: 3788, HD: 1078, SPY: 656, DIS: 3652, LLY: 260,
    },
  },
  {
    quarter: 'Q2 2025',
    shares: {
      MSFT: 189229, APH: 837713, V: 187843, ICE: 361367, SYK: 167427,
      FAST: 1525574, CHKP: 286261, GOOGL: 356289, WMT: 633978, TMO: 151852,
      SHW: 177914, ADP: 195027, MSI: 142247, MRK: 754857, QCOM: 374455,
      ROP: 105060, ACN: 196790, LIN: 125188, EXPD: 500103, ITW: 230783,
      JNJ: 373144, DHR: 281256, CHD: 575164, PANW: 101350, NOW: 18421,
      RCL: 60205, MAR: 63912, MA: 30908, RTX: 110062, AMZN: 69848,
      ISRG: 27241, AAPL: 70155, CRM: 52719, LLY: 18437, BA: 63224,
      CB: 43274, CAT: 30485, HD: 28493, ZTS: 60082, SBUX: 101794,
      'BRK-A': 12, DAL: 177347, DVN: 231936, GEV: 6245, JPM: 9660,
      DE: 5420, SPGI: 2976, BLK: 1200, MCD: 3856, BP: 37525, XOM: 7674,
      OMC: 10806, AMGN: 2345, HON: 2600, PAYX: 3720, SPY: 870, TGT: 5412,
      PEP: 3788, EMR: 1800, DIS: 1800,
    },
  },
  {
    quarter: 'Q3 2025',
    shares: Q3_2025_SHARES,
  },
];

// ── Delta computation: Q3 → Q4 2025 ──────────────────────────
export function computeQ4Delta(sym: string, q4Shares: number): PositionDelta {
  const q3 = Q3_2025_SHARES[sym] ?? 0;
  if (!Q3_2025_SHARES[sym]) {
    return { direction: 'new', sharesDiff: q4Shares, sharesDiffPct: 0, q3Shares: 0 };
  }
  const sharesDiff = q4Shares - q3;
  const sharesDiffPct = sharesDiff / q3;
  const direction: PositionDelta['direction'] =
    sharesDiff > 0 ? 'increased' : sharesDiff < 0 ? 'decreased' : 'unchanged';
  return { direction, sharesDiff, sharesDiffPct, q3Shares: q3 };
}

// ── Sector allocation from portfolio ─────────────────────────
export function computeSectorAllocation(
  positions: { sym: string; valueK: number }[]
): { sector: string; valueK: number; weight: number }[] {
  const totalValueK = positions.reduce((s, p) => s + p.valueK, 0);
  const map = new Map<string, number>();
  for (const p of positions) {
    const sector = SECTOR_MAP[p.sym]?.sector ?? 'Other';
    map.set(sector, (map.get(sector) ?? 0) + p.valueK);
  }
  return Array.from(map.entries())
    .map(([sector, valueK]) => ({ sector, valueK, weight: valueK / totalValueK }))
    .sort((a, b) => b.valueK - a.valueK);
}
