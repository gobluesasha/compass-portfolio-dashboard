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
};

interface Props {
  comps: BenchComp[];
  liveData: BenchLiveData[];
}

function Placeholder() {
  return <span className="text-[#c8cdd6] font-mono text-xs">—</span>;
}

function PctCell({ value, decimals = 2 }: { value: number | null; decimals?: number }) {
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

export default function BenchTable({ comps, liveData }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('compFor');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(key === 'compFor' || key === 'sym'); }
  }, [sortKey]);

  const liveMap = new Map(liveData.map(d => [d.symbol, d]));
  const enriched = comps.map(c => ({ ...c, live: liveMap.get(c.sym) ?? null }));

  const sorted = [...enriched].sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    const al = a.live;
    const bl = b.live;
    switch (sortKey) {
      case 'sym':       av = a.sym;     bv = b.sym;     break;
      case 'compFor':   av = a.compFor; bv = b.compFor; break;
      case 'sector':    av = a.sector;  bv = b.sector;  break;
      case 'price':     av = al?.price ?? -Infinity;     bv = bl?.price ?? -Infinity;     break;
      case 'dayPct':    av = al?.dayChangePct ?? -Infinity; bv = bl?.dayChangePct ?? -Infinity; break;
      case 'return1M':  av = al?.return1MPct ?? -Infinity;  bv = bl?.return1MPct ?? -Infinity;  break;
      case 'returnYTD': av = al?.returnYTDPct ?? -Infinity; bv = bl?.returnYTDPct ?? -Infinity; break;
      case 'forwardPe': av = al?.forwardPe ?? Infinity;  bv = bl?.forwardPe ?? Infinity;  break;
      case 'beta':      av = al?.beta ?? -Infinity;      bv = bl?.beta ?? -Infinity;      break;
      default: av = 0; bv = 0;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ?  1 : -1;
    return 0;
  });

  // Pre-compute group header visibility to avoid mutation during render
  const rowsWithMeta = sorted.map((row, idx) => ({
    ...row,
    showGroupHeader: sortKey === 'compFor' && (idx === 0 || sorted[idx - 1].compFor !== row.compFor),
    isEven: idx % 2 === 0,
  }));

  return (
    <div className="rounded-lg border border-[#d4d1c9] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#202e4a] border-b border-[#182438]">
              <TH sortKey="sym"       activeSortKey={sortKey} asc={sortAsc} onClick={handleSort}>Ticker</TH>
              <TH                     activeSortKey={sortKey} asc={sortAsc} className="min-w-[170px]">Company</TH>
              <TH sortKey="compFor"   activeSortKey={sortKey} asc={sortAsc} onClick={handleSort}>Comp For</TH>
              <TH sortKey="sector"    activeSortKey={sortKey} asc={sortAsc} onClick={handleSort} className="min-w-[140px]">Sector</TH>
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
                    className={`border-b transition-colors duration-100 ${
                      isEven ? 'bg-white border-b-[#eeece7] hover:bg-[#eef6fb]'
                             : 'bg-[#faf9f6] border-b-[#eeece7] hover:bg-[#eef6fb]'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-[#007cba] tracking-wide">{row.sym}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-[#4a5e78] truncate max-w-[180px] block">
                        {row.name}
                      </span>
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
                      {live?.price !== null && live?.price !== undefined
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
                      {live?.forwardPe !== null && live?.forwardPe !== undefined
                        ? <span className="font-mono text-xs text-[#202e4a]">{live.forwardPe.toFixed(1)}x</span>
                        : <Placeholder />}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {live?.beta !== null && live?.beta !== undefined
                        ? <span className="font-mono text-xs text-[#4a5e78]">{live.beta.toFixed(2)}</span>
                        : <Placeholder />}
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
          {comps.length} comparable companies · 25 core positions · click column to sort
        </span>
        <span className="text-[11px] text-[#8a96a8] font-mono">Prices via Yahoo Finance</span>
      </div>
    </div>
  );
}
