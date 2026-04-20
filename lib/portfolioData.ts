// ─────────────────────────────────────────────────────────────
// Compass Capital Management — Portfolio Data
// Source: Q4 2025 13-F Filing
// ─────────────────────────────────────────────────────────────

import {
  Position,
  PositionStatus,
  EarningsResult,
  MarketData,
  EarningsData,
  Fundamentals,
  Valuation,
  RiskMetrics,
  AnalystData,
  QualitativeData,
  PriceHistory,
} from '../types/portfolio';
import { SECTOR_MAP, computeQ4Delta } from './historicalData';

// ── Raw CSV rows  (pipe-delimited to avoid quote escaping) ────
// Format: SYM|NAME|CLASS|CUSIP|VALUE_K|WEIGHT_PCT|SHARES
const RAW_ROWS = `APH|AMPHENOL CORP NEW|CL A|032095101|82702|4.6|611977
MSFT|MICROSOFT CORP|COM|594918104|80623|4.5|166709
GOOGL|ALPHABET INC|CAP STK CL A|02079K305|73310|4.1|234219
MRK|MERCK & CO INC|COM|58933Y105|71790|4.0|682027
WMT|WALMART INC|COM|931142103|66569|3.7|597515
TMO|THERMO FISHER SCIENTIFIC INC|COM|883556102|66221|3.7|114283
JNJ|JOHNSON & JOHNSON|COM|478160104|66074|3.7|319277
EXPD|EXPEDITORS INTL WASH INC|COM|302130109|66005|3.7|442961
V|VISA INC|COM CL A|92826C839|64047|3.6|182622
DHR|DANAHER CORPORATION|COM|235851102|62660|3.5|273722
NVDA|NVIDIA CORPORATION|COM|67066G104|61965|3.4|332253
QCOM|QUALCOMM INC|COM|747525103|60770|3.4|355281
ACN|ACCENTURE PLC IRELAND|SHS CLASS A|G1151C101|59705|3.3|222534
ICE|INTERCONTINENTAL EXCHANGE IN|COM|45866F104|58546|3.3|361486
SYK|STRYKER CORPORATION|COM|863667101|57030|3.2|162263
SHW|SHERWIN WILLIAMS CO|COM|824348106|56231|3.1|173538
BSX|BOSTON SCIENTIFIC CORP|COM|101137107|55690|3.1|584068
FAST|FASTENAL CO|COM|311900104|55686|3.1|1387651
ITW|ILLINOIS TOOL WKS INC|COM|452308109|55062|3.1|223560
MSI|MOTOROLA SOLUTIONS INC|COM NEW|620076307|54128|3.0|141210
CHKP|CHECK POINT SOFTWARE TECH LT|ORD|M22465104|54061|3.0|291340
ROP|ROPER TECHNOLOGIES INC|COM|776696106|52849|2.9|118729
ADP|AUTOMATIC DATA PROCESSING IN|COM|053015103|52400|2.9|203710
CHD|CHURCH & DWIGHT CO INC|COM|171340102|51472|2.9|613859
LIN|LINDE PLC|SHS|G54950103|49341|2.7|115720
AAPL|APPLE INC|COM|037833100|15375|0.9|56557
MAR|MARRIOTT INTL INC NEW|CL A|571903202|15334|0.9|49429
LLY|ELI LILLY & CO|COM|532457108|14178|0.8|13193
RTX|RTX CORPORATION|COM|75513E101|13679|0.8|74588
PANW|PALO ALTO NETWORKS INC|COM|697435105|13592|0.8|73794
MA|MASTERCARD INCORPORATED|CL A|57636Q104|13146|0.7|23029
AMZN|AMAZON COM INC|COM|023135106|12573|0.7|54472
CAT|CATERPILLAR INC|COM|149123101|11778|0.7|20560
ISRG|INTUITIVE SURGICAL INC|COM NEW|46120E602|11297|0.6|19947
BA|BOEING CO|COM|097023105|11136|0.6|51290
NOW|SERVICENOW INC|COM|81762P102|10092|0.6|65885
CRM|SALESFORCE INC|COM|79466L302|9957|0.6|37587
RCL|ROYAL CARIBBEAN GROUP|COM|V7780T103|9638|0.5|34556
ZTS|ZOETIS INC|CL A|98978V103|8875|0.5|62582
DAL|DELTA AIR LINES INC DEL|COM NEW|247361702|8801|0.5|126819
GEV|GE VERNOVA INC|COM|36828A101|8661|0.5|13253
BRK-A|BERKSHIRE HATHAWAY INC DEL|CL A|084670108|8302|0.5|11
HD|HOME DEPOT INC|COM|437076102|7765|0.4|22568
DE|DEERE & CO|COM|244199105|7087|0.4|15223
SBUX|STARBUCKS CORP|COM|855244109|6705|0.4|79626
DVN|DEVON ENERGY CORP NEW|COM|25179M103|6074|0.3|165832
BRK-B|BERKSHIRE HATHAWAY INC DEL|CL B NEW|084670702|5131|0.3|10209
AVGO|BROADCOM INC|COM|11135F101|4718|0.3|13633
JPM|JPMORGAN CHASE & CO.|COM|46625H100|3203|0.2|9942
CB|CHUBB LIMITED|COM|H1467J104|2546|0.1|8160
VOO|VANGUARD INDEX FDS|S&P 500 ETF SHS|922908363|2041|0.1|3256
GOOG|ALPHABET INC|CAP STK CL C|02079K107|2031|0.1|6474
SPY|SPDR S&P 500 ETF TR|TR UNIT|78462F103|1671|0.1|2451
SPGI|S&P GLOBAL INC|COM|78409V104|1509|0.1|2889
MCD|MCDONALDS CORP|COM|580135101|1453|0.1|4756
BP|BP PLC|SPONSORED ADR|055622104|1303|0.1|37525
VTV|VANGUARD INDEX FDS|VALUE ETF|922908744|1294|0.1|6777
BLK|BLACKROCK INC|COM|09290D101|1284|0.1|1200
XOM|EXXON MOBIL CORP|COM|30231G102|1261|0.1|10486
OMC|OMNICOM GROUP INC|COM|681919106|872|0.0|10806
AMGN|AMGEN INC|COM|031162100|767|0.0|2345
RSP|INVESCO EXCHANGE TRADED FD T|S&P500 EQL WGT|46137V357|636|0.0|3323
VB|VANGUARD INDEX FDS|SMALL CP ETF|922908751|613|0.0|2380
JPSE|J P MORGAN EXCHANGE TRADED F|DIVERSFD EQT ETF|46641Q845|609|0.0|12170
XLG|INVESCO EXCHANGE TRADED FD T|S&P 500 TOP 50|46137V233|592|0.0|10000
EQWL|INVESCO EXCHANGE TRADED FD T|S&P 100 EQL WIGH|46137V449|587|0.0|4976
PEP|PEPSICO INC|COM|713448108|584|0.0|4072
JPME|J P MORGAN EXCHANGE TRADED F|DIVERSFED RTRN|46641Q886|578|0.0|5320
HON|HONEYWELL INTL INC|COM|438516106|571|0.0|2931
TGT|TARGET CORP|COM|87612E106|509|0.0|5216
VBR|VANGUARD INDEX FDS|SM CP VAL ETF|922908611|453|0.0|2140
DCI|DONALDSON INC|COM|257651109|421|0.0|4750
PAYX|PAYCHEX INC|COM|704326107|417|0.0|3718
IWP|ISHARES TR|RUS MD CP GR ETF|464287481|411|0.0|3002
DIS|DISNEY WALT CO|COM|254687106|410|0.0|3600
SCHR|SCHWAB STRATEGIC TR|INT-TRM U.S TRES|808524854|404|0.0|16119
VOE|VANGUARD INDEX FDS|MCAP VL IDXVIP|922908512|384|0.0|2170
IWD|ISHARES TR|RUS 1000 VAL ETF|464287598|359|0.0|1711
EMR|EMERSON ELEC CO|COM|291011104|326|0.0|2459
EFA|ISHARES TR|MSCI EAFE ETF|464287465|308|0.0|3210
JKH|ISHARES TR|MRGSTR MD CP GRW|464288307|306|0.0|3840
NEE|NEXTERA ENERGY INC|COM|65339F101|256|0.0|3200
IWF|ISHARES TR|RUS 1000 GRW ETF|464287614|216|0.0|458`;

