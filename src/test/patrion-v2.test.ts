import { describe, expect, it } from 'vitest';
import { CATEGORY_COLORS, hue, shouldShowWelcome } from '@/lib/category-colors';
import { assistantOutputSchema } from '@/lib/assistant-schema';
import { availableBalance } from '@/lib/finance';

describe('Patrion v2 rules', () => {
  it('category palette has no green hues', () => {
    for (const c of CATEGORY_COLORS) { const h = hue(c); if (h !== null) expect(h < 75 || h > 170).toBe(true); }
  });
  it('welcome shows on first access', () => {
    expect(shouldShowWelcome({ welcome_seen_at: null, last_seen_at: null })).toBe(true);
  });
  it('welcome shows again after 7 days away', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    expect(shouldShowWelcome({ welcome_seen_at: '2026-01-01', last_seen_at: '2026-10-09T12:00:00Z' }, now)).toBe(true);
    expect(shouldShowWelcome({ welcome_seen_at: '2026-01-01', last_seen_at: '2026-10-12T12:00:00Z' }, now)).toBe(false);
  });
  it('assistant suggestions are limited to 3', () => {
    const base = { reply: 'ok', proposal: null, table: null };
    expect(assistantOutputSchema.safeParse({ ...base, suggestions: ['a', 'b', 'c'] }).success).toBe(true);
    expect(assistantOutputSchema.safeParse({ ...base, suggestions: ['a', 'b', 'c', 'd'] }).success).toBe(false);
  });
  it('consolidated balance ignores transfers and pending items', () => {
    const txs = [
      { type: 'income' as const, amount: 1000, status: 'paid' as const, occurred_on: '2026-10-01', category_id: null },
      { type: 'expense' as const, amount: 200, status: 'paid' as const, occurred_on: '2026-10-02', category_id: null },
      { type: 'transfer' as const, amount: 500, status: 'paid' as const, occurred_on: '2026-10-03', category_id: null },
      { type: 'expense' as const, amount: 300, status: 'pending' as const, occurred_on: '2026-10-04', category_id: null },
    ];
    expect(availableBalance(txs as never, '2026-10-16')).toBe(800);
  });
});
