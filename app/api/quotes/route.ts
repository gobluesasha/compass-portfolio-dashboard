import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type LiveQuote = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  pe: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  error?: boolean;
};

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbols') ?? '';
  const symbols = raw.split(',').map(s => s.trim()).filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const results = await Promise.allSettled(
    symbols.map(sym => yahooFinance.quote(sym, {}, { validateResult: false }))
  );

  const data: LiveQuote[] = results.map((r, i) => {
    if (r.status === 'rejected') {
      return { symbol: symbols[i], price: null, change: null, changePct: null, pe: null, marketCap: null, dividendYield: null, dividendRate: null, error: true };
    }
    const q = r.value as any;
    return {
      symbol:        symbols[i],
      price:         q?.regularMarketPrice         ?? null,
      change:        q?.regularMarketChange        ?? null,
      changePct:     q?.regularMarketChangePercent ?? null,
      pe:            q?.trailingPE                 ?? null,
      marketCap:     q?.marketCap                  ?? null,
      dividendYield: q?.dividendYield              ?? null,
      dividendRate:  q?.trailingAnnualDividendRate ?? q?.dividendRate ?? null,
    };
  });

  return NextResponse.json({ data, timestamp: Date.now() });
}
