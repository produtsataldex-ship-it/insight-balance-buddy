export interface BillLike { id: string; recurring_id: string | null; status: string; occurred_on: string; amount: number | string; description: string; category_id: string | null; type: string }

/** Due date and payment are separate: a bill past due stays overdue until it is marked paid. */
export function classifyBills<T extends BillLike>(txs: T[], today: string) {
  const bills = txs.filter(t => t.recurring_id && t.type === 'expense');
  const soon = new Date(today + 'T12:00:00'); soon.setDate(soon.getDate() + 3); const soonISO = soon.toISOString().slice(0, 10);
  const upcoming = bills.filter(t => t.status !== 'paid' && t.occurred_on >= today).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  return {
    overdue: bills.filter(t => t.status !== 'paid' && t.occurred_on < today).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on)),
    upcoming,
    paid: bills.filter(t => t.status === 'paid').sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)),
    dueSoon: upcoming.filter(t => t.occurred_on <= soonISO).length,
  };
}

export function monthlyEquivalent(amount: number, frequency: string) {
  return frequency === 'weekly' ? amount * 52 / 12 : frequency === 'yearly' ? amount / 12 : amount;
}
