import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type HistoricalValuationYear = {
  year: number;
  pe: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evEbitda: number | null;
};

const cache = new Map<string, { data: HistoricalValuationYear[]; expires: number }>();
const TTL = 24 * 60 * 60 * 1000;

const ETF_SET = new Set([
  'VOO','SPY','QQQ','GLD','TLT','RSP','VB','JPSE','XLG','EQWL',
  'JPME','VBR','IWP','SCHR','VOE','IWD','EFA','JKH','IWF','VTV',
]);

export async function GET(req: NextRequest) {
  const sym = (req.nextUrl.searchParams.get('sym') ?? '').toUpperCase();
  if (!sym) return NextResponse.json({ error: 'No symbol' }, { status: 400 });

  const hit = cache.get(sym);
  if (hit && hit.expires > Date.now()) return NextResponse.json({ data: hit.data });

  if (ETF_SET.has(sym)) {
    cache.set(sym, { data: [], expires: Date.now() + TTL });
    return NextResponse.json({ data: [] });
  }

  try {
    const summary = await yahooFinance.quoteSummary(sym, {
      modules: ['incomeStatementHistory', 'balanceSheetHistory', 'defaultKeyStatistics'] as any,
    }, { validateResult: false });

    const incomeStmts: any[] =
      (summary as any)?.incomeStatementHistory?.incomeStatementHistory ?? [];
    const balanceSheets: any[] =
      (summary as any)?.balanceSheetHistory?.balanceSheetStatements ?? [];
    const ks = (summary as any)?.defaultKeyStatistics ?? {};
    const sharesOutstanding: number | null = ks.sharesOutstanding ?? null;

    if (!incomeStmts.length || !sharesOutstanding) {
      cache.set(sym, { data: [], expires: Date.now() + TTL });
      return NextResponse.json({ data: [] });
    }

    // Balance sheet by fiscal year
    const bsMap = new Map<number, any>();
    for (const bs of balanceSheets) {
      const yr = new Date(bs.endDate).getFullYear();
      bsMap.set(yr, bs);
    }

    // Fetch 4 years of daily prices to find year-end closes
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

    const history: any[] = await (yahooFinance as any).historical(sym, {
      period1: fourYearsAgo.toISOString().split('T')[0],
      period2: new Date().toISOString().split('T')[0],
      interval: '1d',
    }, { validateResult: false }) ?? [];

    // Map YYYY-MM-DD -> close price
    const priceMap = new Map<string, number>();
    for (const d of history) {
      const close = d.close ?? d.adjClose;
      if (close) priceMap.set(new Date(d.date).toISOString().slice(0, 10), close);
    }

    // Find the closest available price to a target date (search ±10 trading days)
    function priceNear(target: Date): number | null {
      for (let offset = 0; offset <= 10; offset++) {
        for (const sign of [0, -1, 1]) {
          const d = new Date(target);
          d.setDate(d.getDate() + sign * offset);
          const key = d.toISOString().slice(0, 10);
          if (priceMap.has(key)) return priceMap.get(key)!;
        }
      }
      return null;
    }

    const results: HistoricalValuationYear[] = [];

    for (const stmt of incomeStmts.slice(0, 3)) {
      const endDate = new Date(stmt.endDate);
      const year = endDate.getFullYear();
      const price = priceNear(endDate);

      const eps     = stmt.basicEps ?? stmt.dilutedEps ?? null;
      const revenue = stmt.totalRevenue ?? null;
      const bs      = bsMap.get(year);
      const equity  = bs?.totalStockholderEquity ?? null;

      // EV/EBITDA: approximate EBITDA from net income + D&A (if available)
      const ebitda = stmt.ebitda ?? null;
      const marketCap = price && sharesOutstanding ? price * sharesOutstanding : null;
      const totalDebt = bs ? ((bs.shortLongTermDebt ?? 0) + (bs.longTermDebt ?? 0)) : 0;
      const cash = bs?.cash ?? 0;
      const ev = marketCap ? marketCap + totalDebt - cash : null;

      results.push({
        year,
        pe:           (price && eps && eps > 0)
                        ? Math.round((price / eps) * 10) / 10
                        : null,
        priceToSales: (price && revenue && revenue > 0)
                        ? Math.round((price * sharesOutstanding) / revenue * 10) / 10
                        : null,
        priceToBook:  (price && equity && equity > 0)
                        ? Math.round((price * sharesOutstanding) / equity * 10) / 10
                        : null,
        evEbitda:     (ev && ebitda && ebitda > 0)
                        ? Math.round((ev / ebitda) * 10) / 10
                        : null,
      });
    }

    // Oldest year first
    results.sort((a, b) => a.year - b.year);

    cache.set(sym, { data: results, expires: Date.now() + TTL });
    return NextResponse.json({ data: results });
  } catch {
    cache.set(sym, { data: [], expires: Date.now() + 60_000 });
    return NextResponse.json({ data: [] });
  }
}
