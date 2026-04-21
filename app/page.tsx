'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PORTFOLIO, PORTFOLIO_STATS } from '../lib/portfolioData';

const PortfolioAnalytics = dynamic(() => import('../components/PortfolioAnalytics'), { ssr: false });

type BenchmarkItem = {
  symbol: string; label: string; format: string;
  price: number | null; change: number | null; changePct: number | null; marketState: string;
};

type LiveQuote = {
  symbol: string; price: number | null; changePct: number | null; change: number | null;
  dividendYield: number | null; dividendRate: number | null;
};

// ── Correlation heatmap data (top 10 by weight) ──────────────
const TOP10 = ['APH','MSFT','GOOGL','MRK','WMT','TMO','JNJ','EXPD','V','DHR'];
const CORR: number[][] = [
  [1.00,0.52,0.44,0.28,0.18,0.31,0.24,0.35,0.38,0.27],
  [0.52,1.00,0.71,0.22,0.25,0.28,0.20,0.31,0.48,0.24],
  [0.44,0.71,1.00,0.19,0.21,0.24,0.18,0.28,0.45,0.22],
  [0.28,0.22,0.19,1.00,0.31,0.51,0.55,0.22,0.26,0.48],
  [0.18,0.25,0.21,0.31,1.00,0.29,0.32,0.25,0.35,0.28],
  [0.31,0.28,0.24,0.51,0.29,1.00,0.58,0.31,0.29,0.62],
  [0.24,0.20,0.18,0.55,0.32,0.58,1.00,0.24,0.27,0.54],
  [0.35,0.31,0.28,0.22,0.25,0.31,0.24,1.00,0.34,0.26],
  [0.38,0.48,0.45,0.26,0.35,0.29,0.27,0.34,1.00,0.31],
  [0.27,0.24,0.22,0.48,0.28,0.62,0.54,0.26,0.31,1.00],
];

function corrColor(r: number): string {
  const t = Math.max(-1, Math.min(1, r));
  const [pr, pg, pb] = t >= 0 ? [183, 28, 28] : [13, 71, 161];
  const a = Math.abs(t);
  return `rgb(${Math.round(255+(pr-255)*a)},${Math.round(255+(pg-255)*a)},${Math.round(255+(pb-255)*a)})`;
}

// ── Helpers ──────────────────────────────────────────────────
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

// ── Average pairwise correlation + sorted pairs ───────────────
const n = TOP10.length;
let corrSum = 0;
const ALL_PAIRS: { a: string; b: string; r: number }[] = [];
for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    corrSum += CORR[i][j];
    ALL_PAIRS.push({ a: TOP10[i], b: TOP10[j], r: CORR[i][j] });
  }
}
ALL_PAIRS.sort((x, y) => y.r - x.r);
const AVG_CORR      = corrSum / (n * (n - 1) / 2);
const HIGHEST_PAIRS = ALL_PAIRS.slice(0, 3);
const LOWEST_PAIRS  = ALL_PAIRS.slice(-3).reverse();

const PAIR_NOTES: Record<string, string> = {
  'MSFT·GOOGL': 'Mega-cap tech', 'GOOGL·MSFT': 'Mega-cap tech',
  'TMO·DHR':    'Life sciences peers', 'DHR·TMO': 'Life sciences peers',
  'JNJ·TMO':    'Healthcare overlap', 'TMO·JNJ': 'Healthcare overlap',
  'APH·WMT':    'Industrials vs. Consumer', 'WMT·APH': 'Industrials vs. Consumer',
  'GOOGL·JNJ':  'Tech vs. Healthcare', 'JNJ·GOOGL': 'Tech vs. Healthcare',
  'GOOGL·MRK':  'Tech vs. Pharma', 'MRK·GOOGL': 'Tech vs. Pharma',
};

