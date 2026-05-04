'use client';

import React, { useState, useCallback } from 'react';
import { BenchComp, CORE_NAMES } from '../lib/benchData';

type SortKey = 'sym' | 'compFor' | 'sector' | 'price' | 'dayPct' | 'return1M' | 'returnYTD' | 'forwardPe' | 'beta';

export type BenchLiveData = {
  symbol: string;
  price: number | null;
  dayChangePct: number | null;
  return1MPct: number | null;
  returnYTDPct: number | null;
  forwardPe: number | null;
  beta: number | null;
  // Valuation
  pe: number | null;
  evEbitda: number | null;
  priceToSales: number | null;
  marketCap: number | null;
  // Fundamentals
  revenueGrowthPct: number | null;
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  returnOnEquity: number | null;
  // Analyst
  consensusRating: number | null;
  targetPrice: number | null;
  numberOfAnalysts: number | null;
  // Qualitative
  businessSummary: string | null;
  industry: string | null;
  // Recent analyst actions
  analystActions: { date: string; firm: string; action: string; toGrade: string; fromGrade: string }[] | null;
};

interface Props {
  comps: BenchComp[];
  liveData: BenchLiveData[];
}

function Placeholder() {
  return <span className="text-[#c8cdd6] font-mono text-xs">—</span>;
}

function ValMetric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold">{label}</p>
      {value !== null
        ? <p className="font-mono text-xs font-semibold text-[#202e4a]">{value}</p>
        : <span className="text-[#c8cdd6] font-mono text-xs">—</span>}
    </div>
  );
}

function PctMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold">{label}</p>
      {value !== null
        ? <span className={`font-mono text-xs font-semibold ${value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {value >= 0 ? '+' : ''}{(value * 100).toFixed(1)}%
          </span>
        : <span className="text-[#c8cdd6] font-mono text-xs">—</span>}
    </div>
  );
}

function fmtB(n: number | null | undefined): string | null {
  if (n == null) return null;
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function ratingLabel(r: number | null): string {
  if (r === null) return '—';
  if (r <= 1.5) return 'Strong Buy';
  if (r <= 2.5) return 'Buy';
  if (r <= 3.5) return 'Hold';
  if (r <= 4.5) return 'Underperform';
  return 'Sell';
}

function ratingColor(r: number | null): string {
  if (r === null) return 'text-[#c8cdd6]';
  if (r <= 2.0) return 'text-emerald-600';
  if (r <= 3.0) return 'text-sky-600';
  if (r <= 3.5) return 'text-amber-600';
  return 'text-red-600';
}

function PctCell({ value, decimals = 1 }: { value: number | null; decimals?: number }) {
  if (value === null) return <Placeholder />;
  const pos = value >= 0;
  return (
    <span className={`font-mono text-xs font-semibold ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
      {pos ? '+' : ''}{(value * 100).toFixed(decimals)}%
    </span>
  );
}

