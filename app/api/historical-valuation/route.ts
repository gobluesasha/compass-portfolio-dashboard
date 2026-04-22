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
    // incomeStatementHistory fields that actually exist in yahoo-finance2:
    //   totalRevenue, netIncome, netIncomeApplicableToCommonShares, ebit
    //   (basicEps / dilutedEps do NOT exist here — EPS must be derived)
    // cashflowStatementHistory has depreciationAndAmortization (needed for EBITDA)
    const summary = await yahooFinance.quoteSummary(sym, {
      modules: [
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'defaultKeyStatistics',
      ] as any,
    }, { validateResult: false });

    const incomeStmts: any[] =
      (summary as any)?.incomeStatementHistory?.incomeStatementHistory ?? [];
    const balanceSheets: any[] =
      (summary as any)?.balanceSheetHistory?.balanceSheetStatements ?? [];
    const cashflows: any[] =
      (summary as any)?.cashflowStatementHistory?.cashflowStatements ?? [];
    const ks = (summary as any)?.defaultKeyStatistics ?? {};
    const sharesOutstanding: number | null = ks.sharesOutstanding ?? null;

    if (!incomeStmts.length || !sharesOutstanding) {
      cache.set(sym, { data: [], expires: Date.now() + TTL });
      return NextResponse.json({ data: [] });
    }

    // Index balance sheets and cashflows by fiscal year
    const bsMap = new Map<number, any>();
    for (const bs of balanceSheets) {
      bsMap.set(new Date(bs.endDate).getFullYear(), bs);
    }
    const cfMap = new Map<number, any>();
    for (const cf of cashflows) {
      cfMap.set(new Date(cf.endDate).getFullYear(), cf);
    }

    // Fetch 4 years of daily prices to find fiscal year-end closes
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

    const history: any[] = await (yahooFinance as any).historical(sym, {
      period1: fourYearsAgo.toISOString().split('T')[0],
      period2: new Date().toISOString().split('T')[0],
      interval: '1d',
    }, { validateResult: false }) ?? [];

    const priceMap = new Map<string, number>();
    for (const d of history) {
      const close = d.close ?? d.adjClose;
      if (close) priceMap.set(new Date(d.date).toISOString().slice(0, 10), close);
    }

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
      const year    = endDate.getFullYear();
      const price   = priceNear(endDate);
      if (!price) continue;

      const bs = bsMap.get(year);
      const cf = cfMap.get(year);

      // P/E: EPS derived from net income / shares (basicEps not in this module)
      const netIncome = stmt.netIncomeApplicableToCommonShares ?? stmt.netIncome ?? null;
      const eps = netIncome !== null ? netIncome / sharesOutstanding : null;

      // P/S: price × shares / revenue
      const revenue = stmt.totalRevenue ?? null;

      // P/B: price × shares / stockholder equity
      const equity = bs?.totalStockholderEquity ?? null;

      // EV/EBITDA: EBITDA = EBIT + D&A (D&A from cashflow statement)
      const ebit = stmt.ebit ?? null;
      const da   = cf?.depreciationAndAmortization ?? null;
      const ebitda = (ebit !== null && da !== null) ? ebit + da : null;
      const totalDebt = bs ? ((bs.shortLongTermDebt ?? 0) + (bs.longTermDebt ?? 0)) : 0;
      const cash = bs?.cash ?? 0;
      const ev = price * sharesOutstanding + totalDebt - cash;

      const round1 = (v: number) => Math.round(v * 10) / 10;

      results.push({
        year,
        pe:           eps && eps > 0          ? round1(price / eps)                           : null,
        priceToSales: revenue && revenue > 0  ? round1((price * sharesOutstanding) / revenue) : null,
        priceToBook:  equity && equity > 0    ? round1((price * sharesOutstanding) / equity)  : null,
        evEbitda:     ebitda && ebitda > 0    ? round1(ev / ebitda)                           : null,
      });
    }

    results.sort((a, b) => a.year - b.year);

    cache.set(sym, { data: results, expires: Date.now() + TTL });
    return NextResponse.json({ data: results });
  } catch {
    cache.set(sym, { data: [], expires: Date.now() + 60_000 });
    return NextResponse.json({ data: [] });
  }
}
