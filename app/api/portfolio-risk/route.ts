import { NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';
import { PORTFOLIO } from '../../../lib/portfolioData';

export const dynamic = 'force-dynamic';

const CORE_THRESHOLD = 0.027;
const TTL = 4 * 60 * 60 * 1000; // 4 hours

export type PortfolioRiskResult = {
  portfolioBeta:  number | null;
  volatilityAnn:  number | null;  // annualized %, e.g. 14.2
  var95_1day:     number | null;  // % of portfolio, e.g. 1.47
  sharpeRatio:    number | null;
  riskFreeRate:   number | null;  // annual %, e.g. 4.3
  dataPoints:     number;         // trading days used
};

const ETF_SET = new Set([
  'VOO','SPY','QQQ','GLD','TLT','RSP','VB','JPSE','XLG','EQWL',
  'JPME','VBR','IWP','SCHR','VOE','IWD','EFA','JKH','IWF','VTV',
  'DIA','IWM','BND','AGG',
]);

let cached: { data: PortfolioRiskResult; expires: number } | null = null;

async function fetchCloses(symbol: string): Promise<{ date: string; close: number }[]> {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    const history = await (yahooFinance as any).historical(symbol, {
      period1: oneYearAgo.toISOString().split('T')[0],
      period2: now.toISOString().split('T')[0],
      interval: '1d',
    }, { validateResult: false });

    if (!history?.length) return [];

    return [...history]
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d: any) => ({
        date: new Date(d.date).toISOString().slice(0, 10),
        close: d.close ?? d.adjClose ?? null,
      }))
      .filter(d => d.close !== null) as { date: string; close: number }[];
  } catch {
    return [];
  }
}

function dailyReturns(closes: { date: string; close: number }[]): Map<string, number> {
  const returns = new Map<string, number>();
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1].close;
    const cur  = closes[i].close;
    if (prev > 0) returns.set(closes[i].date, (cur - prev) / prev);
  }
  return returns;
}

export async function GET() {
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ data: cached.data, cached: true });
  }

  // Core equity positions only (ETFs excluded — their betas/returns would distort portfolio stats)
  const corePositions = PORTFOLIO.filter(
    p => p.weight >= CORE_THRESHOLD && !ETF_SET.has(p.sym)
  );
  const totalCoreWeight = corePositions.reduce((s, p) => s + p.weight, 0);
  const positions = corePositions.map(p => ({
    sym:    p.sym,
    weight: p.weight / totalCoreWeight, // normalize weights to sum to 1
  }));

  // Fetch closes in batches of 5 (same pattern as returns API)
  const closesMap: Record<string, { date: string; close: number }[]> = {};
  const allSymbols = [...positions.map(p => p.sym), 'SPY'];
  const BATCH = 5;

  for (let i = 0; i < allSymbols.length; i += BATCH) {
    const batch = allSymbols.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(sym => fetchCloses(sym)));
    results.forEach((r, idx) => {
      closesMap[batch[idx]] = r.status === 'fulfilled' ? r.value : [];
    });
    if (i + BATCH < allSymbols.length) await new Promise(r => setTimeout(r, 150));
  }

  // Risk-free rate from ^IRX (13-week T-bill, already in % e.g. 4.3)
  let riskFreeRate: number | null = null;
  try {
    const irx = await (yahooFinance as any).quote('^IRX');
    riskFreeRate = irx?.regularMarketPrice ?? null;
  } catch {}

  // Build aligned daily returns for portfolio and SPY
  const spyReturns = dailyReturns(closesMap['SPY'] ?? []);
  const posReturns: Map<string, Map<string, number>> = new Map();
  for (const pos of positions) {
    posReturns.set(pos.sym, dailyReturns(closesMap[pos.sym] ?? []));
  }

  // Find dates where SPY has a return (defines the trading calendar)
  const tradingDates = [...spyReturns.keys()].sort();

  // Portfolio daily return series
  const portReturns: number[] = [];
  const spyReturnSeries: number[] = [];

  for (const date of tradingDates) {
    let portRet = 0;
    let coveredWeight = 0;

    for (const pos of positions) {
      const r = posReturns.get(pos.sym)?.get(date);
      if (r !== undefined && isFinite(r)) {
        portRet      += pos.weight * r;
        coveredWeight += pos.weight;
      }
    }

    // Only include days where we have >60% of core portfolio covered
    if (coveredWeight > 0.6) {
      portReturns.push(portRet / coveredWeight); // normalize to covered weight
      spyReturnSeries.push(spyReturns.get(date)!);
    }
  }

  const dataPoints = portReturns.length;
  const empty: PortfolioRiskResult = {
    portfolioBeta: null, volatilityAnn: null,
    var95_1day: null, sharpeRatio: null, riskFreeRate, dataPoints,
  };

  if (dataPoints < 30) {
    cached = { data: empty, expires: Date.now() + 60_000 };
    return NextResponse.json({ data: empty });
  }

  // Portfolio mean daily return
  const mean = portReturns.reduce((s, r) => s + r, 0) / dataPoints;

  // Annualized volatility
  const variance = portReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (dataPoints - 1);
  const dailyVol  = Math.sqrt(variance);
  const volatilityAnn = Math.round(dailyVol * Math.sqrt(252) * 100 * 10) / 10;

  // VaR 95% 1-Day (parametric, normal distribution)
  const var95_1day = Math.round(dailyVol * 1.645 * 100 * 100) / 100;

  // Portfolio Beta = cov(portfolio, SPY) / var(SPY)
  const spyMean = spyReturnSeries.reduce((s, r) => s + r, 0) / dataPoints;
  let cov = 0, spyVar = 0;
  for (let i = 0; i < dataPoints; i++) {
    cov    += (portReturns[i] - mean) * (spyReturnSeries[i] - spyMean);
    spyVar += (spyReturnSeries[i] - spyMean) ** 2;
  }
  const portfolioBeta = spyVar > 0
    ? Math.round((cov / spyVar) * 100) / 100
    : null;

  // Sharpe Ratio (annualized)
  let sharpeRatio: number | null = null;
  if (riskFreeRate !== null && volatilityAnn > 0) {
    const annReturn   = mean * 252 * 100; // in %
    sharpeRatio = Math.round((annReturn - riskFreeRate) / volatilityAnn * 100) / 100;
  }

  const data: PortfolioRiskResult = {
    portfolioBeta, volatilityAnn, var95_1day, sharpeRatio, riskFreeRate, dataPoints,
  };

  cached = { data, expires: Date.now() + TTL };
  return NextResponse.json({ data, timestamp: Date.now() });
}
