'use client';

import { useState, useCallback, useEffect, Fragment } from 'react';
import { Position, PositionStatus, EarningsResult, PositionDelta } from '../types/portfolio';
import ExpandedRow from './ExpandedRow';
import { DataTimestamps } from './PortfolioWrapper';

type SortKey =
  | 'sym'
  | 'issuerName'
  | 'weight'
  | 'valueK'
  | 'shares'
  | 'status'
  | 'costPrice'
  | 'returnVsCost';

type SignalFilter  = 'all' | 'green' | 'yellow' | 'red';
type DeltaFilter   = 'all' | 'new' | 'increased' | 'decreased';
type EarningsFilter = 'all' | 'beat' | 'miss' | 'inline';

interface Props {
  positions: Position[];
  focusSym?: string;
  timestamps: DataTimestamps;
  initialSignalFilter?: SignalFilter;
}

const CORE_THRESHOLD = 0.027;

const STATUS_CLASSES: Record<PositionStatus, string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-amber-400',
  red:    'bg-red-500',
};

const STATUS_ROW_ACCENT: Record<PositionStatus, string> = {
  green:  'border-l-emerald-500/60',
  yellow: 'border-l-amber-400/60',
  red:    'border-l-red-500/60',
};

function EarningsBadge({ result }: { result: EarningsResult }) {
  if (!result) return <span className="text-[#c8cdd6]">—</span>;
  const styles: Record<NonNullable<EarningsResult>, string> = {
    beat:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    miss:   'bg-red-50 text-red-600 border-red-200',
    inline: 'bg-sky-50 text-sky-600 border-sky-200',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${styles[result]}`}>
      {result}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: PositionDelta | null }) {
  if (!delta) return <span className="text-[#c8cdd6] font-mono text-xs">—</span>;
  if (delta.direction === 'new') {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-violet-50 text-violet-700 border border-violet-200">
        NEW
      </span>
    );
  }
  if (delta.direction === 'unchanged') {
    return <span className="text-[#c8cdd6] font-mono text-xs">—</span>;
  }
  const isUp = delta.direction === 'increased';
  const pct = (Math.abs(delta.sharesDiffPct) * 100).toFixed(1);
  return (
    <span className={`font-mono text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
      {isUp ? '▲' : '▼'} {pct}%
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

function Placeholder() {
  return <span className="text-[#c8cdd6] font-mono text-xs">—</span>;
}

function WeightBar({ weight }: { weight: number }) {
  const pct = Math.min((weight / 0.05) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-[#202e4a] w-10 text-right shrink-0">
        {(weight * 100).toFixed(1)}%
      </span>
      <div className="w-14 h-1.5 rounded-full bg-[#e5e3dd] overflow-hidden">
        <div className="h-full rounded-full bg-[#007cba] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PortfolioTable({ positions, focusSym, timestamps, initialSignalFilter }: Props) {
  const [expandedSym, setExpandedSym] = useState<string | null>(focusSym ?? null);
  const [sortKey, setSortKey] = useState<SortKey>('valueK');
  const [sortAsc, setSortAsc] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<SignalFilter>(initialSignalFilter ?? 'all');
  const [deltaFilter, setDeltaFilter] = useState<DeltaFilter>('all');
  const [earningsFilter, setEarningsFilter] = useState<EarningsFilter>('all');

  // Auto-expand and scroll to focusSym
  useEffect(() => {
    if (!focusSym) return;
    setExpandedSym(focusSym);
    const pos = positions.find(p => p.sym === focusSym);
    if (pos && pos.weight < CORE_THRESHOLD) setShowOthers(true);
    setTimeout(() => {
      document.getElementById(`row-${focusSym}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [focusSym]);

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  }, [sortKey]);

  const costPrice = (p: Position) => (p.shares > 0 ? (p.valueK * 1000) / p.shares : 0);
  const returnVsCost = (p: Position) => {
    const cp = costPrice(p);
    return cp > 0 && p.market.price !== null ? (p.market.price - cp) / cp : null;
  };

  const sorted = [...positions].sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    switch (sortKey) {
      case 'sym':        av = a.sym;        bv = b.sym;        break;
      case 'issuerName': av = a.issuerName; bv = b.issuerName; break;
      case 'weight':     av = a.weight;     bv = b.weight;     break;
      case 'valueK':     av = a.valueK;     bv = b.valueK;     break;
      case 'shares':     av = a.shares;     bv = b.shares;     break;
      case 'costPrice':  av = costPrice(a); bv = costPrice(b); break;
      case 'returnVsCost': av = returnVsCost(a) ?? -Infinity; bv = returnVsCost(b) ?? -Infinity; break;
      case 'status': {
        const order: Record<PositionStatus, number> = { green: 0, yellow: 1, red: 2 };
        av = order[a.status]; bv = order[b.status]; break;
      }
      default: av = 0; bv = 0;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ?  1 : -1;
    return 0;
  });

  const q = search.toLowerCase().trim();
  const filtered = sorted.filter(p => {
    if (q && !p.sym.toLowerCase().includes(q) && !p.issuerName.toLowerCase().includes(q)) return false;
    if (signalFilter !== 'all' && p.status !== signalFilter) return false;
    if (deltaFilter !== 'all') {
      if (!p.delta || p.delta.direction !== deltaFilter) return false;
    }
    if (earningsFilter !== 'all' && p.earnings.lastEarnings !== earningsFilter) return false;
    return true;
  });

  const hasFilters = q || signalFilter !== 'all' || deltaFilter !== 'all' || earningsFilter !== 'all';

  const corePositions  = filtered.filter(p => p.weight >= CORE_THRESHOLD);
  const otherPositions = filtered.filter(p => p.weight <  CORE_THRESHOLD);

  const renderRow = (pos: Position, idx: number) => {
    const isExpanded = expandedSym === pos.sym;
    const isEven = idx % 2 === 0;
    return (
      <Fragment key={pos.sym}>
        <tr
          id={`row-${pos.sym}`}
          onClick={() => setExpandedSym(isExpanded ? null : pos.sym)}
          className={`group cursor-pointer border-l-2 border-b transition-colors duration-100 ${STATUS_ROW_ACCENT[pos.status]} ${
            isExpanded
              ? 'bg-[#deedf7] border-b-[#c8dfee]'
              : isEven
              ? 'bg-white border-b-[#eeece7] hover:bg-[#eef6fb]'
              : 'bg-[#faf9f6] border-b-[#eeece7] hover:bg-[#eef6fb]'
          }`}
        >
          <td className="pl-4 pr-2 py-2.5 w-8">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_CLASSES[pos.status]}`} />
          </td>
          <td className="px-3 py-2.5">
            <span className="font-mono text-xs font-bold text-[#007cba] tracking-wide">{pos.sym}</span>
          </td>
          <td className="px-3 py-2.5">
            <span className="text-xs text-[#4a5e78] truncate max-w-[180px] block">
              {pos.issuerName.length > 28 ? pos.issuerName.slice(0, 27) + '…' : pos.issuerName}
            </span>
          </td>
          <td className="px-3 py-2.5">
            <WeightBar weight={pos.weight} />
          </td>
          <td className="px-3 py-2.5 text-right">
            <span className="font-mono text-xs text-[#202e4a]">{pos.valueK.toLocaleString()}</span>
          </td>
          <td className="px-3 py-2.5 text-right">
            <span className="font-mono text-xs text-[#4a5e78]">{pos.shares.toLocaleString()}</span>
          </td>
          {/* Live Price */}
          <td className="px-3 py-2.5 text-right">
            {pos.market.price !== null ? (
              <span className="font-mono text-xs text-[#202e4a]">${pos.market.price.toFixed(2)}</span>
            ) : <Placeholder />}
          </td>
          {/* Return vs. cost */}
          <td className="px-3 py-2.5 text-right">
            {(() => {
              const r = returnVsCost(pos);
              if (r === null) return <Placeholder />;
              return (
                <span className={`font-mono text-xs font-semibold ${r >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {r >= 0 ? '+' : ''}{(r * 100).toFixed(1)}%
                </span>
              );
            })()}
          </td>
          {/* Day % */}
          <td className="px-3 py-2.5 text-right">
            {pos.market.dayChangePct !== null ? (
              <span className={`font-mono text-xs font-semibold ${pos.market.dayChangePct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {pos.market.dayChangePct >= 0 ? '+' : ''}{pos.market.dayChangePct.toFixed(2)}%
              </span>
            ) : <Placeholder />}
          </td>
          {/* 1M */}
          <td className="px-3 py-2.5 text-right">
            {pos.risk.return1MPct !== null ? (
              <span className={`font-mono text-xs font-semibold ${pos.risk.return1MPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {pos.risk.return1MPct >= 0 ? '+' : ''}{(pos.risk.return1MPct * 100).toFixed(1)}%
              </span>
            ) : <Placeholder />}
          </td>
          {/* YTD */}
          <td className="px-3 py-2.5 text-right">
            {pos.risk.returnYTDPct !== null ? (
              <span className={`font-mono text-xs font-semibold ${pos.risk.returnYTDPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {pos.risk.returnYTDPct >= 0 ? '+' : ''}{(pos.risk.returnYTDPct * 100).toFixed(1)}%
              </span>
            ) : <Placeholder />}
          </td>
          {/* Earnings */}
          <td className="px-3 py-2.5">
            <EarningsBadge result={pos.earnings.lastEarnings} />
          </td>
          <td className="px-3 py-2.5">
            {pos.earnings.nextEarningsDate ? (
              <span className="font-mono text-[11px] text-[#007cba]">{pos.earnings.nextEarningsDate}</span>
            ) : <Placeholder />}
          </td>
        </tr>
        <tr>
          <td colSpan={13} className="p-0">
            <ExpandedRow position={pos} isOpen={isExpanded} timestamps={timestamps} />
          </td>
        </tr>
      </Fragment>
    );
  };

  const ChipGroup = <T extends string>({ label, options, value, onChange }: {
    label: string;
    options: { v: T; display: string; className?: string }[];
    value: T;
    onChange: (v: T) => void;
  }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-[#8a96a8] uppercase tracking-wide shrink-0">{label}</span>
      <div className="flex gap-1">
        {options.map(o => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              value === o.v
                ? (o.className ?? 'bg-[#202e4a] text-white')
                : 'bg-[#f2f1ec] text-[#8a96a8] hover:bg-[#e5e3dd] hover:text-[#4a5e78]'
            }`}
          >{o.display}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border border-[#d4d1c9] overflow-hidden shadow-sm">
      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-[#e5e3dd] bg-[#faf9f6] flex flex-wrap items-center gap-4">
        {/* Search */}
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
        <ChipGroup
          label="Signal"
          value={signalFilter}
          onChange={setSignalFilter}
          options={[
            { v: 'all' as SignalFilter, display: 'All' },
            { v: 'green' as SignalFilter, display: 'Conviction', className: 'bg-emerald-600 text-white' },
            { v: 'yellow' as SignalFilter, display: 'Monitor', className: 'bg-amber-500 text-white' },
            { v: 'red' as SignalFilter, display: 'Concern', className: 'bg-red-600 text-white' },
          ]}
        />
        <div className="w-px h-5 bg-[#d4d1c9]" />
        <ChipGroup
          label="Δ Position"
          value={deltaFilter}
          onChange={setDeltaFilter}
          options={[
            { v: 'all' as DeltaFilter, display: 'All' },
            { v: 'new' as DeltaFilter, display: 'New', className: 'bg-violet-600 text-white' },
            { v: 'increased' as DeltaFilter, display: '▲ Added' },
            { v: 'decreased' as DeltaFilter, display: '▼ Trimmed' },
          ]}
        />
        <div className="w-px h-5 bg-[#d4d1c9]" />
        <ChipGroup
          label="Earnings"
          value={earningsFilter}
          onChange={setEarningsFilter}
          options={[
            { v: 'all' as EarningsFilter, display: 'All' },
            { v: 'beat' as EarningsFilter, display: 'Beat', className: 'bg-emerald-600 text-white' },
            { v: 'inline' as EarningsFilter, display: 'In-Line', className: 'bg-sky-600 text-white' },
            { v: 'miss' as EarningsFilter, display: 'Miss', className: 'bg-red-600 text-white' },
          ]}
        />
        {hasFilters && (
          <>
            <div className="w-px h-5 bg-[#d4d1c9]" />
            <button
              onClick={() => { setSearch(''); setSignalFilter('all'); setDeltaFilter('all'); setEarningsFilter('all'); }}
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
              <TH sortKey="status" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="pl-4 w-8">St</TH>
              <TH sortKey="sym" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort}>Ticker</TH>
              <TH sortKey="issuerName" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="min-w-[160px]">Company</TH>
              <TH sortKey="weight" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="min-w-[120px]">Weight</TH>
              <TH sortKey="valueK" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Value ($K)</TH>
              <TH sortKey="shares" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Shares</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Live Price</TH>
              <TH sortKey="returnVsCost" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">Return</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Day %</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">1M Rtn</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">YTD</TH>
              <TH activeSortKey={sortKey} asc={sortAsc}>Last Earn</TH>
              <TH activeSortKey={sortKey} asc={sortAsc}>Next Earn</TH>
            </tr>
          </thead>
          <tbody>
            {corePositions.map((pos, idx) => renderRow(pos, idx))}

            {otherPositions.length > 0 && (
              <tr
                onClick={() => setShowOthers(v => !v)}
                className="cursor-pointer bg-[#f2f1ec] border-t-2 border-b border-t-[#007cba]/30 border-b-[#d4d1c9] hover:bg-[#e8ede8] transition-colors"
              >
                <td colSpan={13} className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[#007cba] text-[10px] transition-transform duration-200 inline-block ${showOthers ? 'rotate-90' : ''}`}>▶</span>
                    <span className="text-[12px] font-semibold text-[#007cba]">
                      {showOthers ? 'Hide' : 'Show'} {otherPositions.length} other positions
                    </span>
                    <div className="flex-1 h-px bg-[#007cba]/20" />
                    <span className="text-[11px] text-[#8a96a8] font-mono">weight &lt; 2.7%</span>
                  </div>
                </td>
              </tr>
            )}

            {showOthers && otherPositions.map((pos, idx) => renderRow(pos, idx))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-[#d4d1c9] bg-[#f8f7f3] flex items-center justify-between">
        <span className="text-[11px] text-[#8a96a8]">
          {hasFilters
            ? `${filtered.length} of ${positions.length} positions · click row to expand`
            : `${corePositions.length} core · ${otherPositions.length} other · ${positions.length} total · click row to expand`}
        </span>
        <span className="text-[11px] text-[#8a96a8] font-mono">
          Q4 2025 13-F
        </span>
      </div>
    </div>
  );
}