// ── Mock status overrides per ticker ─────────────────────────
const STATUS_MAP: Record<string, PositionStatus> = {
  APH: 'green', MSFT: 'green', GOOGL: 'green', MRK: 'yellow', WMT: 'green',
  TMO: 'green', JNJ: 'yellow', EXPD: 'green', V: 'green',   DHR: 'green',
  NVDA: 'green', QCOM: 'yellow', ACN: 'green', ICE: 'green', SYK: 'green',
  SHW: 'green', BSX: 'green', FAST: 'green', ITW: 'green',  MSI: 'green',
  CHKP: 'green', ROP: 'green', ADP: 'green', CHD: 'yellow', LIN: 'green',
  AAPL: 'green', MAR: 'yellow', LLY: 'green', RTX: 'green', PANW: 'green',
  MA: 'green',  AMZN: 'green', CAT: 'yellow', ISRG: 'green', BA: 'red',
  NOW: 'green', CRM: 'green', RCL: 'yellow', ZTS: 'green',  DAL: 'yellow',
  GEV: 'green', 'BRK-A': 'green', HD: 'yellow', DE: 'yellow', SBUX: 'red',
  DVN: 'yellow', 'BRK-B': 'yellow', AVGO: 'green', JPM: 'yellow', CB: 'green',
  VOO: 'yellow', GOOG: 'green', SPY: 'yellow', SPGI: 'green', MCD: 'yellow',
  BP: 'red', VTV: 'yellow', BLK: 'green', XOM: 'yellow', OMC: 'yellow',
  AMGN: 'yellow', RSP: 'yellow', VB: 'yellow', JPSE: 'yellow', XLG: 'yellow',
  EQWL: 'yellow', PEP: 'yellow', JPME: 'yellow', HON: 'yellow', TGT: 'red',
  VBR: 'yellow', DCI: 'yellow', PAYX: 'yellow', IWP: 'yellow', DIS: 'red',
  SCHR: 'yellow', VOE: 'yellow', IWD: 'yellow', EMR: 'yellow', EFA: 'yellow',
  JKH: 'yellow', NEE: 'yellow', IWF: 'yellow',
};

