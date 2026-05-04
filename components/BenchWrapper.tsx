'use client';

import { useState, useEffect } from 'react';
import { BENCH_COMPS } from '../lib/benchData';
import BenchTable, { BenchLiveData } from './BenchTable';

type QuoteItem = {
  symbol: string;
  price: number | null;
  changePct: number | null;
  pe: number | null;
  forwardPe: number | null;
};

type ReturnsItem = {
  symbol: string;
  return1MPct: number | null;
  returnYTDPct: number | null;
};

type FundamentalsItem = {
  symbol: string;
  forwardPe: number | null;
  beta: number | null;
  pe: number | null;
  evEbitda: number | null;
  priceToSales: number | null;
  marketCap: number | null;
  revenueGrowthPct: number | null;
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  returnOnEquity: number | null;
  consensusRating: number | null;
  targetPrice: number | null;
  numberOfAnalysts: number | null;
  businessSummary: string | null;
  industry: string | null;
  analystActions: { date: string; firm: string; action: string; toGrade: string; fromGrade: string }[] | null;
};

export default function BenchWrapper() {
  const [liveData, setLiveData] = useState<BenchLiveData[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const symbols = BENCH_COMPS.map(c => c.sym).join(',');

  // Merge quotes + returns + fundamentals into BenchLiveData
  function merge(
    quotes: QuoteItem[],
    returns: ReturnsItem[],
    fundamentals: FundamentalsItem[],
  ): BenchLiveData[] {
    const qMap = new Map(quotes.map(q => [q.symbol, q]));
    const rMap = new Map(returns.map(r => [r.symbol, r]));
    const fMap = new Map(fundamentals.map(f => [f.symbol, f]));

    return BENCH_COMPS.map(c => {
      const q = qMap.get(c.sym);
      const r = rMap.get(c.sym);
      const f = fMap.get(c.sym);
      return {
        symbol:             c.sym,
        price:              q?.price        ?? null,
        dayChangePct:       q?.changePct    ?? null,
        return1MPct:        r?.return1MPct  ?? null,
        returnYTDPct:       r?.returnYTDPct ?? null,
        forwardPe:          f?.forwardPe    ?? q?.forwardPe ?? null,
        beta:               f?.beta         ?? null,
        pe:                 f?.pe           ?? null,
        evEbitda:           f?.evEbitda     ?? null,
        priceToSales:       f?.priceToSales ?? null,
        marketCap:          f?.marketCap    ?? null,
        revenueGrowthPct:   f?.revenueGrowthPct   ?? null,
        grossMarginPct:     f?.grossMarginPct      ?? null,
        operatingMarginPct: f?.operatingMarginPct  ?? null,
        returnOnEquity:     f?.returnOnEquity      ?? null,
        consensusRating:    f?.consensusRating     ?? null,
        targetPrice:        f?.targetPrice         ?? null,
        numberOfAnalysts:   f?.numberOfAnalysts    ?? null,
        businessSummary:    f?.businessSummary     ?? null,
        industry:           f?.industry            ?? null,
        analystActions:     f?.analystActions      ?? null,
      };
    });
  }

  // Live quotes — poll every 60s
  useEffect(() => {
    let cancelled = false;
    let qCache: QuoteItem[] = [];
    let rCache: ReturnsItem[] = [];
    let fCache: FundamentalsItem[] = [];

    async function fetchQuotes() {
      try {
        const res = await fetch(`/api/quotes?symbols=${symbols}`);
        if (!res.ok) throw new Error('failed');
        const json = await res.json();
        if (cancelled) return;
        qCache = json.data;
        setLiveData(merge(qCache, rCache, fCache));
        setStatus('live');
        setLastUpdated(new Date());
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    async function fetchReturns() {
      try {
        const res = await fetch(`/api/returns?symbols=${symbols}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        rCache = json.data;
        setLiveData(merge(qCache, rCache, fCache));
      } catch { /* non-fatal */ }
    }

    async function fetchFundamentals() {
      try {
        const res = await fetch(`/api/fundamentals?symbols=${symbols}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        fCache = json.data;
        setLiveData(merge(qCache, rCache, fCache));
      } catch { /* non-fatal */ }
    }

    fetchQuotes();
    fetchReturns();
    fetchFundamentals();

    const id = setInterval(fetchQuotes, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbols]);

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center gap-3 justify-end flex-wrap">
        {status === 'loading' && (
          <span className="text-[10px] text-[#8a96a8] uppercase tracking-widest animate-pulse">
            Fetching live data…
          </span>
        )}
        {status === 'live' && lastUpdated && (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-[#8a96a8] font-mono uppercase tracking-widest">
              Live · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] text-red-400 uppercase tracking-widest">Data unavailable</span>
          </>
        )}
      </div>
      <BenchTable comps={BENCH_COMPS} liveData={liveData} />
    </div>
  );
}
