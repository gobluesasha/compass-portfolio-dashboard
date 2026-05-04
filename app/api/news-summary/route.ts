import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export type NewsSummary = {
  symbol: string;
  bullets: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  generatedAt: number;
};

// 1-hour in-memory cache per symbol
const cache = new Map<string, { summary: NewsSummary; expires: number }>();
const TTL = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let body: { symbol: string; headlines: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { symbol, headlines } = body;
  if (!symbol || !Array.isArray(headlines) || headlines.length === 0) {
    return NextResponse.json({ error: 'symbol and headlines required' }, { status: 400 });
  }

  const cacheKey = `${symbol}_${headlines.slice(0, 5).join('|').slice(0, 200)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ data: cached.summary });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a portfolio analyst at Compass Capital Management reviewing recent news for ${symbol}.

Headlines (${headlines.length} items):
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Provide a concise investment-relevant summary. Respond ONLY with valid JSON in this exact format:
{
  "bullets": ["...", "...", "..."],
  "sentiment": "positive" | "neutral" | "negative" | "mixed"
}

Rules for bullets:
- Exactly 3 bullets, each under 120 characters
- Focus on: earnings/revenue developments, analyst actions, product news, macro risks
- Be specific — name numbers, grades, products when relevant
- Write from an investor's perspective`;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (msg.content[0] as any)?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]) as { bullets: string[]; sentiment: string };
    const summary: NewsSummary = {
      symbol,
      bullets: (parsed.bullets ?? []).slice(0, 3),
      sentiment: (['positive', 'neutral', 'negative', 'mixed'].includes(parsed.sentiment)
        ? parsed.sentiment : 'neutral') as NewsSummary['sentiment'],
      generatedAt: Date.now(),
    };

    cache.set(cacheKey, { summary, expires: Date.now() + TTL });
    return NextResponse.json({ data: summary });
  } catch (err) {
    console.error('News summary error:', err);
    return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 });
  }
}
