// Pure financial calculations — shared by UI, assistant and tests.

export type TxType = "income" | "expense" | "transfer";
export type TxStatus = "paid" | "pending";

export interface TxLike {
  type: TxType;
  amount: number | string;
  occurred_on: string; // YYYY-MM-DD
  status: TxStatus;
  category_id?: string | null;
}

export interface Period {
  start: string;
  end: string;
}

const n = (v: number | string) => Math.round(Number(v) * 100) / 100;
const round = (v: number) => Math.round(v * 100) / 100;

export function inPeriod(date: string, p: Period) {
  return date >= p.start && date <= p.end;
}

/** Transfers never count as income or expense. */
export function periodTotals(txs: TxLike[], p: Period) {
  let income = 0,
    expense = 0,
    pendingIncome = 0,
    pendingExpense = 0,
    transfers = 0;
  for (const t of txs) {
    if (!inPeriod(t.occurred_on, p)) continue;
    const a = n(t.amount);
    if (t.type === "transfer") {
      transfers += a;
      continue;
    }
    if (t.status === "paid") {
      if (t.type === "income") income += a;
      else expense += a;
    } else {
      if (t.type === "income") pendingIncome += a;
      else pendingExpense += a;
    }
  }
  return {
    income: round(income),
    expense: round(expense),
    net: round(income - expense),
    pendingIncome: round(pendingIncome),
    pendingExpense: round(pendingExpense),
    transfers: round(transfers),
  };
}

/** Available balance: all paid income minus all paid expenses up to `today`. */
export function availableBalance(txs: TxLike[], today: string) {
  let b = 0;
  for (const t of txs) {
    if (t.type === "transfer" || t.status !== "paid" || t.occurred_on > today) continue;
    b += t.type === "income" ? n(t.amount) : -n(t.amount);
  }
  return round(b);
}

/**
 * Estimated balance at the end of the period: current available balance
 * plus pending income minus pending expenses dated up to the period end
 * (including overdue pending items), plus paid items dated in the future.
 */
export function forecastBalance(txs: TxLike[], today: string, periodEnd: string) {
  let b = availableBalance(txs, today);
  for (const t of txs) {
    if (t.type === "transfer" || t.occurred_on > periodEnd) continue;
    const future = t.occurred_on > today;
    if (t.status === "pending" || future) {
      b += t.type === "income" ? n(t.amount) : -n(t.amount);
    }
  }
  return round(b);
}

export function expensesByCategory(txs: TxLike[], p: Period) {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "expense" || t.status !== "paid" || !inPeriod(t.occurred_on, p)) continue;
    const k = t.category_id ?? "none";
    map.set(k, round((map.get(k) ?? 0) + n(t.amount)));
  }
  return [...map.entries()].map(([category_id, total]) => ({ category_id, total })).sort((a, b) => b.total - a.total);
}

/** Split a total into N installments; the last one absorbs rounding cents. */
export function splitInstallments(total: number, count: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? cents - base * (count - 1) : base) / 100);
}

export function addMonths(iso: string, months: number) {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export function todayISO(date = new Date()) {
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function monthPeriod(offset = 0, ref = new Date()): Period {
  const y = ref.getFullYear();
  const m = ref.getMonth() + offset;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { start: todayISO(start), end: todayISO(end) };
}

/** Daily cumulative net for the period, starting at the balance before it. */
export function balanceSeries(txs: TxLike[], p: Period) {
  let opening = 0;
  const daily = new Map<string, number>();
  for (const t of txs) {
    if (t.type === "transfer" || t.status !== "paid") continue;
    const v = t.type === "income" ? n(t.amount) : -n(t.amount);
    if (t.occurred_on < p.start) opening += v;
    else if (t.occurred_on <= p.end) daily.set(t.occurred_on, (daily.get(t.occurred_on) ?? 0) + v);
  }
  const out: { date: string; balance: number }[] = [];
  let run = opening;
  const d = new Date(p.start + "T12:00:00");
  const end = new Date(p.end + "T12:00:00");
  while (d <= end) {
    const k = todayISO(d);
    run += daily.get(k) ?? 0;
    out.push({ date: k, balance: round(run) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function isSafeHttpsUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Paid + pending expenses in the period split into fixed (from a recurring rule) and one-off. */
export function fixedVsOneOff(txs: (TxLike & { recurring_id?: string | null })[], p: Period) {
  let fixed = 0, oneOff = 0;
  for (const t of txs) {
    if (t.type !== "expense" || !inPeriod(t.occurred_on, p)) continue;
    if (t.recurring_id) fixed += n(t.amount); else if (t.status === "paid") oneOff += n(t.amount);
  }
  return { fixed: round(fixed), oneOff: round(oneOff) };
}

/** Favicon for a saved https tool link; never fetched for unsafe URLs. */
export function faviconUrl(url: string) {
  if (!isSafeHttpsUrl(url)) return null;
  return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;
}
