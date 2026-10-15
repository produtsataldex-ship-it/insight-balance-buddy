import { describe, it, expect } from 'vitest';
import { fixedVsOneOff, faviconUrl } from '@/lib/finance';
const p = { start: '2026-10-01', end: '2026-10-31' };
describe('home overview', () => {
  it('separates fixed from one-off expenses and ignores income/transfers', () => {
    expect(fixedVsOneOff([
      { type: 'expense', amount: 99, occurred_on: '2026-10-01', status: 'pending', recurring_id: 'r1' },
      { type: 'expense', amount: 32, occurred_on: '2026-10-05', status: 'paid' },
      { type: 'expense', amount: 10, occurred_on: '2026-10-06', status: 'pending' },
      { type: 'income', amount: 500, occurred_on: '2026-10-05', status: 'paid' },
      { type: 'transfer', amount: 50, occurred_on: '2026-10-05', status: 'paid' },
    ], p)).toEqual({ fixed: 99, oneOff: 32 });
  });
  it('only builds favicons for https links', () => {
    expect(faviconUrl('javascript:alert(1)')).toBeNull();
    expect(faviconUrl('https://notion.so/x')).toContain('domain=notion.so');
  });
});
