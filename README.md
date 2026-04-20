# Compass Capital — Portfolio Dashboard

A professional hedge-fund-style portfolio intelligence dashboard built with
Next.js 15, Tailwind CSS, and TypeScript. Powered by your Q4 2025 13-F data.

---

## Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Framework   | Next.js 15 (App Router)       |
| Styling     | Tailwind CSS 3                |
| Language    | TypeScript 5                  |
| Fonts       | IBM Plex Sans + IBM Plex Mono |
| Data        | Static (13-F CSV embedded)    |

---

## Project Structure

```
compass-portfolio-dashboard/
├── app/
│   ├── globals.css        # Global styles + CSS variables
│   ├── layout.tsx         # Root layout (fonts, metadata)
│   └── page.tsx           # Main dashboard page
├── components/
│   ├── PortfolioTable.tsx  # Sortable table with expandable rows
│   └── ExpandedRow.tsx     # Animated detail panel
├── lib/
│   └── portfolioData.ts    # Embedded CSV data + parser
├── types/
│   └── portfolio.ts        # TypeScript interfaces
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Quick Start

```bash
# 1. Create a new Next.js project (if starting fresh)
npx create-next-app@latest compass-dashboard --typescript --tailwind --app --no-src-dir

# 2. Copy all files from this package into the project directory,
#    replacing the default app/ folder contents

# 3. Install dependencies
npm install

# 4. Run the dev server
npm run dev

# 5. Open http://localhost:3000
```

---

## Features

### Main Table
- All 83 positions from Q4 2025 13-F filing
- Sortable by: Ticker, Company, Weight, Value, Shares, Status
- Color-coded rows via left border (green / yellow / red)
- Weight visualised as inline bar chart
- Last earnings badge (Beat / Miss / Inline)
- Next earnings date

### Expanded Row (click any row)
- Smooth animated expand/collapse
- **Left panel**: price chart placeholder, entry vs current price, 1M/3M/YTD performance
- **Right panel**: Fundamentals, Valuation, Risk Metrics, Qualitative notes

---

## Extending with Live Data

### 1. Market prices (polygon.io / Yahoo Finance / Bloomberg)
Add a route handler in `app/api/market/route.ts`:

```ts
export async function GET() {
  const data = await fetchFromProvider(TICKERS);
  return Response.json(data);
}
```

Then in `PortfolioTable.tsx`, add a `useEffect` that fetches this endpoint
and merges the results into the `positions` array via `market` fields on
each `Position`.

### 2. Fundamentals (Financials API)
Populate `fundamentals`, `valuation`, `risk` fields per ticker.

### 3. Qualitative notes (CMS or JSON file)
Store notes in `/data/qualitative.json` keyed by ticker, then merge in
`portfolioData.ts`.

### 4. Add shadcn/ui (optional)
```bash
npx shadcn@latest init
npx shadcn@latest add table badge card tooltip
```
Replace custom components with shadcn equivalents where desired.

---

## Data Model

Every position implements the `Position` interface defined in `types/portfolio.ts`.
Live-data fields are nullable — they render `—` until populated.

```
Position
├── CsvFields         (sym, issuerName, valueK, weight, shares)
├── MarketData        (price, dayChangePct, totalReturnPct, ...)
├── EarningsData      (lastEarnings, lastEarningsDate, nextEarningsDate)
├── Fundamentals      (revenueGrowth, epsGrowth, ...)
├── Valuation         (pe, evEbitda, priceToSales)
├── RiskMetrics       (volatility, beta, maxDrawdown)
├── QualitativeData   (thesis, sellCriteria, catalysts, ...)
└── PriceHistory      (entryPrice, currentPrice, returns)
```

---

## Status Color Logic

Statuses are currently hardcoded per ticker in `lib/portfolioData.ts`.
To automate:
- **Green** = conviction hold, thesis intact
- **Yellow** = monitoring required, thesis under review
- **Red** = thesis broken, potential exit

---

## License

Internal use only. Compass Capital Management Inc.
