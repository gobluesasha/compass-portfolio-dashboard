import { NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

const BENCHMARKS = [
  { symbol: '^GSPC', label: 'S&P 500',      format: 'index' },
  { symbol: '^NDX',  label: 'Nasdaq 100',   format: 'index' },
  { symbol: '^DJI',  label: 'Dow Jones',    format: 'index' },
  { symbol: '^RUT',  label: 'Russell 2000', format: 'index' },
  { symbol: '^VIX',  label: 'VIX',          format: 'decimal' },
  { symbol: '^TNX',  label: '10Y Yield',    format: 'rate'  },
  { symbol: 'GLD',   label: 'Gold (GLD)',   format: 'price' },
  { symbol: 'TLT',   label: 'Long Bond',    format: 'price' },
];

export type BenchmarkItem = {
  symbol: string;
  label: string;
  format: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  marketState: string;
};

export async function GET() {
  try {
    const results = await Promise.allSettled(
      BENCHMARKS.map(b => yahooFinance.quote(b.symbol, {}, { validateResult: false }))
    );

    const data: BenchmarkItem[] = results.map((r, i) => {
      const q = r.status === 'fulfilled' ? (r.value as any) : null;
      return {
        ...BENCHMARKS[i],
        price:     q?.regularMarketPrice         ?? null,
        change:    q?.regularMarketChange        ?? null,
        changePct: q?.regularMarketChangePercent ?? null,
        marketState: q?.marketState ?? 'CLOSED',
      };
    });

    return NextResponse.json({ data, timestamp: Date.now() });
  } catch (err) {
    console.error('Benchmarks API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
