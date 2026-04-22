import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type FundamentalsItem = {
  symbol: string;
  // Fundamentals
  revenueGrowthPct: number | null;
  epsGrowthPct: number | null;
  grossMarginPct: number | null;
  returnOnEquity: number | null;
  // Valuation multiples
  pe: number | null;
  forwardPe: number | null;
  evEbitda: number | null;
  evRevenue: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  pegRatio: number | null;
  // Absolute financials
  marketCap: number | null;
  enterpriseValue: number | null;
  totalRevenue: number | null;
  ebitda: number | null;
  // Risk
  beta: number | null;
  debtToEquity: number | null;
  // Analyst consensus
  consensusRating: number | null;    // 1–5: 1=strong buy, 5=strong sell
  targetPrice: number | null;
  numberOfAnalysts: number | null;
  // Meta
  sector: string | null;
  industry: string | null;
  businessSummary: string | null;
  officers: { name: string; title: string }[] | null;
  error?: boolean;
};

const ETF_SET = new Set([
  'VOO','SPY','QQQ','GLD','TLT','RSP','VB','JPSE','XLG','EQWL',
  'JPME','VBR','IWP','SCHR','VOE','IWD','EFA','JKH','IWF','VTV',
]);

const cache = new Map<string, { item: FundamentalsItem; expires: number }>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchOne(symbol: string): Promise<FundamentalsItem> {
  const cached = cache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.item;

  const empty: FundamentalsItem = {
    symbol, revenueGrowthPct: null, epsGrowthPct: null,
    grossMarginPct: null, returnOnEquity: null,
    pe: null, forwardPe: null, evEbitda: null, evRevenue: null,
    priceToSales: null, priceToBook: null, dividendYield: null, dividendRate: null, pegRatio: null,
    marketCap: null, enterpriseValue: null, totalRevenue: null, ebitda: null,
    beta: null, debtToEquity: null,
    consensusRating: null, targetPrice: null, numberOfAnalysts: null,
    sector: null, industry: null, businessSummary: null, officers: null,
  };

  if (ETF_SET.has(symbol)) {
    cache.set(symbol, { item: empty, expires: Date.now() + TTL });
    return empty;
  }

  try {
    const summary = await yahooFinance.quoteSummary(
      symbol,
      { modules: ['financialData', 'defaultKeyStatistics', 'assetProfile', 'summaryDetail'] as any },
      { validateResult: false }
    );

    const fd  = (summary as any)?.financialData        ?? {};
    const ks  = (summary as any)?.defaultKeyStatistics  ?? {};
    const ap  = (summary as any)?.assetProfile          ?? {};
    const sd  = (summary as any)?.summaryDetail         ?? {};

    const item: FundamentalsItem = {
      symbol,
      revenueGrowthPct:   fd.revenueGrowth                     ?? null,
      epsGrowthPct:       fd.earningsGrowth                     ?? null,
      grossMarginPct:     fd.grossMargins                       ?? null,
      returnOnEquity:     fd.returnOnEquity                     ?? null,
      pe:                 sd.trailingPE                         ?? null,
      forwardPe:          sd.forwardPE                          ?? null,
      evEbitda:           ks.enterpriseToEbitda                 ?? null,
      evRevenue:          ks.enterpriseToRevenue                ?? null,
      priceToSales:       ks.priceToSalesTrailing12Months       ?? null,
      priceToBook:        ks.priceToBook                        ?? null,
      dividendYield:      sd.dividendYield                      ?? null,
      dividendRate:       sd.dividendRate                       ?? null,
      pegRatio:           ks.trailingPegRatio ?? ks.pegRatio    ?? null,
      marketCap:          sd.marketCap        ?? ks.marketCap   ?? null,
      enterpriseValue:    ks.enterpriseValue                    ?? null,
      totalRevenue:       fd.totalRevenue                       ?? null,
      ebitda:             fd.ebitda                             ?? null,
      beta:               sd.beta                               ?? null,
      debtToEquity:       fd.debtToEquity                       ?? null,
      // Analyst consensus
      consensusRating:    fd.recommendationMean                 ?? null,
      targetPrice:        fd.targetMeanPrice                    ?? null,
      numberOfAnalysts:   fd.numberOfAnalystOpinions            ?? null,
      sector:             ap.sector                             ?? null,
      industry:           ap.industry                           ?? null,
      businessSummary:    ap.longBusinessSummary                ?? null,
      officers: Array.isArray(ap.companyOfficers)
        ? ap.companyOfficers.slice(0, 5).map((o: any) => ({
            name:  String(o.name  ?? ''),
            title: String(o.title ?? ''),
          }))
        : null,
    };

    cache.set(symbol, { item, expires: Date.now() + TTL });
    return item;
  } catch {
    const item = { ...empty, error: true };
    cache.set(symbol, { item, expires: Date.now() + 60_000 });
    return item;
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbols') ?? '';
  const symbols = raw.split(',').map(s => s.trim()).filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: 'No symbols' }, { status: 400 });
  }

  const results: FundamentalsItem[] = [];
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fetchOne));
    results.push(...batchResults);
    if (i + batchSize < symbols.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return NextResponse.json({ data: results, timestamp: Date.now() });
}
