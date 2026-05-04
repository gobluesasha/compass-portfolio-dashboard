'use client';

import { useState, useEffect, useRef } from 'react';
import { Position } from '../types/portfolio';
import PortfolioTable from './PortfolioTable';

interface Props {
  initialPositions: Position[];
  focusSym?: string;
  initialSignalFilter?: string;
}

type LiveQuote = {
  symbol: string;
  price: number | null;
  changePct: number | null;
  change: number | null;
  pe: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  error?: boolean;
};

type EarningsItem = {
  symbol: string;
  result: 'beat' | 'miss' | 'inline' | null;
  date: string | null;
  nextEarningsDate: string | null;
};

type FundamentalsItem = {
  symbol: string;
  revenueGrowthPct: number | null;
  epsGrowthPct: number | null;
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;
  returnOnEquity: number | null;
  ebitdaMarginPct: number | null;
  fcfMarginPct: number | null;
  operatingCFMarginPct: number | null;
  returnOnAssets: number | null;
  pe: number | null;
  forwardPe: number | null;
  evEbitda: number | null;
  evRevenue: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  pegRatio: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  totalRevenue: number | null;
  ebitda: number | null;
  beta: number | null;
  debtToEquity: number | null;
  consensusRating: number | null;
  targetPrice: number | null;
  numberOfAnalysts: number | null;
  sector: string | null;
  industry: string | null;
  businessSummary: string | null;
  officers: { name: string; title: string }[] | null;
};

type SparkPoint = { date: string; close: number };

type ReturnsItem = {
  symbol: string;
  return1MPct: number | null;
  return3MPct: number | null;
  return6MPct: number | null;
  returnYTDPct: number | null;
  quarterlyReturnPct: number | null;
  maxDrawdownPct: number | null;
  sparkline: SparkPoint[] | null;
};

export type DataTimestamps = {
  quotes: Date | null;
  earnings: Date | null;
  fundamentals: Date | null;
  returns: Date | null;
};

function mergePositions(
  base: Position[],
  quotes: LiveQuote[],
  earnings: EarningsItem[],
  fundamentals: FundamentalsItem[],
  returns: ReturnsItem[],
): Position[] {
  const qMap = new Map(quotes.map(q => [q.symbol, q]));
  const eMap = new Map(earnings.map(e => [e.symbol, e]));
  const fMap = new Map(fundamentals.map(f => [f.symbol, f]));
  const rMap = new Map(returns.map(r => [r.symbol, r]));

  return base.map(p => {
    const q = qMap.get(p.sym);
    const e = eMap.get(p.sym);
    const f = fMap.get(p.sym);
    const r = rMap.get(p.sym);

    return {
      ...p,
      sector:   f?.sector   ?? p.sector,
      industry: f?.industry ?? p.industry,
      market: {
        ...p.market,
        price:        q?.price     ?? p.market.price,
        dayChangePct: q?.changePct ?? p.market.dayChangePct,
        quarterlyGrowth: r?.quarterlyReturnPct ?? p.market.quarterlyGrowth,
        sparkline:    r?.sparkline ?? p.market.sparkline,
      },
      earnings: {
        ...p.earnings,
        lastEarnings:     e?.result           ?? p.earnings.lastEarnings,
        lastEarningsDate: e?.date             ?? p.earnings.lastEarningsDate,
        nextEarningsDate: e?.nextEarningsDate ?? p.earnings.nextEarningsDate,
      },
      fundamentals: f ? {
        revenueGrowthPct:    f.revenueGrowthPct,
        epsGrowthPct:        f.epsGrowthPct,
        grossMarginPct:      f.grossMarginPct,
        operatingMarginPct:  f.operatingMarginPct  ?? null,
        netMarginPct:        f.netMarginPct        ?? null,
        returnOnEquity:      f.returnOnEquity,
        ebitdaMarginPct:     f.ebitdaMarginPct     ?? null,
        fcfMarginPct:        f.fcfMarginPct        ?? null,
        operatingCFMarginPct: f.operatingCFMarginPct ?? null,
        returnOnAssets:      f.returnOnAssets      ?? null,
      } : p.fundamentals,
      valuation: {
        pe:              f?.pe              ?? p.valuation.pe,
        forwardPe:       f?.forwardPe       ?? p.valuation.forwardPe,
        evEbitda:        f?.evEbitda        ?? p.valuation.evEbitda,
        evRevenue:       f?.evRevenue       ?? p.valuation.evRevenue,
        priceToSales:    f?.priceToSales    ?? p.valuation.priceToSales,
        priceToBook:     f?.priceToBook     ?? p.valuation.priceToBook,
        dividendYield:   f?.dividendYield   ?? q?.dividendYield ?? p.valuation.dividendYield,
        dividendRate:    f?.dividendRate    ?? q?.dividendRate  ?? p.valuation.dividendRate,
        peg:             f?.pegRatio        ?? p.valuation.peg,
        marketCap:       f?.marketCap       ?? p.valuation.marketCap,
        enterpriseValue: f?.enterpriseValue ?? p.valuation.enterpriseValue,
        totalRevenue:    f?.totalRevenue    ?? p.valuation.totalRevenue,
        ebitda:          f?.ebitda          ?? p.valuation.ebitda,
      },
      risk: {
        beta:           f?.beta          ?? p.risk.beta,
        debtToEquity:   f?.debtToEquity  ?? p.risk.debtToEquity,
        volatilityPct:  p.risk.volatilityPct,
        maxDrawdownPct: r?.maxDrawdownPct ?? p.risk.maxDrawdownPct,
        return1MPct:    r?.return1MPct   ?? p.risk.return1MPct,
        return3MPct:    r?.return3MPct   ?? p.risk.return3MPct,
        return6MPct:    r?.return6MPct   ?? p.risk.return6MPct,
        returnYTDPct:   r?.returnYTDPct  ?? p.risk.returnYTDPct,
      },
      analyst: f ? {
        consensusRating:  f.consensusRating,
        targetPrice:      f.targetPrice,
        numberOfAnalysts: f.numberOfAnalysts,
      } : p.analyst,
      qualitative: f ? {
        ...p.qualitative,
        businessSummary: f.businessSummary,
        leadership: f.officers ?? p.qualitative.leadership,
      } : p.qualitative,
    };
  });
}

