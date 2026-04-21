'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  PieChart, Pie,
} from 'recharts';
import { PORTFOLIO, PORTFOLIO_STATS } from '../lib/portfolioData';
import { computeSectorAllocation } from '../lib/historicalData';
type PortfolioRiskResult = {
  portfolioBeta:  number | null;
  volatilityAnn:  number | null;
  var95_1day:     number | null;
  sharpeRatio:    number | null;
  riskFreeRate:   number | null;
  dataPoints:     number;
};

const CORE_THRESHOLD = 0.027;

const SP500_WEIGHTS: Record<string, number> = {
  'Technology':          31.0,
  'Comm. Services':       8.8,
  'Healthcare':          12.0,
  'Industrials':          8.5,
  'Consumer Discret.':   10.8,
  'Consumer Staples':     5.6,
  'Financials':          13.2,
  'Materials':            2.4,
  'Energy':               3.9,
  'Real Estate':          2.3,
  'Utilities':            2.5,
};

function SectorTooltip({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e3dd', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#202e4a' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.name === 'portfolio' ? '#007cba' : '#8a96a8' }}>
          {p.name === 'portfolio' ? 'Portfolio' : 'S&P 500'}: {p.value}%
        </p>
      ))}
    </div>
  );
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-5 py-3.5 border-b border-[#eeece7]">
      <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#8a96a8]">{title}</span>
      {note && <p className="text-[9px] text-[#a8a49e] mt-0.5 font-mono italic">{note}</p>}
    </div>
  );
}

function RiskCard({ label, value, sub, loading }: {
  label: string; value: string | null; sub?: string; loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#d4d1c9] bg-[#f8f7f3] px-4 py-3.5 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8a96a8]">{label}</span>
      {loading ? (
        <span className="text-xl font-mono font-bold text-[#c8cdd6] animate-pulse">…</span>
      ) : value !== null ? (
        <span className="text-xl font-mono font-bold text-[#202e4a]">{value}</span>
      ) : (
        <span className="text-xl font-mono font-bold text-[#c8cdd6]">—</span>
      )}
      {sub && <span className="text-[9px] text-[#a8a49e] font-mono">{sub}</span>}
    </div>
  );
}

export default function PortfolioAnalytics() {
  const [risk, setRisk] = useState<PortfolioRiskResult | null>(null);
  const [riskLoading, setRiskLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio-risk')
      .then(r => r.json())
      .then(j => { setRisk(j.data); setRiskLoading(false); })
      .catch(() => setRiskLoading(false));
  }, []);

  const sectorAllocation = computeSectorAllocation(PORTFOLIO);

  const sectorData = [...sectorAllocation]
    .sort((a, b) => b.weight - a.weight)
    .map(s => ({
      sector: s.sector,
      portfolio: parseFloat((s.weight * 100).toFixed(1)),
      benchmark: SP500_WEIGHTS[s.sector] ?? 0,
    }));

  // Core vs tail donut
  const coreValueK = PORTFOLIO.filter(p => p.weight >= CORE_THRESHOLD).reduce((s, p) => s + p.valueK, 0);
  const tailValueK = PORTFOLIO.filter(p => p.weight <  CORE_THRESHOLD).reduce((s, p) => s + p.valueK, 0);
  const total = PORTFOLIO_STATS.totalValueK;
  const donutData = [
    { name: 'Core (25)',  value: parseFloat((coreValueK / total * 100).toFixed(1)), valueK: coreValueK, fill: '#007cba' },
    { name: 'Tail (58)',  value: parseFloat((tailValueK / total * 100).toFixed(1)), valueK: tailValueK, fill: '#c8cdd6' },
  ];

  const chartH = Math.max(sectorData.length * 40, 200);

  return (
    <div className="flex flex-col gap-4">

      {/* Sector Exposure */}
      <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
        <SectionHeader
          title="Sector Exposure vs. S&P 500"
          note="Benchmark weights: static placeholder — integration point for live benchmark feed"
        />
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-4 mb-3 text-[11px] text-[#4a5e78]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2.5 rounded-sm bg-[#007cba]" />Portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2.5 rounded-sm bg-[#d4d1c9]" />S&amp;P 500
            </span>
          </div>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={sectorData} layout="vertical" barCategoryGap="25%" barGap={3} margin={{ left: 0, right: 30 }}>
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#8a96a8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="sector" width={120} tick={{ fontSize: 11, fill: '#4a5e78' }} axisLine={false} tickLine={false} />
              <Tooltip content={<SectorTooltip />} />
              <Bar dataKey="portfolio" fill="#007cba" radius={[0, 3, 3, 0]} />
              <Bar dataKey="benchmark" fill="#d4d1c9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Core vs Tail + Risk Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
          <SectionHeader title="Core vs. Tail Allocation" />
          <div className="p-5 flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {donutData.map(d => (
                <div key={d.name} className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-sm mt-0.5 shrink-0" style={{ background: d.fill }} />
                  <div>
                    <p className="text-xs font-semibold text-[#202e4a]">{d.name} positions</p>
                    <p className="text-sm font-mono font-bold text-[#007cba]">{d.value}%</p>
                    <p className="text-[10px] text-[#8a96a8]">${(d.valueK / 1000).toFixed(1)}M AUM</p>
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-[#a8a49e] font-mono">Core threshold: weight ≥ 2.7%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
          <SectionHeader
            title="Portfolio Risk Metrics"
            note={risk ? `Computed from ${risk.dataPoints} trading days · core equity positions · 4h cache` : undefined}
          />
          <div className="p-5 grid grid-cols-2 gap-3">
            <RiskCard
              label="Portfolio Beta"
              value={risk?.portfolioBeta !== null && risk?.portfolioBeta !== undefined ? risk.portfolioBeta.toFixed(2) : null}
              sub="vs. S&P 500 (SPY) · 1-year regression"
              loading={riskLoading}
            />
            <RiskCard
              label="Volatility (Ann.)"
              value={risk?.volatilityAnn !== null && risk?.volatilityAnn !== undefined ? `${risk.volatilityAnn.toFixed(1)}%` : null}
              sub="annualized std dev of daily returns"
              loading={riskLoading}
            />
            <RiskCard
              label="VaR 95% · 1-Day"
              value={risk?.var95_1day !== null && risk?.var95_1day !== undefined ? `${risk.var95_1day.toFixed(2)}%` : null}
              sub="parametric · normal distribution"
              loading={riskLoading}
            />
            <RiskCard
              label="Sharpe Ratio"
              value={risk?.sharpeRatio !== null && risk?.sharpeRatio !== undefined ? risk.sharpeRatio.toFixed(2) : null}
              sub={risk?.riskFreeRate !== null && risk?.riskFreeRate !== undefined ? `rf = ${risk.riskFreeRate.toFixed(2)}% (^IRX)` : 'risk-free: ^IRX'}
              loading={riskLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