// ── Mock earnings overrides per ticker ────────────────────────
const EARNINGS_MAP: Record<string, EarningsResult> = {
  APH: 'beat', MSFT: 'beat', GOOGL: 'beat', MRK: 'miss', WMT: 'beat',
  TMO: 'beat', JNJ: 'inline', EXPD: 'beat', V: 'beat',   DHR: 'miss',
  NVDA: 'beat', QCOM: 'beat', ACN: 'beat', ICE: 'beat', SYK: 'beat',
  SHW: 'inline', BSX: 'beat', FAST: 'beat', ITW: 'beat', MSI: 'beat',
  CHKP: 'beat', ROP: 'beat', ADP: 'beat', CHD: 'inline', LIN: 'beat',
  AAPL: 'beat', MAR: 'beat', LLY: 'beat', RTX: 'inline', PANW: 'beat',
  MA: 'beat', AMZN: 'beat', CAT: 'miss', ISRG: 'beat', BA: 'miss',
  NOW: 'beat', CRM: 'beat', RCL: 'beat', ZTS: 'inline', DAL: 'beat',
};

const NEXT_EARNINGS_MAP: Record<string, string> = {
  APH: '2026-01-22', MSFT: '2026-01-29', GOOGL: '2026-02-04', MRK: '2026-02-07',
  WMT: '2026-02-18', TMO: '2026-01-29', JNJ: '2026-01-22', V: '2026-01-28',
  DHR: '2026-01-28', NVDA: '2026-02-26', QCOM: '2026-01-29', AAPL: '2026-01-30',
  AMZN: '2026-02-05', MA: '2026-01-28',
};