export default function PortfolioWrapper({ initialPositions, focusSym, initialSignalFilter }: Props) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [liveStatus, setLiveStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [timestamps, setTimestamps] = useState<DataTimestamps>({
    quotes: null, earnings: null, fundamentals: null, returns: null,
  });

  const earningsRef    = useRef<EarningsItem[]>([]);
  const fundamentalsRef = useRef<FundamentalsItem[]>([]);
  const returnsRef     = useRef<ReturnsItem[]>([]);

  const symbols = initialPositions.map(p => p.sym).join(',');

  // Fetch live quotes — poll every 60s
  useEffect(() => {
    let cancelled = false;
    async function fetchQuotes() {
      try {
        const res = await fetch(`/api/quotes?symbols=${symbols}`);
        if (!res.ok) throw new Error('Quote fetch failed');
        const json = await res.json();
        if (cancelled) return;
        setPositions(prev => mergePositions(prev, json.data, earningsRef.current, fundamentalsRef.current, returnsRef.current));
        setLiveStatus('live');
        setTimestamps(prev => ({ ...prev, quotes: new Date() }));
      } catch {
        if (!cancelled) setLiveStatus('error');
      }
    }
    fetchQuotes();
    const id = setInterval(fetchQuotes, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbols]);

  // Fetch earnings once (4h server cache)
  useEffect(() => {
    let cancelled = false;
    async function fetchEarnings() {
      try {
        const res = await fetch(`/api/earnings?symbols=${symbols}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        earningsRef.current = json.data;
        setPositions(prev => mergePositions(prev, [], json.data, fundamentalsRef.current, returnsRef.current));
        setTimestamps(prev => ({ ...prev, earnings: new Date() }));
      } catch { /* non-fatal */ }
    }
    fetchEarnings();
    return () => { cancelled = true; };
  }, [symbols]);

  // Fetch fundamentals once (24h server cache)
  useEffect(() => {
    let cancelled = false;
    async function fetchFundamentals() {
      try {
        const res = await fetch(`/api/fundamentals?symbols=${symbols}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        fundamentalsRef.current = json.data;
        setPositions(prev => mergePositions(prev, [], earningsRef.current, json.data, returnsRef.current));
        setTimestamps(prev => ({ ...prev, fundamentals: new Date() }));
      } catch { /* non-fatal */ }
    }
    fetchFundamentals();
    return () => { cancelled = true; };
  }, [symbols]);

  // Fetch historical returns once (4h server cache)
  useEffect(() => {
    let cancelled = false;
    async function fetchReturns() {
      try {
        const res = await fetch(`/api/returns?symbols=${symbols}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        returnsRef.current = json.data;
        setPositions(prev => mergePositions(prev, [], earningsRef.current, fundamentalsRef.current, json.data));
        setTimestamps(prev => ({ ...prev, returns: new Date() }));
      } catch { /* non-fatal */ }
    }
    fetchReturns();
    return () => { cancelled = true; };
  }, [symbols]);

  return (
    <div className="flex flex-col gap-3">
      {/* Live status bar */}
      <div className="flex items-center gap-3 justify-end flex-wrap">
        {liveStatus === 'loading' && (
          <span className="text-[10px] text-[#8a96a8] uppercase tracking-widest animate-pulse">
            Fetching live data…
          </span>
        )}
        {liveStatus === 'live' && timestamps.quotes && (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-[#8a96a8] font-mono uppercase tracking-widest">
              Live · quotes {timestamps.quotes.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        )}
        {timestamps.returns && (
          <span className="text-[10px] text-[#8a96a8] font-mono">
            · returns {timestamps.returns.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {timestamps.fundamentals && (
          <span className="text-[10px] text-[#8a96a8] font-mono">
            · fundamentals {timestamps.fundamentals.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {liveStatus === 'error' && (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] text-red-400 uppercase tracking-widest">
              Data unavailable · showing static
            </span>
          </>
        )}
      </div>
      <PortfolioTable positions={positions} focusSym={focusSym} timestamps={timestamps} initialSignalFilter={initialSignalFilter as any} />
    </div>
  );
}
