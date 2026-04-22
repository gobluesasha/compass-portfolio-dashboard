import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type PeerItem = {
  sym: string;
  name: string;
  price: number | null;
  changePct: number | null;
};

// Exclude ETFs and broad funds from peer lists
const EXCLUDE = new Set([
  'SPY','QQQ','VOO','IVV','VTI','DIA','IWM','GLD','TLT','BND','AGG',
  'XLK','XLV','XLF','XLE','XLU','XLI','XLC','XLY','XLP','XLRE','ARKK',
]);

const cache = new Map<string, { items: PeerItem[]; expires: number }>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchPeers(symbol: string): Promise<PeerItem[]> {
  const hit = cache.get(symbol);
  if (hit && hit.expires > Date.now()) return hit.items;

  try {
    // Yahoo Finance recommendations endpoint — same data as "People Also Watch"
    const url = `https://query2.finance.yahoo.com/v6/finance/recommendationsbysymbol/${symbol}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const recommended: { symbol: string; score: number }[] =
      json?.finance?.result?.[0]?.recommendedSymbols ?? [];

    const peerSymbols = recommended
      .filter(r => !EXCLUDE.has(r.symbol) && r.symbol !== symbol)
      .slice(0, 5)
      .map(r => r.symbol);

    if (!peerSymbols.length) {
      cache.set(symbol, { items: [], expires: Date.now() + TTL });
      return [];
    }

    // Fetch live quotes for peers
    const results = await Promise.allSettled(
      peerSymbols.map(sym => (yahooFinance as any).quote(sym))
    );

    const items: PeerItem[] = results
      .map((r, i) => {
        if (r.status === 'rejected') return null;
        const q = r.value as any;
        return {
          sym:       peerSymbols[i],
          name:      q?.longName ?? q?.shortName ?? peerSymbols[i],
          price:     q?.regularMarketPrice     ?? null,
          changePct: q?.regularMarketChangePercent ?? null,
        };
      })
      .filter((x): x is PeerItem => x !== null);

    cache.set(symbol, { items, expires: Date.now() + TTL });
    return items;
  } catch {
    cache.set(symbol, { items: [], expires: Date.now() + 60_000 });
    return [];
  }
}

export async function GET(req: NextRequest) {
  const sym = (req.nextUrl.searchParams.get('sym') ?? '').toUpperCase();
  if (!sym) return NextResponse.json({ error: 'No symbol' }, { status: 400 });
  const items = await fetchPeers(sym);
  return NextResponse.json({ data: items, symbol: sym });
}