// ── Null placeholder factories ────────────────────────────────
const nullMarket = (): MarketData => ({
  price: null, dayChangePct: null, totalReturnPct: null,
  quarterlyGrowth: null, contributionToReturn: null, sparkline: null,
});

const nullEarnings = (sym: string): EarningsData => ({
  lastEarnings: EARNINGS_MAP[sym] ?? null,
  lastEarningsDate: null,
  nextEarningsDate: NEXT_EARNINGS_MAP[sym] ?? null,
});

const nullFundamentals = (): Fundamentals => ({
  revenueGrowthPct: null, epsGrowthPct: null,
  grossMarginPct: null, returnOnEquity: null,
});

const nullValuation = (): Valuation => ({
  pe: null, forwardPe: null, evEbitda: null,
  priceToSales: null, priceToBook: null, dividendYield: null, dividendRate: null,
});

const nullRisk = (): RiskMetrics => ({
  beta: null, volatilityPct: null, maxDrawdownPct: null, debtToEquity: null,
  return1MPct: null, return3MPct: null, returnYTDPct: null,
});

const nullAnalyst = (): AnalystData => ({
  consensusRating: null, targetPrice: null, numberOfAnalysts: null,
});

const nullQualitative = (): QualitativeData => ({
  thesis: null, whatNeedsToGoRight: null,
  sellCriteria: null, catalysts: null, businessSummary: null,
});

const nullPriceHistory = (): PriceHistory => ({
  entryPrice: null, currentPrice: null,
  return1MPct: null, return3MPct: null, returnYTDPct: null,
});

// ── CSV parser ────────────────────────────────────────────────
function parsePortfolioData(): Position[] {
  return RAW_ROWS.trim().split('\n').map((line) => {
    const parts = line.split('|');
    const sym    = parts[0].trim();
    const name   = parts[1].trim();
    const cl     = parts[2].trim();
    const cusip  = parts[3].trim();
    const valueK = parseInt(parts[4], 10);
    const wPct   = parseFloat(parts[5]);
    const shares = parseInt(parts[6].replace(/,/g, ''), 10);

    return {
      sym,
      issuerName: name,
      cl,
      cusip,
      valueK,
      weight: wPct / 100,
      weightDisplay: `${wPct.toFixed(1)}%`,
      shares,
      status: STATUS_MAP[sym] ?? 'yellow',
      sector: SECTOR_MAP[sym]?.sector ?? null,
      industry: SECTOR_MAP[sym]?.industry ?? null,
      delta: computeQ4Delta(sym, shares),
      market: nullMarket(),
      earnings: nullEarnings(sym),
      fundamentals: nullFundamentals(),
      valuation: nullValuation(),
      risk: nullRisk(),
      analyst: nullAnalyst(),
      qualitative: nullQualitative(),
      priceHistory: nullPriceHistory(),
    } satisfies Position;
  });
}

// ── Exported portfolio data ───────────────────────────────────
export const PORTFOLIO: Position[] = parsePortfolioData();

// ── Summary stats ─────────────────────────────────────────────
export const PORTFOLIO_STATS = {
  totalPositions: PORTFOLIO.length,
  totalValueK: PORTFOLIO.reduce((s, p) => s + p.valueK, 0),
  greenCount:  PORTFOLIO.filter((p) => p.status === 'green').length,
  yellowCount: PORTFOLIO.filter((p) => p.status === 'yellow').length,
  redCount:    PORTFOLIO.filter((p) => p.status === 'red').length,
  top10Weight: PORTFOLIO.slice(0, 10).reduce((s, p) => s + p.weight, 0),
  asOfDate: 'Q4 2025',
};
