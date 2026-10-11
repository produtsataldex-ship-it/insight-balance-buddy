import { describe, expect, it } from "vitest";
import {
  availableBalance,
  forecastBalance,
  isSafeHttpsUrl,
  periodTotals,
  splitInstallments,
  addMonths,
  type TxLike,
} from "@/lib/finance";

const p = { start: "2026-10-01", end: "2026-10-31" };
const txs: TxLike[] = [
  { type: "income", amount: 2500, occurred_on: "2026-10-05", status: "paid" },
  { type: "expense", amount: 32, occurred_on: "2026-10-06", status: "paid" },
  { type: "expense", amount: 120, occurred_on: "2026-10-07", status: "paid" },
  { type: "transfer", amount: 500, occurred_on: "2026-10-08", status: "paid" },
  { type: "expense", amount: 300, occurred_on: "2026-10-20", status: "pending" },
  { type: "expense", amount: 50, occurred_on: "2026-09-30", status: "paid" },
];

describe("finance rules", () => {
  it("transfers are not counted as income or expense", () => {
    const t = periodTotals(txs, p);
    expect(t.income).toBe(2500);
    expect(t.expense).toBe(152);
    expect(t.transfers).toBe(500);
  });

  it("pending expenses do not reduce the available balance", () => {
    expect(availableBalance(txs, "2026-10-10")).toBe(2298);
  });

  it("forecast subtracts known pending commitments up to period end", () => {
    expect(forecastBalance(txs, "2026-10-10", "2026-10-31")).toBe(1998);
  });

  it("installments split exact cents with remainder on the last", () => {
    expect(splitInstallments(100, 3)).toEqual([33.33, 33.33, 33.34]);
  });

  it("monthly dates clamp to the last day of short months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("only https links are accepted for tools", () => {
    expect(isSafeHttpsUrl("https://docs.google.com/x")).toBe(true);
    expect(isSafeHttpsUrl("http://site.com")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
  });
});
