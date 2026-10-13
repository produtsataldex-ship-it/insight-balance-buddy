import { describe, expect, it } from 'vitest';
import { safeProposal } from '@/lib/assistant-schema';

const proposal = { type: 'expense', amount: 32, description: 'Uber', occurred_on: '2026-10-13', category_id: null, status: 'paid' };
describe('Assistant safety', () => {
  it('accepts the stated 32 reais Uber expense', () => {
    expect(safeProposal(proposal)?.amount).toBe(32);
  });
  it('does not accept an amount the assistant could not interpret', () => {
    expect(safeProposal({ ...proposal, amount: null })).toBeNull();
  });
  it('requires a description before saving an ambiguous expense', () => {
    expect(safeProposal({ ...proposal, amount: 50, description: null })).toBeNull();
  });
  it('rejects impossible calendar dates', () => {
    expect(safeProposal({ ...proposal, occurred_on: '2026-02-30' })).toBeNull();
  });
});