import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type ReturnsItem = {
  symbol: string;
  return1MPct: number | null;
  return3MPct: number | null;
  returnYTDPct: number | null;
  quarterlyReturnPct: number | null;
  maxDrawdownPct: number | null;
  sparkline: number[] | null;        // last 90 trading days of closes
  error?: boolean;
};

const cache = new Map<string, { item: ReturnsItem; expires: number }>();
const TTL = 4 * 60 * 60 * 1000; // 4 hours

function computeReturn(prices: number[], daysBack: number): number | null {
  if (prices.length < 2) return null;
  const current = prices[prices.length - 1];
  const idx = Math.max(0, prices.length - 1 - daysBack);
  const past = prices[idx];
  if (!past) return null;
  return (current - past) / past;
}

function computeMaxDrawdown(prices: number[]): number | null {
  if (prices.length < 2) return null;
  let peak = prices[0];
  let maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return -maxDD; // negative percentage
}

async function fetchOne(symbol: string): Promise<ReturnsItem> {
  const cached = cache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.item;

  const empty: ReturnsItem = {
    symbol, return1MPct: null, return3MPct: null, returnYTDPct: null,
    quarterlyReturnPct: null, maxDrawdownPct: null, sparkline: null,
  };

  try {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const history = await (yahooFinance as any).historical(symbol, {
      period1: oneYearAgo.toISOString().split('T')[0],
      period2: now.toISOString().split('T')[0],
      interval: '1d',
    }, { validateResult: false });

    if (!history?.length) {
      cache.set(symbol, { item: empty, expires: Date.now() + 60_000 });
      return empty;
    }

    const sorted = [...history].sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const closes: number[] = sorted
      .map((d: any) => d.close ?? d.adjClose ?? null)
      .filter((v: number | null) => v !== null);

    if (!closes.length) {
      cache.set(symbol, { item: empty, expires: Date.now() + 60_000 });
      return empty;
    }

    // YTD: compare to first close of current year
    const ytdIdx = sorted.findIndex((d: any) => {
      const date = new Date(d.date);
      return date.getFullYear() === now.getFullYear();
    });
    const ytdStartClose = ytdIdx >= 0 ? (sorted[ytdIdx] as any)?.close ?? null : null;
    const currentClose = closes[closes.length - 1];
    const returnYTDPct = ytdStartClose ? (currentClose - ytdStartClose) / ytdStartClose : null;

    const item: ReturnsItem = {
      symbol,
      return1MPct:        computeReturn(closes, 21),
      return3MPct:        computeReturn(closes, 63),
      returnYTDPct,
      quarterlyReturnPct: computeReturn(closes, 63),
      maxDrawdownPct:     computeMaxDrawdown(closes),
      sparkline:          closes.slice(-90),
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

  const results: ReturnsItem[] = [];
  const batchSize = 5;
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
