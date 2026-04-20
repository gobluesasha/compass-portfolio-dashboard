'use client';

import { useState, useCallback } from 'react';
import { Position, PositionStatus, EarningsResult } from '../types/portfolio';
import ExpandedRow from './ExpandedRow';

// ── Types ──────────────────────────────────────────────────────
type SortKey =
  | 'sym'
  | 'issuerName'
  | 'weight'
  | 'valueK'
  | 'shares'
  | 'status';

interface Props {
  positions: Position[];
}

// ── Status dot ─────────────────────────────────────────────────
const STATUS_CLASSES: Record<PositionStatus, string> = {
  green:  'bg-emerald-400',
  yellow: 'bg-amber-400',
  red:    'bg-red-500',
};

const STATUS_ROW_ACCENT: Record<PositionStatus, string> = {
  green:  'border-l-emerald-500/50',
  yellow: 'border-l-amber-500/40',
  red:    'border-l-red-500/50',
};

// ── Earnings badge ─────────────────────────────────────────────
function EarningsBadge({ result }: { result: EarningsResult }) {
  if (!result) return <span className="text-[#1e3248]">—</span>;
  const styles: Record<NonNullable<EarningsResult>, string> = {
    beat:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    miss:   'bg-red-500/15 text-red-400 border-red-500/30',
    inline: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  };
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${styles[result]}`}
    >
      {result}
    </span>
  );
}

// ── Sort chevron ───────────────────────────────────────────────
function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
      {asc ? '↑' : '↓'}
    </span>
  );
}

// ── Column header ──────────────────────────────────────────────
function TH({
  children,
  sortKey,
  activeSortKey,
  asc,
  onClick,
  className = '',
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
      className={`
        group px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.14em] font-semibold
        text-[#2d4a62] select-none whitespace-nowrap
        ${sortKey ? 'cursor-pointer hover:text-[#4a7a9b] transition-colors' : ''}
        ${isActive ? 'text-[#4a7a9b]' : ''}
        ${className}
      `}
    >
      {children}
      {sortKey && <SortIcon active={isActive} asc={asc} />}
    </th>
  );
}

// ── Placeholder cell ───────────────────────────────────────────
function Placeholder() {
  return <span className="text-[#1e3248] font-mono text-xs">—</span>;
}

// ── Weight bar ─────────────────────────────────────────────────
function WeightBar({ weight }: { weight: number }) {
  // max weight is ~4.6%, scale bar accordingly
  const pct = Math.min((weight / 0.05) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-[#8fafc8] w-10 text-right shrink-0">
        {(weight * 100).toFixed(1)}%
      </span>
      <div className="w-14 h-1 rounded-full bg-[#0d1e2d] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#2a5a8a] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function PortfolioTable({ positions }: Props) {
  const [expandedSym, setExpandedSym] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('valueK');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortAsc((v) => !v);
      } else {
        setSortKey(key);
        setSortAsc(false);
      }
    },
    [sortKey]
  );

  const sorted = [...positions].sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    switch (sortKey) {
      case 'sym':       av = a.sym;       bv = b.sym;       break;
      case 'issuerName':av = a.issuerName;bv = b.issuerName;break;
      case 'weight':    av = a.weight;    bv = b.weight;    break;
      case 'valueK':    av = a.valueK;    bv = b.valueK;    break;
      case 'shares':    av = a.shares;    bv = b.shares;    break;
      case 'status': {
        const order = { green: 0, yellow: 1, red: 2 };
        av = order[a.status]; bv = order[b.status]; break;
      }
      default: av = 0; bv = 0;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ?  1 : -1;
    return 0;
  });

  return (
    <div className="rounded-lg border border-[#0e2030] overflow-hidden shadow-2xl shadow-black/40">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* ── Header ── */}
          <thead>
            <tr className="bg-[#070d16] border-b border-[#0e2030]">
              {/* Status */}
              <TH sortKey="status" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="pl-4 w-8">
                St
              </TH>
              <TH sortKey="sym" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort}>
                Ticker
              </TH>
              <TH sortKey="issuerName" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="min-w-[160px]">
                Company
              </TH>
              <TH sortKey="weight" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="min-w-[120px]">
                Weight
              </TH>
              <TH sortKey="valueK" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">
                Value ($K)
              </TH>
              <TH sortKey="shares" activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="text-right">
                Shares
              </TH>
              {/* Placeholder live columns */}
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Price</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Day %</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Total Rtn</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Qtly Grw</TH>
              <TH activeSortKey={sortKey} asc={sortAsc} className="text-right">Contrib</TH>
              <TH activeSortKey={sortKey} asc={sortAsc}>Last Earn</TH>
              <TH activeSortKey={sortKey} asc={sortAsc}>Next Earn</TH>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {sorted.map((pos, idx) => {
              const isExpanded = expandedSym === pos.sym;
              const isEven = idx % 2 === 0;

              return (
                <>
                  {/* ── Data Row ── */}
                  <tr
                    key={`row-${pos.sym}`}
                    onClick={() =>
                      setExpandedSym(isExpanded ? null : pos.sym)
                    }
                    className={`
                      group cursor-pointer border-l-2 border-b border-b-[#091520]
                      transition-colors duration-100
                      ${STATUS_ROW_ACCENT[pos.status]}
                      ${isExpanded
                        ? 'bg-[#0e2035]'
                        : isEven
                        ? 'bg-[#080f1a] hover:bg-[#0a1828]'
                        : 'bg-[#060c15] hover:bg-[#091525]'
                      }
                    `}
                  >
                    {/* Status dot */}
                    <td className="pl-4 pr-2 py-2.5 w-8">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_CLASSES[pos.status]}`}
                      />
                    </td>

                    {/* Ticker */}
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-[#5a9fd4] tracking-wide">
                        {pos.sym}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-[#6a8ba8] truncate max-w-[180px] block">
                        {pos.issuerName.length > 28
                          ? pos.issuerName.slice(0, 27) + '…'
                          : pos.issuerName}
                      </span>
                    </td>

                    {/* Weight bar */}
                    <td className="px-3 py-2.5">
                      <WeightBar weight={pos.weight} />
                    </td>

                    {/* Value */}
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-mono text-xs text-[#8fafc8]">
                        {pos.valueK.toLocaleString()}
                      </span>
                    </td>

                    {/* Shares */}
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-mono text-xs text-[#6a8ba8]">
                        {pos.shares.toLocaleString()}
                      </span>
                    </td>

                    {/* Placeholder live columns */}
                    <td className="px-3 py-2.5 text-right"><Placeholder /></td>
                    <td className="px-3 py-2.5 text-right"><Placeholder /></td>
                    <td className="px-3 py-2.5 text-right"><Placeholder /></td>
                    <td className="px-3 py-2.5 text-right"><Placeholder /></td>
                    <td className="px-3 py-2.5 text-right"><Placeholder /></td>

                    {/* Last earnings */}
                    <td className="px-3 py-2.5">
                      <EarningsBadge result={pos.earnings.lastEarnings} />
                    </td>

                    {/* Next earnings */}
                    <td className="px-3 py-2.5">
                      {pos.earnings.nextEarningsDate ? (
                        <span className="font-mono text-[11px] text-[#3a5a72]">
                          {pos.earnings.nextEarningsDate}
                        </span>
                      ) : (
                        <Placeholder />
                      )}
                    </td>
                  </tr>

                  {/* ── Expanded Detail Row ── */}
                  <tr key={`exp-${pos.sym}`} className={isExpanded ? 'bg-[#060d18]' : ''}>
                    <td colSpan={13} className="p-0">
                      <ExpandedRow position={pos} isOpen={isExpanded} />
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 border-t border-[#0e2030] bg-[#040a11] flex items-center justify-between">
        <span className="text-[10px] text-[#1e3248] uppercase tracking-widest">
          {positions.length} positions · click row to expand
        </span>
        <span className="text-[10px] text-[#1e3248] uppercase tracking-widest">
          Live data columns pending integration
        </span>
      </div>
    </div>
  );
}
