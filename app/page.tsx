'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PORTFOLIO, PORTFOLIO_STATS } from '../lib/portfolioData';

const PortfolioAnalytics = dynamic(() => import('../components/PortfolioAnalytics'), { ssr: false });

const CORE_THRESHOLD = 0.027;

type BenchmarkItem = {
  symbol: string; label: string; format: string;
  price: number | null; change: number | null; changePct: number | null; marketState: string;
};

type LiveQuote = {
  symbol: string; price: number | null; changePct: number | null; change: number | null;
  dividendYield: number | null; dividendRate: number | null;
};

type ReturnsItem = {
  symbol: string; returnYTDPct: number | null; return1MPct: number | null;
};

function fmt(value: number | null, format: string): string {
  if (value === null) return '—';
  if (format === 'rate')    return `${value.toFixed(2)}%`;
  if (format === 'decimal') return value.toFixed(2);
  if (value >= 10_000)      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `$${value.toFixed(2)}`;
}

function isMarketOpen(state: string) { return state === 'REGULAR'; }

function BenchmarkCard({ item, loaded }: { item: BenchmarkItem; loaded: boolean }) {
  const up = (item.changePct ?? 0) >= 0;
  const isVix = item.symbol === '^VIX';
  const positive = isVix ? !up : up;
  return (
    <div className="flex-1 min-w-[130px] bg-white rounded-lg border border-[#e5e3dd] px-4 py-3.5 shadow-sm flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8a96a8]">{item.label}</span>
      <span className="text-lg font-mono font-bold text-[#202e4a] leading-none">
        {item.price !== null ? fmt(item.price, item.format) : <span className="text-[#c8cdd6]">—</span>}
      </span>
      <div className="flex items-center gap-1.5">
        {item.changePct !== null ? (
          <>
            <span className={`text-xs font-mono font-semibold ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
            </span>
            {item.change !== null && (
              <span className={`text-[10px] font-mono ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                ({item.change >= 0 ? '+' : ''}{item.format === 'rate' ? item.change.toFixed(3) : item.change.toFixed(2)})
              </span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-[#c8cdd6]">{loaded ? '—' : 'Loading…'}</span>
        )}
      </div>
    </div>
  );
}

function MoverRow({ sym, name, changePct }: { sym: string; name: string; changePct: number }) {
  const up = changePct >= 0;
  return (
    <Link href={`/portfolio?sym=${sym}`} className="flex items-center gap-3 py-1.5 hover:bg-[#f2f1ec] -mx-4 px-4 rounded transition-colors group">
      <span className="font-mono text-xs font-bold text-[#007cba] w-12 shrink-0 group-hover:underline">{sym}</span>
      <span className="text-xs text-[#4a5e78] truncate flex-1">{name}</span>
      <span className={`font-mono text-xs font-semibold shrink-0 ${up ? 'text-emerald-600' : 'text-red-600'}`}>
        {up ? '+' : ''}{changePct.toFixed(2)}%
      </span>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-1 min-w-[130px] bg-white rounded-lg border border-[#e5e3dd] px-4 py-3.5 shadow-sm flex flex-col gap-2 animate-pulse">
      <div className="h-2 w-16 rounded bg-[#e5e3dd]" />
      <div className="h-5 w-20 rounded bg-[#e5e3dd]" />
      <div className="h-2 w-12 rounded bg-[#e5e3dd]" />
    </div>
  );
}

function SectionDivider({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold text-[#8a96a8] tracking-wide whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-[#d4d1c9]" />
      {right}
    </div>
  );
}

export default function OverviewPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[] | null>(null);
  const [benchState, setBenchState] = useState<'loading' | 'success' | 'error'>('loading');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [liveQuotes, setLiveQuotes] = useState<LiveQuote[]>([]);
  const [coreReturns, setCoreReturns] = useState<ReturnsItem[]>([]);
  const [core25Sort, setCore25Sort] = useState<{ key: 'day' | '1m' | 'ytd' | null; asc: boolean }>({ key: null, asc: false });

  function handleCore25Sort(key: 'day' | '1m' | 'ytd') {
    setCore25Sort(prev => prev.key === key ? { key, asc: !prev.asc } : { key, asc: false });
  }

  const loadBenchmarks = useCallback(async () => {
    setBenchState('loading');
    try {
      const res = await fetch('/api/benchmarks');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBenchmarks(json.data);
      setLastFetched(new Date());
      setBenchState('success');
    } catch {
      setBenchState('error');
    }
  }, []);

  useEffect(() => {
    loadBenchmarks();
    const id = setInterval(loadBenchmarks, 60_000);
    return () => clearInterval(id);
  }, [loadBenchmarks]);

  useEffect(() => {
    let cancelled = false;
    const symbols = PORTFOLIO.map(p => p.sym).join(',');
    async function load() {
      try {
        const res = await fetch(`/api/quotes?symbols=${symbols}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setLiveQuotes(json.data);
      } catch { /* non-fatal */ }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Fetch returns for core 25 once (4h cache)
  useEffect(() => {
    let cancelled = false;
    const coreSyms = PORTFOLIO.filter(p => p.weight >= CORE_THRESHOLD).map(p => p.sym).join(',');
    async function load() {
      try {
        const res = await fetch(`/api/returns?symbols=${coreSyms}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setCoreReturns(json.data);
      } catch { /* non-fatal */ }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Core 25 sorted rows
  const core25Items = PORTFOLIO.filter(p => p.weight >= CORE_THRESHOLD).map(p => {
    const q = liveQuotes.find(l => l.symbol === p.sym);
    const r = coreReturns.find(l => l.symbol === p.sym);
    return { pos: p, q, r };
  });
  const sortedCore25 = [...core25Items].sort((a, b) => {
    if (!core25Sort.key) return 0;
    let av: number | null | undefined;
    let bv: number | null | undefined;
    if (core25Sort.key === 'day')  { av = a.q?.changePct;   bv = b.q?.changePct; }
    if (core25Sort.key === '1m')   { av = a.r?.return1MPct;  bv = b.r?.return1MPct; }
    if (core25Sort.key === 'ytd')  { av = a.r?.returnYTDPct; bv = b.r?.returnYTDPct; }
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return core25Sort.asc ? av - bv : bv - av;
  });

  // Movers
  const moversData = PORTFOLIO
    .map(p => {
      const q = liveQuotes.find(l => l.symbol === p.sym);
      return { sym: p.sym, name: p.issuerName, changePct: q?.changePct ?? null };
    })
    .filter(m => m.changePct !== null) as { sym: string; name: string; changePct: number }[];
  const gainers = [...moversData].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers  = [...moversData].sort((a, b) => a.changePct - b.changePct).slice(0, 5);

  // 13-F deadline
  const deadline13F = new Date('2026-05-15');
  const today = new Date();
  const daysUntil13F = Math.ceil((deadline13F.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const marketState = benchmarks?.[0]?.marketState ?? 'UNKNOWN';
  const marketOpen  = isMarketOpen(marketState);
  const totalAUM    = (PORTFOLIO_STATS.totalValueK / 1000).toFixed(1);
  const benchLoaded = benchState === 'success';

  return (
    <main className="min-h-screen bg-[#f2f1ec] text-[#202e4a]">
      <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-8">

        {/* Market status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-[#c8cdd6]'}`} />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#8a96a8]">
              {marketOpen ? 'Market Open' : marketState === 'PRE' ? 'Pre-Market' : marketState === 'POST' ? 'After Hours' : 'Market Closed'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {benchState === 'loading' && !lastFetched && (
              <span className="text-[10px] text-[#8a96a8] animate-pulse">Loading market data…</span>
            )}
            {benchState === 'error' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-400">⚠ Live data unavailable</span>
                <button
                  onClick={loadBenchmarks}
                  className="text-[10px] text-[#007cba] hover:underline font-semibold"
                >Retry</button>
              </div>
            )}
            {lastFetched && benchState !== 'error' && (
              <span className="text-[10px] text-[#8a96a8] font-mono">
                {benchState === 'loading' ? '↻ ' : '✓ '}Fetched {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Benchmarks */}
        <section className="flex flex-col gap-3">
          <SectionDivider title="Market Overview" />
          <div className="flex flex-wrap gap-3">
            {benchmarks === null
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : benchmarks.map(b => <BenchmarkCard key={b.symbol} item={b} loaded={benchLoaded} />)
            }
          </div>
        </section>

        {/* Portfolio snapshot + signal legend */}
        <section className="flex flex-col gap-3">
          <SectionDivider title="Portfolio Snapshot · Q4 2025 13-F" right={
            <Link href="/portfolio" className="text-[10px] text-[#007cba] hover:text-[#005a87] uppercase tracking-widest transition-colors">
              Full Portfolio →
            </Link>
          } />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-[#e5e3dd] px-5 py-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#8a96a8] font-semibold">Total AUM</p>
              <p className="text-2xl font-mono font-bold text-[#007cba] mt-1">${totalAUM}M</p>
              <p className="text-[10px] text-[#8a96a8] mt-0.5">13-F reported value</p>
            </div>
            <div className="bg-white rounded-lg border border-[#e5e3dd] px-5 py-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#8a96a8] font-semibold">Positions</p>
              <p className="text-2xl font-mono font-bold text-[#202e4a] mt-1">{PORTFOLIO_STATS.totalPositions}</p>
              <p className="text-[10px] text-[#8a96a8] mt-0.5">25 core · {PORTFOLIO_STATS.totalPositions - 25} satellite</p>
            </div>
            <div className="bg-white rounded-lg border border-[#e5e3dd] px-5 py-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-[#8a96a8] font-semibold">Top 10 Concentration</p>
              <p className="text-2xl font-mono font-bold text-[#202e4a] mt-1">{(PORTFOLIO_STATS.top10Weight * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-[#8a96a8] mt-0.5">% of AUM in the 10 largest positions</p>
            </div>
          </div>

          {/* Signal mix legend */}
          <div className="bg-white rounded-lg border border-[#e5e3dd] px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[12px] font-semibold text-[#202e4a]">Signal Mix — Internal CCM Conviction Rating</p>
              <div className="relative group/tooltip">
                <button className="w-4 h-4 rounded-full bg-[#e5e3dd] text-[#8a96a8] text-[9px] font-bold flex items-center justify-center hover:bg-[#007cba] hover:text-white transition-colors shrink-0">?</button>
                <div className="absolute left-0 top-full mt-1.5 z-50 w-[340px] bg-[#1a2537] text-white rounded-xl shadow-2xl border border-white/10 p-4 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-150">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">How Signals Are Determined</p>
                  <p className="text-[10px] text-white/60 leading-relaxed mb-3">Ratings are assigned by CCM portfolio managers based on a multi-factor qualitative and quantitative review, updated quarterly or upon material events.</p>
                  <div className="flex flex-col gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-400">Conviction (Green)</span>
                      </div>
                      <p className="text-[10px] text-white/65 leading-relaxed">Thesis fully intact. Earnings meeting or beating estimates, revenue growth on or above plan, margins stable or expanding. Analyst consensus Buy or Strong Buy. No material headwinds. Position maintained or increased in last 13-F.</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[11px] font-bold text-amber-400">Monitor (Yellow)</span>
                      </div>
                      <p className="text-[10px] text-white/65 leading-relaxed">Mixed or evolving signals. One or more criteria triggered: recent earnings miss, decelerating growth, margin pressure, position trimmed, near-term sector or macro headwinds. Thesis under active review.</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[11px] font-bold text-red-400">Concern (Red)</span>
                      </div>
                      <p className="text-[10px] text-white/65 leading-relaxed">Core thesis deteriorating. Consecutive earnings misses, significant revenue shortfall, sustained margin compression, analyst consensus downgrade to Hold or Sell, or material competitive or regulatory risk. Exit being actively evaluated.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3">
              <Link href="/portfolio?signal=green" className="bg-emerald-500 hover:brightness-110 transition-all cursor-pointer" style={{ width: `${(PORTFOLIO_STATS.greenCount / PORTFOLIO_STATS.totalPositions) * 100}%` }} title={`View ${PORTFOLIO_STATS.greenCount} Conviction positions`} />
              <Link href="/portfolio?signal=yellow" className="bg-amber-400 hover:brightness-110 transition-all cursor-pointer" style={{ width: `${(PORTFOLIO_STATS.yellowCount / PORTFOLIO_STATS.totalPositions) * 100}%` }} title={`View ${PORTFOLIO_STATS.yellowCount} Monitor positions`} />
              <Link href="/portfolio?signal=red" className="bg-red-500 hover:brightness-110 transition-all cursor-pointer" style={{ width: `${(PORTFOLIO_STATS.redCount / PORTFOLIO_STATS.totalPositions) * 100}%` }} title={`View ${PORTFOLIO_STATS.redCount} Concern positions`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { color: 'bg-emerald-500', signal: 'green',  label: `Conviction (${PORTFOLIO_STATS.greenCount} positions)`,  desc: 'High-conviction holdings meeting all quality criteria. Thesis intact, fundamentals on track, no near-term risks.' },
                { color: 'bg-amber-400',   signal: 'yellow', label: `Monitor (${PORTFOLIO_STATS.yellowCount} positions)`,    desc: 'Held positions with mixed or uncertain signals. Under active review — thesis evolving, one or more watch criteria triggered.' },
                { color: 'bg-red-500',     signal: 'red',    label: `Concern (${PORTFOLIO_STATS.redCount} positions)`,      desc: 'Positions where the core thesis has deteriorated. Sell criteria met or approaching — actively evaluating exit.' },
              ].map(s => (
                <Link key={s.signal} href={`/portfolio?signal=${s.signal}`} className="flex gap-3 items-start group hover:bg-[#f8f7f3] -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <div className={`w-3 h-3 rounded-full ${s.color} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-xs font-semibold text-[#202e4a] group-hover:text-[#007cba] transition-colors">{s.label}</p>
                    <p className="text-[11px] text-[#6a7a8e] leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Today's movers */}
        {moversData.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionDivider title="Today's Portfolio Movers" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Top Gainers", items: gainers, headerClass: "bg-emerald-50 border-emerald-100", textClass: "text-emerald-700" },
                { label: "Top Losers",  items: losers,  headerClass: "bg-red-50 border-red-100",       textClass: "text-red-700" },
              ].map(({ label, items, headerClass, textClass }) => (
                <div key={label} className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
                  <div className={`px-4 py-2.5 border-b ${headerClass}`}>
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${textClass}`}>{label}</span>
                  </div>
                  <div className="px-4 py-1 divide-y divide-[#f5f4f0]">
                    {items.map(m => <MoverRow key={m.sym} sym={m.sym} name={m.name} changePct={m.changePct} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core 25 Performance */}
        <section className="flex flex-col gap-3">
          <SectionDivider title="Core 25 Performance" right={
            <Link href="/portfolio" className="text-[10px] text-[#007cba] hover:text-[#005a87] uppercase tracking-widest transition-colors">
              Full Table →
            </Link>
          } />
          <div className="bg-white rounded-lg border border-[#d4d1c9] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#202e4a] border-b border-[#182438]">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-white/55 tracking-wide w-[80px]">Ticker</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-white/55 tracking-wide min-w-[160px]">Company</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-white/55 tracking-wide">Price</th>
                    {(['day', '1m', 'ytd'] as const).map(k => (
                      <th key={k} onClick={() => handleCore25Sort(k)} className="px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide cursor-pointer select-none hover:text-white text-white/55 whitespace-nowrap">
                        {k === 'day' ? 'Day %' : k === '1m' ? '1M Rtn' : 'YTD'}
                        {core25Sort.key === k ? (core25Sort.asc ? ' ↑' : ' ↓') : ' ↕'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCore25.map(({ pos, q, r }, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={pos.sym} className={`border-b transition-colors ${isEven ? 'bg-white border-b-[#eeece7] hover:bg-[#eef6fb]' : 'bg-[#faf9f6] border-b-[#eeece7] hover:bg-[#eef6fb]'}`}>
                        <td className="px-3 py-2">
                          <Link href={`/portfolio?sym=${pos.sym}`} className="font-mono text-xs font-bold text-[#007cba] hover:underline tracking-wide">
                            {pos.sym}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-[#4a5e78] truncate max-w-[200px] block">
                            {pos.issuerName.length > 28 ? pos.issuerName.slice(0, 27) + '…' : pos.issuerName}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {q?.price != null
                            ? <span className="font-mono text-xs text-[#202e4a]">${q.price.toFixed(2)}</span>
                            : <span className="text-[#c8cdd6] font-mono text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {q?.changePct != null ? (
                            <span className={`font-mono text-xs font-semibold ${q.changePct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {q.changePct >= 0 ? '+' : ''}{q.changePct.toFixed(2)}%
                            </span>
                          ) : <span className="text-[#c8cdd6] font-mono text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r?.return1MPct != null ? (
                            <span className={`font-mono text-xs font-semibold ${r.return1MPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {r.return1MPct >= 0 ? '+' : ''}{(r.return1MPct * 100).toFixed(1)}%
                            </span>
                          ) : <span className="text-[#c8cdd6] font-mono text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r?.returnYTDPct != null ? (
                            <span className={`font-mono text-xs font-semibold ${r.returnYTDPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {r.returnYTDPct >= 0 ? '+' : ''}{(r.returnYTDPct * 100).toFixed(1)}%
                            </span>
                          ) : <span className="text-[#c8cdd6] font-mono text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-[#d4d1c9] bg-[#f8f7f3]">
              <span className="text-[11px] text-[#8a96a8]">25 core positions · weight ≥ 2.7% · click ticker to expand in portfolio</span>
            </div>
          </div>
        </section>

        {/* Portfolio Analytics + 13-F sidebar */}
        <section className="flex flex-col gap-3">
          <SectionDivider title="Portfolio Analytics" right={
            <span className="text-[10px] text-[#8a96a8] font-mono">Based on Q4 2025 13-F weights</span>
          } />
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <PortfolioAnalytics />
            </div>
            {/* 13-F Filing — sidebar */}
            <div className="w-56 shrink-0 bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#eeece7]">
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#8a96a8]">SEC 13-F Filing</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-0.5">Filing Period</p>
                  <p className="text-xs font-semibold text-[#202e4a]">Q1 2026 (Jan – Mar)</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-0.5">Deadline</p>
                  <p className="text-xs font-semibold text-[#202e4a]">May 15, 2026</p>
                </div>
                <div className={`rounded-lg px-3 py-2.5 ${
                  daysUntil13F <= 14 ? 'bg-red-50 border border-red-200'
                  : daysUntil13F <= 30 ? 'bg-amber-50 border border-amber-200'
                  : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <p className={`text-[9px] uppercase tracking-widest font-semibold mb-0.5 ${
                    daysUntil13F <= 14 ? 'text-red-600' : daysUntil13F <= 30 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>Days Remaining</p>
                  <p className={`text-3xl font-mono font-bold ${
                    daysUntil13F <= 14 ? 'text-red-600' : daysUntil13F <= 30 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{daysUntil13F}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-0.5">Last Filed</p>
                  <p className="text-xs text-[#4a5e78]">Q4 2025 · Feb 14, 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-6 flex items-center justify-between">
          <span className="text-[10px] text-[#a8a49e] uppercase tracking-widest">
            © 2025 Compass Capital Management Inc.
          </span>
          <span className="text-[10px] text-[#a8a49e] font-mono">
            Prices via Yahoo Finance · Q4 2025 13-F
          </span>
        </footer>
      </div>
    </main>
  );
}
