import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type EarningsResult = 'beat' | 'miss' | 'inline' | null;

export type EarningsItem = {
  symbol: string;
  result: EarningsResult;
  surprisePct: number | null;
  date: string | null;
  nextEarningsDate: string | null;
};

// ETFs & funds — skip earnings fetch
const ETF_SET = new Set([
  'VOO','SPY','QQQ','GLD','TLT','RSP','VB','JPSE','XLG','EQWL',
  'JPME','VBR','IWP','SCHR','VOE','IWD','EFA','JKH','IWF','VTV',
  'DIA','IWM','BND','AGG',
]);

// Server-side in-memory cache (shared across hot-reloads in dev)
const cache = new Map<string, { item: EarningsItem; expires: number }>();
const TTL = 4 * 60 * 60 * 1000; // 4 hours

async function fetchOne(symbol: string): Promise<EarningsItem> {
  const cached = cache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.item;

  if (ETF_SET.has(symbol)) {
    const item: EarningsItem = { symbol, result: null, surprisePct: null, date: null, nextEarningsDate: null };
    cache.set(symbol, { item, expires: Date.now() + TTL });
    return item;
  }

  try {
    const summary = await yahooFinance.quoteSummary(
      symbol,
      { modules: ['earningsHistory', 'calendarEvents'] as any },
      { validateResult: false }
    );

    const history = (summary as any)?.earningsHistory?.history;

    let result: EarningsResult = null;
    let surprisePct: number | null = null;
    let date: string | null = null;

    if (history?.length) {
      const latest = history[history.length - 1];
      const actual   = latest?.actual   ?? null;
      const estimate = latest?.estimate ?? null;

      if (actual !== null && estimate !== null && estimate !== 0) {
        surprisePct = (actual - estimate) / Math.abs(estimate);
      }
      if (surprisePct !== null) {
        if (surprisePct > 0.03)       result = 'beat';
        else if (surprisePct < -0.03) result = 'miss';
        else                          result = 'inline';
      }

      const rawDate = latest?.quarter ?? latest?.date ?? null;
      if (rawDate) {
        const d = rawDate instanceof Date ? rawDate : typeof rawDate === 'number' ? new Date(rawDate * 1000) : null;
        date = d
          ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : String(rawDate);
      }
    }

    // Next earnings date from calendarEvents
    let nextEarningsDate: string | null = null;
    const calEarnings = (summary as any)?.calendarEvents?.earnings;
    const earningsDates = calEarnings?.earningsDate ?? calEarnings?.earningsDateStr ?? null;
    if (Array.isArray(earningsDates) && earningsDates.length > 0) {
      const raw = earningsDates[0];
      const d = raw instanceof Date ? raw : typeof raw === 'number' ? new Date(raw * 1000) : null;
      if (d) nextEarningsDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const item: EarningsItem = { symbol, result, surprisePct, date, nextEarningsDate };
    cache.set(symbol, { item, expires: Date.now() + TTL });
    return item;
  } catch {
    const item: EarningsItem = { symbol, result: null, surprisePct: null, date: null, nextEarningsDate: null };
    cache.set(symbol, { item, expires: Date.now() + 60_000 }); // short TTL on error
    return item;
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbols') ?? '';
  const symbols = raw.split(',').map(s => s.trim()).filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: 'No symbols' }, { status: 400 });
  }

  // Batch in groups of 8 with a small delay to respect rate limits
  const results: EarningsItem[] = [];
  const batchSize = 8;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fetchOne));
    results.push(...batchResults);
    if (i + batchSize < symbols.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  return NextResponse.json({ data: results, timestamp: Date.now() });
}
