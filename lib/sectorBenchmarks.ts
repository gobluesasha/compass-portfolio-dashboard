// Approximate sector median benchmarks (decimal fractions, e.g. 0.12 = 12%)
// Used for context — override with internal CCM research as needed
export const SECTOR_BENCHMARKS: Record<string, Partial<Record<string, number>>> = {
  'Technology': {
    revenueGrowthPct: 0.12, grossMarginPct: 0.65, operatingMarginPct: 0.20,
    netMarginPct: 0.18, returnOnEquity: 0.28, ebitdaMarginPct: 0.28,
    fcfMarginPct: 0.20, returnOnAssets: 0.10,
  },
  'Healthcare': {
    revenueGrowthPct: 0.08, grossMarginPct: 0.55, operatingMarginPct: 0.15,
    netMarginPct: 0.12, returnOnEquity: 0.20, ebitdaMarginPct: 0.20,
    fcfMarginPct: 0.15, returnOnAssets: 0.07,
  },
  'Industrials': {
    revenueGrowthPct: 0.07, grossMarginPct: 0.35, operatingMarginPct: 0.12,
    netMarginPct: 0.09, returnOnEquity: 0.18, ebitdaMarginPct: 0.15,
    fcfMarginPct: 0.10, returnOnAssets: 0.06,
  },
  'Financials': {
    revenueGrowthPct: 0.06, grossMarginPct: 0.60, operatingMarginPct: 0.30,
    netMarginPct: 0.25, returnOnEquity: 0.15, ebitdaMarginPct: 0.35,
    fcfMarginPct: 0.25, returnOnAssets: 0.08,
  },
  'Consumer Staples': {
    revenueGrowthPct: 0.04, grossMarginPct: 0.35, operatingMarginPct: 0.14,
    netMarginPct: 0.10, returnOnEquity: 0.25, ebitdaMarginPct: 0.18,
    fcfMarginPct: 0.12, returnOnAssets: 0.07,
  },
  'Communication Services': {
    revenueGrowthPct: 0.09, grossMarginPct: 0.55, operatingMarginPct: 0.18,
    netMarginPct: 0.15, returnOnEquity: 0.22, ebitdaMarginPct: 0.30,
    fcfMarginPct: 0.18, returnOnAssets: 0.09,
  },
  'Materials': {
    revenueGrowthPct: 0.05, grossMarginPct: 0.28, operatingMarginPct: 0.12,
    netMarginPct: 0.08, returnOnEquity: 0.15, ebitdaMarginPct: 0.18,
    fcfMarginPct: 0.10, returnOnAssets: 0.06,
  },
};

export const SECTOR_CATALYST: Record<string, string> = {
  'Technology':             'AI/cloud adoption rates, enterprise software renewal cycles, product roadmap execution.',
  'Healthcare':             'Clinical trial readouts, regulatory decisions, drug pricing policy developments.',
  'Industrials':            'Order backlog updates, capacity utilization, M&A pipeline and integration milestones.',
  'Financials':             'Net interest margin trends, credit quality, regulatory capital requirements.',
  'Consumer Staples':       'Pricing power sustainability, volume recovery, private label competition.',
  'Communication Services': 'User engagement and monetization, ad market conditions, content pipeline.',
  'Materials':              'Commodity price cycles, global demand signals, capacity expansion decisions.',
};