function DayPctCell({ value }: { value: number | null }) {
  if (value === null) return <Placeholder />;
  const pos = value >= 0;
  return (
    <span className={`font-mono text-xs font-semibold ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
      {pos ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
      {asc ? '↑' : '↓'}
    </span>
  );
}

function TH({
  children, sortKey, activeSortKey, asc, onClick, className = '',
}: {
  children: React.ReactNode;
  sortKey?: SortKey;
  activeSortKey: SortKey;
  asc: boolean;
  onClick?: (k: SortKey) => void;
  className?: string;
}) {
  const isActive = sortKey === activeSortKey;
  return (
    <th
      onClick={() => sortKey && onClick?.(sortKey)}
      className={`group px-3 py-2.5 text-left text-[11px] font-semibold select-none whitespace-nowrap transition-colors tracking-wide ${sortKey ? 'cursor-pointer' : ''} ${isActive ? 'text-white' : 'text-white/55 hover:text-white/85'} ${className}`}
    >
      {children}
      {sortKey && <SortIcon active={isActive} asc={asc} />}
    </th>
  );
}

const ACTION_META: Record<string, { icon: string; label: string; color: string }> = {
  up:   { icon: '↑', label: 'Upgrade',    color: 'text-emerald-600' },
  down: { icon: '↓', label: 'Downgrade',  color: 'text-red-600'     },
  init: { icon: '★', label: 'Initiated',  color: 'text-sky-600'     },
  main: { icon: '→', label: 'Maintained', color: 'text-[#8a96a8]'   },
  reit: { icon: '→', label: 'Reiterated', color: 'text-[#8a96a8]'   },
};

// ------- BenchExpandedRow -------
function BenchExpandedRow({ comp, live, isOpen }: {
  comp: BenchComp;
  live: BenchLiveData | null;
  isOpen: boolean;
}) {
  const [showFullSummary, setShowFullSummary] = React.useState(false);

  if (!isOpen) return null;

  const upside = live?.targetPrice != null && live?.price != null
    ? (live.targetPrice - live.price) / live.price
    : null;

  return (
    <div className="bg-[#f0f6fb] border-b border-[#c8dfee] px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Performance */}
        <div className="bg-white rounded-lg border border-[#e5e3dd] px-4 py-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8a96a8] mb-3">Performance</p>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            <ValMetric label="Price" value={live?.price != null ? `$${live.price.toFixed(2)}` : null} />
            <ValMetric label="Beta"  value={live?.beta  != null ? live.beta.toFixed(2)        : null} />
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold">Day %</p>
              <DayPctCell value={live?.dayChangePct ?? null} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold">1M Rtn</p>
              <PctCell value={live?.return1MPct ?? null} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold">YTD</p>
              <PctCell value={live?.returnYTDPct ?? null} />
            </div>
          </div>
        </div>

        {/* Valuation */}
        <div className="bg-white rounded-lg border border-[#e5e3dd] px-4 py-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8a96a8] mb-3">Valuation</p>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            <ValMetric label="Fwd P/E"   value={live?.forwardPe    != null ? `${live.forwardPe.toFixed(1)}x`    : null} />
            <ValMetric label="P/E (TTM)" value={live?.pe           != null ? `${live.pe.toFixed(1)}x`           : null} />
            <ValMetric label="EV/EBITDA" value={live?.evEbitda     != null ? `${live.evEbitda.toFixed(1)}x`     : null} />
            <ValMetric label="P/Sales"   value={live?.priceToSales != null ? `${live.priceToSales.toFixed(1)}x` : null} />
            <ValMetric label="Mkt Cap"   value={fmtB(live?.marketCap)} />
          </div>
        </div>

        {/* Fundamentals */}
        <div className="bg-white rounded-lg border border-[#e5e3dd] px-4 py-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8a96a8] mb-3">Fundamentals</p>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            <PctMetric label="Rev Growth" value={live?.revenueGrowthPct   ?? null} />
            <PctMetric label="Gross Mgn"  value={live?.grossMarginPct     ?? null} />
            <PctMetric label="Op. Margin" value={live?.operatingMarginPct ?? null} />
            <PctMetric label="ROE"        value={live?.returnOnEquity     ?? null} />
          </div>
        </div>

        {/* Analyst */}
        <div className="bg-white rounded-lg border border-[#e5e3dd] px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#8a96a8]">Analyst Consensus</p>
            <a
              href={`https://finance.yahoo.com/quote/${comp.sym}/analysis`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-[#007cba] hover:underline font-semibold flex items-center gap-0.5 shrink-0"
            >
              Yahoo Finance ↗
            </a>
          </div>
          <div className="flex flex-col gap-2.5">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-0.5">Consensus</p>
              <p className={`text-sm font-bold ${ratingColor(live?.consensusRating ?? null)}`}>
                {ratingLabel(live?.consensusRating ?? null)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-3">
              <ValMetric label="Target $" value={live?.targetPrice      != null ? `$${live.targetPrice.toFixed(2)}`  : null} />
              <ValMetric label="Analysts" value={live?.numberOfAnalysts != null ? String(live.numberOfAnalysts)      : null} />
            </div>
            {upside !== null && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold">Analyst Upside</p>
                <span className={`font-mono text-xs font-semibold ${upside >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {upside >= 0 ? '+' : ''}{(upside * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {live?.analystActions && live.analystActions.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-[#8a96a8] font-semibold mb-1.5">Recent Actions</p>
                <div className="flex flex-col gap-1.5">
                  {live.analystActions.map((a, i) => {
                    const meta = ACTION_META[a.action] ?? { icon: '·', label: a.action, color: 'text-[#8a96a8]' };
                    const gradeChanged = a.fromGrade && a.fromGrade !== a.toGrade;
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className={`text-[11px] font-bold shrink-0 mt-0.5 ${meta.color}`}>{meta.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-[#202e4a] truncate leading-tight">{a.firm}</p>
                          <p className="text-[9px] text-[#8a96a8] leading-tight">
                            {a.toGrade || meta.label}
                            {gradeChanged && ` (from ${a.fromGrade})`}
                            {' · '}{a.date}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business summary — fully expandable */}
      {live?.businessSummary && (
        <div className="mt-3 bg-white rounded-lg border border-[#e5e3dd] px-4 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#8a96a8]">
              About · {comp.name}
              {live.industry && (
                <span className="ml-2 font-normal normal-case text-[#8a96a8]">
                  · {comp.sector} / {live.industry}
                </span>
              )}
            </p>
            <button
              onClick={() => setShowFullSummary(v => !v)}
              className="text-[10px] text-[#007cba] hover:underline font-semibold shrink-0"
            >
              {showFullSummary ? 'Show less' : 'Read more'}
            </button>
          </div>
          <p className={`text-[12px] text-[#4a5e78] leading-relaxed ${showFullSummary ? '' : 'line-clamp-3'}`}>
            {live.businessSummary}
          </p>
        </div>
      )}
    </div>
  );
}

// Abbreviated sector names for chips
const SECTOR_ABBREV: Record<string, string> = {
  'Technology': 'Tech',
  'Healthcare': 'Healthcare',
  'Industrials': 'Industrials',
  'Financials': 'Financials',
  'Materials': 'Materials',
  'Communication Services': 'Comm. Svcs',
  'Consumer Staples': 'Cons. Staples',
};

export default function BenchTable({ comps, liveData }: Props) {
  const [sortKey, setSortKey]         = useState<SortKey>('compFor');
  const [sortAsc, setSortAsc]         = useState(true);
  const [expandedSym, setExpandedSym] = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [sectorFilter, setSectorFilter]   = useState('all');
  const [compForFilter, setCompForFilter] = useState('all');

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(key === 'compFor' || key === 'sym'); }
  }, [sortKey]);

  const liveMap  = new Map(liveData.map(d => [d.symbol, d]));
  const enriched = comps.map(c => ({ ...c, live: liveMap.get(c.sym) ?? null }));

  const sectors  = Array.from(new Set(comps.map(c => c.sector))).sort();
  const compFors = Array.from(new Set(comps.map(c => c.compFor))).sort();

  const q = search.toLowerCase().trim();
  const filtered = enriched.filter(r => {
    if (q && !r.sym.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q) && !r.compFor.toLowerCase().includes(q)) return false;
    if (sectorFilter !== 'all' && r.sector !== sectorFilter) return false;
    if (compForFilter !== 'all' && r.compFor !== compForFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    const al = a.live;
    const bl = b.live;
    switch (sortKey) {
      case 'sym':       av = a.sym;     bv = b.sym;     break;
      case 'compFor':   av = a.compFor; bv = b.compFor; break;
      case 'sector':    av = a.sector;  bv = b.sector;  break;
      case 'price':     av = al?.price          ?? -Infinity; bv = bl?.price          ?? -Infinity; break;
      case 'dayPct':    av = al?.dayChangePct    ?? -Infinity; bv = bl?.dayChangePct    ?? -Infinity; break;
      case 'return1M':  av = al?.return1MPct     ?? -Infinity; bv = bl?.return1MPct     ?? -Infinity; break;
      case 'returnYTD': av = al?.returnYTDPct    ?? -Infinity; bv = bl?.returnYTDPct    ?? -Infinity; break;
      case 'forwardPe': av = al?.forwardPe       ?? Infinity;  bv = bl?.forwardPe       ?? Infinity;  break;
      case 'beta':      av = al?.beta            ?? -Infinity; bv = bl?.beta            ?? -Infinity; break;
      default: av = 0; bv = 0;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ?  1 : -1;
    return 0;
  });

  const rowsWithMeta = sorted.map((row, idx) => ({
    ...row,
    showGroupHeader: sortKey === 'compFor' && (idx === 0 || sorted[idx - 1].compFor !== row.compFor),
    isEven: idx % 2 === 0,
  }));

  const hasFilters = q || sectorFilter !== 'all' || compForFilter !== 'all';

  return (
    <div className="rounded-lg border border-[#d4d1c9] overflow-hidden shadow-sm">

      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-[#e5e3dd] bg-[#faf9f6] flex flex-wrap items-center gap-4">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a96a8]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Ticker or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded border border-[#d4d1c9] bg-white text-[12px] text-[#202e4a] placeholder-[#c8cdd6] focus:outline-none focus:border-[#007cba] w-44 transition-colors"
          />
        </div>

        <div className="w-px h-5 bg-[#d4d1c9]" />

        {/* Sector chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-[#8a96a8] uppercase tracking-wide shrink-0">Sector</span>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setSectorFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${sectorFilter === 'all' ? 'bg-[#202e4a] text-white' : 'bg-[#f2f1ec] text-[#8a96a8] hover:bg-[#e5e3dd] hover:text-[#4a5e78]'}`}
            >All</button>
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSectorFilter(s)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${sectorFilter === s ? 'bg-[#202e4a] text-white' : 'bg-[#f2f1ec] text-[#8a96a8] hover:bg-[#e5e3dd] hover:text-[#4a5e78]'}`}
              >{SECTOR_ABBREV[s] ?? s}</button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-[#d4d1c9]" />

        {/* Comp For dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#8a96a8] uppercase tracking-wide shrink-0">Comp For</span>
          <select
            value={compForFilter}
            onChange={e => setCompForFilter(e.target.value)}
            className="px-2 py-1 rounded border border-[#d4d1c9] bg-white text-[11px] text-[#202e4a] focus:outline-none focus:border-[#007cba] transition-colors cursor-pointer"
          >
            <option value="all">All Positions</option>
            {compFors.map(c => (
              <option key={c} value={c}>{c} · {CORE_NAMES[c] ?? c}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <>
            <div className="w-px h-5 bg-[#d4d1c9]" />
            <button
              onClick={() => { setSearch(''); setSectorFilter('all'); setCompForFilter('all'); }}
              className="text-[11px] font-semibold text-[#007cba] hover:underline"
            >Clear filters</button>
            <span className="text-[11px] text-[#8a96a8] font-mono">{filtered.length} results</span>
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#202e4a] border-b border-[#182438]">
              <TH sortKey="sym"       activeSortKey={sortKey} asc={sortAsc} onClick={handleSort}>Ticker</TH>
              <TH                     activeSortKey={sortKey} asc={sortAsc} className="min-w-[170px]">Company</TH>
              <TH sortKey="compFor"   activeSortKey={sortKey} asc={sortAsc} onClick={handleSort}>Comp For</TH>
              <TH sortKey="sector"    activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="min-w-[130px]">Sector</TH>
              <TH sortKey="price"     activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Price</TH>
              <TH sortKey="dayPct"    activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Day %</TH>
              <TH sortKey="return1M"  activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">1M Rtn</TH>
              <TH sortKey="returnYTD" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">YTD</TH>
              <TH sortKey="forwardPe" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Fwd P/E</TH>
              <TH sortKey="beta"      activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Beta</TH>
            </tr>
          </thead>
          <tbody>
            {rowsWithMeta.map(row => {
              const { showGroupHeader, isEven, live } = row;
              const isExpanded = expandedSym === row.sym;

              return (
                <React.Fragment key={row.sym}>
                  {showGroupHeader && (
                    <tr className="bg-[#f2f1ec] border-t border-b border-[#d4d1c9]">
                      <td colSpan={10} className="px-4 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#007cba]">
                          {row.compFor} · {CORE_NAMES[row.compFor] ?? row.compFor}
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => setExpandedSym(isExpanded ? null : row.sym)}
                    className={`group cursor-pointer border-b transition-colors duration-100 ${
                      isExpanded
                        ? 'bg-[#deedf7] border-b-[#c8dfee]'
                        : isEven
                        ? 'bg-white border-b-[#eeece7] hover:bg-[#eef6fb]'
                        : 'bg-[#faf9f6] border-b-[#eeece7] hover:bg-[#eef6fb]'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-[#007cba] tracking-wide">{row.sym}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-[#4a5e78] truncate max-w-[180px] block">{row.name}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#eef3f8] text-[#007cba] border border-[#c8dfee]">
                        {row.compFor}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-[#6a7a8e]">{row.sector}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {live?.price != null
                        ? <span className="font-mono text-xs text-[#202e4a]">${live.price.toFixed(2)}</span>
                        : <Placeholder />}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <DayPctCell value={live?.dayChangePct ?? null} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <PctCell value={live?.return1MPct ?? null} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <PctCell value={live?.returnYTDPct ?? null} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {live?.forwardPe != null
                        ? <span className="font-mono text-xs text-[#202e4a]">{live.forwardPe.toFixed(1)}x</span>
                        : <Placeholder />}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {live?.beta != null
                        ? <span className="font-mono text-xs text-[#4a5e78]">{live.beta.toFixed(2)}</span>
                        : <Placeholder />}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={10} className="p-0">
                      <BenchExpandedRow comp={row} live={live} isOpen={isExpanded} />
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-[#d4d1c9] bg-[#f8f7f3] flex items-center justify-between">
        <span className="text-[11px] text-[#8a96a8]">
          {hasFilters
            ? `${filtered.length} of ${comps.length} comps · click row to expand`
            : `${comps.length} comparable companies · 25 core positions · click row to expand`}
        </span>
        <span className="text-[11px] text-[#8a96a8] font-mono">Prices via Yahoo Finance</span>
      </div>
    </div>
  );
}
