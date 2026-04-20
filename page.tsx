import { PORTFOLIO, PORTFOLIO_STATS } from '../lib/portfolioData';
import PortfolioTable from '../components/PortfolioTable';

// ── Stat card ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="px-5 py-3.5 rounded-lg bg-[#070d18] border border-[#0e2232] flex flex-col gap-1 min-w-[120px]">
      <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#2d4a62]">
        {label}
      </span>
      <span
        className={`text-xl font-mono font-bold leading-none ${
          accent ? 'text-[#4f8ef7]' : 'text-[#a8cce0]'
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-[#1e3248]">{sub}</span>
      )}
    </div>
  );
}

// ── Signal indicator ──────────────────────────────────────────
function SignalBar({
  green,
  yellow,
  red,
}: {
  green: number;
  yellow: number;
  red: number;
}) {
  const total = green + yellow + red;
  return (
    <div className="px-5 py-3.5 rounded-lg bg-[#070d18] border border-[#0e2232] flex flex-col gap-2 min-w-[160px]">
      <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#2d4a62]">
        Signal Mix
      </span>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div
          className="bg-emerald-500 transition-all"
          style={{ width: `${(green / total) * 100}%` }}
        />
        <div
          className="bg-amber-400 transition-all"
          style={{ width: `${(yellow / total) * 100}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${(red / total) * 100}%` }}
        />
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="text-emerald-500">{green} ●</span>
        <span className="text-amber-400">{yellow} ●</span>
        <span className="text-red-500">{red} ●</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const totalAUM =
    (PORTFOLIO_STATS.totalValueK / 1000).toFixed(1);

  return (
    <main className="min-h-screen bg-[#040911] text-[#c0d4e4]">
      {/* ── Top navigation bar ── */}
      <header className="border-b border-[#0b1e30] bg-[#040911]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded bg-[#1a3a5e] border border-[#2a5a8a] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#4f8ef7] font-mono">CC</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.08em] uppercase text-[#8fafc8]">
                Compass Capital Management
              </h1>
              <p className="text-[10px] text-[#1e3248] tracking-widest uppercase">
                Portfolio Intelligence Dashboard
              </p>
            </div>
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#1e3248] font-mono uppercase tracking-widest">
              13-F Filing · Q4 2025
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-500/60 uppercase tracking-widest">
              Live pending
            </span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-6">

        {/* ── Stats row ── */}
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Total AUM"
            value={`$${totalAUM}M`}
            sub="Portfolio value (estimated)"
            accent
          />
          <StatCard
            label="Positions"
            value={String(PORTFOLIO_STATS.totalPositions)}
            sub="Unique holdings"
          />
          <StatCard
            label="Top 10 Conc."
            value={`${(PORTFOLIO_STATS.top10Weight * 100).toFixed(1)}%`}
            sub="% of portfolio"
          />
          <SignalBar
            green={PORTFOLIO_STATS.greenCount}
            yellow={PORTFOLIO_STATS.yellowCount}
            red={PORTFOLIO_STATS.redCount}
          />
          <StatCard
            label="Largest Position"
            value={PORTFOLIO[0].sym}
            sub={`${PORTFOLIO[0].weightDisplay} · ${PORTFOLIO[0].issuerName.slice(0, 22)}`}
          />
        </div>

        {/* ── Section header ── */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#2d4a62]">
            Holdings · All Positions
          </span>
          <div className="flex-1 h-px bg-[#0b1e2c]" />
          <span className="text-[10px] text-[#1e3248] font-mono">
            Sorted by Value ↓ · click to sort · click row to expand
          </span>
        </div>

        {/* ── Portfolio Table ── */}
        <PortfolioTable positions={PORTFOLIO} />

        {/* ── Footer ── */}
        <footer className="pt-2 pb-6 flex items-center justify-between">
          <span className="text-[10px] text-[#0f1e2d] uppercase tracking-widest">
            Compass Capital Management Inc. · For internal use only
          </span>
          <span className="text-[10px] text-[#0f1e2d] font-mono">
            Data source: SEC 13-F Q4 2025
          </span>
        </footer>
      </div>
    </main>
  );
}
