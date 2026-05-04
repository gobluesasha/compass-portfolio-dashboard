export type EarningsResult = 'beat' | 'miss' | 'inline' | null;
export type PositionStatus = 'green' | 'yellow' | 'red';
export type SortDirection = 'asc' | 'desc';
export type DeltaDirection = 'new' | 'increased' | 'decreased' | 'unchanged';

export interface PositionDelta {
  direction: DeltaDirection;
  sharesDiff: number;
  sharesDiffPct: number;    // fractional, e.g. 0.12 = +12%
  q3Shares: number;
}

export interface CsvFields {
  sym: string;
  issuerName: string;
  cl: string;
  cusip: string;
  valueK: number;
  weight: number;
  weightDisplay: string;
  shares: number;
}

export interface SparkPoint {
  date: string;   // YYYY-MM-DD
  close: number;
}

export interface MarketData {
  price: number | null;
  dayChangePct: number | null;
  totalReturnPct: number | null;
  quarterlyGrowth: number | null;
  contributionToReturn: number | null;
  sparkline: SparkPoint[] | null;   // ~90-day daily close prices with dates
}

export interface EarningsData {
  lastEarnings: EarningsResult;
  lastEarningsDate: string | null;
  nextEarningsDate: string | null;
}

export interface Fundamentals {
  // GAAP
  revenueGrowthPct: number | null;   // trailing YoY revenue growth
  epsGrowthPct: number | null;       // trailing YoY EPS growth (GAAP)
  grossMarginPct: number | null;     // gross margin %
  operatingMarginPct: number | null; // GAAP operating margin
  netMarginPct: number | null;       // GAAP net profit margin
  returnOnEquity: number | null;     // ROE %
  // Non-GAAP proxies
  ebitdaMarginPct: number | null;    // EBITDA / revenue
  fcfMarginPct: number | null;       // free cash flow / revenue
  operatingCFMarginPct: number | null; // operating cash flow / revenue
  returnOnAssets: number | null;     // ROA %
}

export interface Valuation {
  pe: number | null;
  forwardPe: number | null;
  evEbitda: number | null;
  evRevenue: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  dividendRate: number | null;       // annual dividend $ per share
  peg: number | null;
  marketCap: number | null;          // raw $
  enterpriseValue: number | null;    // raw $
  totalRevenue: number | null;       // raw $
  ebitda: number | null;             // raw $
}

export interface RiskMetrics {
  beta: number | null;
  volatilityPct: number | null;
  maxDrawdownPct: number | null;
  debtToEquity: number | null;
  return1MPct: number | null;
  return3MPct: number | null;
  return6MPct: number | null;
  returnYTDPct: number | null;
}

export interface AnalystData {
  consensusRating: number | null;    // 1–5: 1=strong buy, 5=strong sell
  targetPrice: number | null;
  numberOfAnalysts: number | null;
}

export interface LeadershipOfficer {
  name: string;
  title: string;
}

export interface QualitativeData {
  thesis: string | null;
  whatNeedsToGoRight: string | null;
  sellCriteria: string | null;
  catalysts: string | null;
  businessSummary: string | null;
  leadership: LeadershipOfficer[] | null;
}

export interface PriceHistory {
  entryPrice: number | null;
  currentPrice: number | null;
  return1MPct: number | null;
  return3MPct: number | null;
  returnYTDPct: number | null;
}

export interface Position extends CsvFields {
  status: PositionStatus;
  sector: string | null;
  industry: string | null;
  delta: PositionDelta | null;
  market: MarketData;
  earnings: EarningsData;
  fundamentals: Fundamentals;
  valuation: Valuation;
  risk: RiskMetrics;
  analyst: AnalystData;
  qualitative: QualitativeData;
  priceHistory: PriceHistory;
}

export interface SortState {
  key: keyof CsvFields | keyof MarketData | 'status';
  direction: SortDirection;
}