export default function OverviewPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[] | null>(null);
  const [benchState, setBenchState] = useState<'loading' | 'success' | 'error'>('loading');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [liveQuotes, setLiveQuotes] = useState<LiveQuote[]>([]);

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
              <p className="text-[10px] uppercase tracking-widest text-[#8a96a8] font-semibold">Top 10 Conc.</p>
              <p className="text-2xl font-mono font-bold text-[#202e4a] mt-1">{(PORTFOLIO_STATS.top10Weight * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-[#8a96a8] mt-0.5">of portfolio weight</p>
            </div>
          </div>

          {/* Signal mix legend */}
          <div className="bg-white rounded-lg border border-[#e5e3dd] px-5 py-4 shadow-sm">
            <p className="text-[12px] font-semibold text-[#202e4a] mb-3">Signal Mix — Internal CCM Conviction Rating</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3">
              <div className="bg-emerald-500" style={{ width: `${(PORTFOLIO_STATS.greenCount / PORTFOLIO_STATS.totalPositions) * 100}%` }} />
              <div className="bg-amber-400" style={{ width: `${(PORTFOLIO_STATS.yellowCount / PORTFOLIO_STATS.totalPositions) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(PORTFOLIO_STATS.redCount / PORTFOLIO_STATS.totalPositions) * 100}%` }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { color: 'bg-emerald-500', label: `Conviction (${PORTFOLIO_STATS.greenCount} positions)`, desc: 'High-conviction holdings meeting all quality criteria. Thesis intact, fundamentals on track, no near-term risks.' },
                { color: 'bg-amber-400',   label: `Monitor (${PORTFOLIO_STATS.yellowCount} positions)`,   desc: 'Held positions with mixed or uncertain signals. Under active review — thesis evolving, one or more watch criteria triggered.' },
                { color: 'bg-red-500',     label: `Concern (${PORTFOLIO_STATS.redCount} positions)`,    desc: 'Positions where the core thesis has deteriorated. Sell criteria met or approaching — actively evaluating exit.' },
              ].map(s => (
                <div key={s.label} className="flex gap-3 items-start">
                  <div className={`w-3 h-3 rounded-full ${s.color} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-xs font-semibold text-[#202e4a]">{s.label}</p>
                    <p className="text-[11px] text-[#6a7a8e] leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </div>
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

        {/* Top Holdings Correlation — matrix left, summary right */}
        <section className="flex flex-col gap-3">
          <SectionDivider title="Top Holdings Correlation" />
          <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eeece7] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#8a96a8]">Top 10 Positions — Pairwise Correlation Matrix</span>
              <span className="text-[9px] text-[#a8a49e] font-mono italic">Integration point: requires 1-year daily return series from market data feed</span>
            </div>
            <div className="p-5 flex gap-8 items-start flex-wrap">

              {/* Column 1: Matrix */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-[#8a96a8] font-mono">−1</span>
                  <div className="flex h-2.5 rounded overflow-hidden" style={{ width: 100 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, background: corrColor(-1 + (i / 19) * 2) }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8a96a8] font-mono">+1</span>
                </div>
                <table style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 44 }} />
                      {TOP10.map(s => (
                        <th key={s} style={{ width: 46, textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#4a5e78', paddingBottom: 4, fontFamily: 'monospace' }}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP10.map((rowSym, i) => (
                      <tr key={rowSym}>
                        <td style={{ fontSize: 9, fontWeight: 700, color: '#4a5e78', paddingRight: 6, textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{rowSym}</td>
                        {TOP10.map((_, j) => {
                          const r = CORR[i][j];
                          const isDiag = i === j;
                          return (
                            <td key={j} style={{
                              width: 46, height: 30, textAlign: 'center',
                              background: corrColor(r), fontSize: 9, fontWeight: 600,
                              color: Math.abs(r) > 0.55 || isDiag ? '#fff' : '#202e4a',
                              border: '1px solid rgba(255,255,255,0.4)',
                            }}>
                              {isDiag ? '—' : r.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Column 2: Avg corr stat + Highest pairs */}
              <div className="flex flex-col gap-4 min-w-[180px]">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-1">Avg Pairwise Correlation</p>
                  <p className={`text-3xl font-mono font-bold ${AVG_CORR > 0.6 ? 'text-red-600' : 'text-[#202e4a]'}`}>
                    {AVG_CORR.toFixed(2)}
                  </p>
                  <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${AVG_CORR > 0.6 ? 'text-red-600' : 'text-emerald-600'}`}>
                    <span>{AVG_CORR > 0.6 ? '⚠' : '✓'}</span>
                    <span>{AVG_CORR > 0.6 ? 'High concentration risk' : 'Within diversification guidelines'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-2">Highest Correlated</p>
                  <div className="flex flex-col gap-1.5">
                    {HIGHEST_PAIRS.map(p => (
                      <div key={`${p.a}-${p.b}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: corrColor(p.r) }} />
                        <span className="font-mono text-[11px] font-bold text-[#202e4a] w-[72px] shrink-0">{p.a} · {p.b}</span>
                        <span className="font-mono text-[11px] text-red-600">{p.r.toFixed(2)}</span>
                        <span className="text-[10px] text-[#8a96a8]">{PAIR_NOTES[`${p.a}·${p.b}`] ?? ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Lowest pairs + integration note */}
              <div className="flex flex-col gap-4 min-w-[180px]">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-2">Lowest Correlated</p>
                  <div className="flex flex-col gap-1.5">
                    {LOWEST_PAIRS.map(p => (
                      <div key={`${p.a}-${p.b}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: corrColor(p.r) }} />
                        <span className="font-mono text-[11px] font-bold text-[#202e4a] w-[72px] shrink-0">{p.a} · {p.b}</span>
                        <span className="font-mono text-[11px] text-[#007cba]">{p.r.toFixed(2)}</span>
                        <span className="text-[10px] text-[#8a96a8]">{PAIR_NOTES[`${p.a}·${p.b}`] ?? ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded border border-dashed border-[#d4d1c9] bg-[#f8f7f3] px-3 py-2.5">
                  <p className="text-[10px] font-medium text-[#8a96a8] mb-1">Integration point</p>
                  <p className="text-[10px] text-[#a8a49e] leading-relaxed">
                    Live values require a 1-year daily return series per holding. Connect to returns API to auto-populate.
                  </p>
                </div>
                <p className="text-[9px] text-[#a8a49e] font-mono italic">Static placeholders — not real correlations</p>
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
