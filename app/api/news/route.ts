import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '../../../lib/yahooFinance';

export const dynamic = 'force-dynamic';

export type NewsItem = {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number; // Unix ms
  relatedSymbol: string;
};

const cache = new Map<string, { items: NewsItem[]; expires: number }>();
const TTL = 15 * 60 * 1000; // 15 minutes

export async function GET(req: NextRequest) {
  const raw     = req.nextUrl.searchParams.get('symbols') ?? '';
  const limitPx = parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10);
  const perSym  = parseInt(req.nextUrl.searchParams.get('perSym') ?? '5', 10);
  const maxSym  = 15;

  const symbols = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, maxSym);
  if (!symbols.length) {
    return NextResponse.json({ error: 'No symbols' }, { status: 400 });
  }

  const cacheKey = `${symbols.join(',')}_${perSym}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ data: cached.items.slice(0, limitPx), timestamp: Date.now() });
  }

  const allNews: NewsItem[] = [];
  const seen = new Set<string>();

  for (const symbol of symbols) {
    try {
      const result = await (yahooFinance as any).search(
        symbol,
        { newsCount: Math.min(perSym, 8), quotesCount: 0 },
        { validateResult: false }
      );
      const news: any[] = result?.news ?? [];
      for (const item of news) {
        const link = String(item.link ?? '');
        if (!link || seen.has(link)) continue;
        seen.add(link);
        allNews.push({
          uuid:          String(item.uuid ?? link),
          title:         String(item.title ?? ''),
          publisher:     String(item.publisher ?? ''),
          link,
          publishedAt:   (item.providerPublishTime ?? 0) * 1000,
          relatedSymbol: symbol,
        });
      }
      await new Promise(r => setTimeout(r, 80));
    } catch { /* non-fatal — skip symbol */ }
  }

  allNews.sort((a, b) => b.publishedAt - a.publishedAt);
  cache.set(cacheKey, { items: allNews, expires: Date.now() + TTL });
  return NextResponse.json({ data: allNews.slice(0, limitPx), timestamp: Date.now() });
}
