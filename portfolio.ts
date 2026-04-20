// ─────────────────────────────────────────────────────────────
// Compass Capital Management — Portfolio Dashboard Types
// ─────────────────────────────────────────────────────────────

export type EarningsResult = 'beat' | 'miss' | 'inline' | null;
export type PositionStatus = 'green' | 'yellow' | 'red';
export type SortDirection = 'asc' | 'desc';

// ── Raw CSV fields, normalised ────────────────────────────────
export interface CsvFields {
  sym: string;          // Ticker symbol
  issuerName: string;   // Company name
  cl: string;           // Share class
  cusip: string;        // CUSIP identifier
  valueK: number;       // Portfolio value in $000
  weight: number;       // Decimal weight  e.g. 0.046
  weightDisplay: string;// Display string  e.g. "4.6%"
  shares: number;       // Number of shares held
}

// ── Live market data (to be populated via API later) ──────────
export interface MarketData {
  price: number | null;
  dayChangePct: number | null;
  totalReturnPct: number | null;
  quarterlyGrowth: number | null;
  contributionToReturn: number | null;
}

// ── Earnings ──────────────────────────────────────────────────
export interface EarningsData {
  lastEarnings: EarningsResult;
  lastEarningsDate: string | null;
  nextEarningsDate: string | null;
}

// ── Fundamental data ──────────────────────────────────────────
export interface Fundamentals {
  revenueGrowthPct: number | null;
  epsGrowthPct: number | null;
  projectedGrowthPct: number | null;
  actualGrowthPct: number | null;
}

// ── Valuation multiples ───────────────────────────────────────
export interface Valuation {
  pe: number | null;
  evEbitda: number | null;
  priceToSales: number | null;
}

// ── Risk metrics ──────────────────────────────────────────────
export interface RiskMetrics {
  volatilityPct: number | null;
  beta: number | null;
  maxDrawdownPct: number | null;
}

// ── Qualitative investment notes ──────────────────────────────
export interface QualitativeData {
  thesis: string | null;
  whatNeedsToGoRight: string | null;
  sellCriteria: string | null;
  catalysts: string | null;
}

// ── Price history / relative performance ─────────────────────
export interface PriceHistory {
  entryPrice: number | null;
  currentPrice: number | null;
  return1MPct: number | null;
  return3MPct: number | null;
  returnYTDPct: number | null;
}

// ── Master Position type ──────────────────────────────────────
export interface Position extends CsvFields {
  status: PositionStatus;
  market: MarketData;
  earnings: EarningsData;
  fundamentals: Fundamentals;
  valuation: Valuation;
  risk: RiskMetrics;
  qualitative: QualitativeData;
  priceHistory: PriceHistory;
}

// ── Table sort state ──────────────────────────────────────────
export interface SortState {
  key: keyof CsvFields | keyof MarketData | 'status';
  direction: SortDirection;
}
