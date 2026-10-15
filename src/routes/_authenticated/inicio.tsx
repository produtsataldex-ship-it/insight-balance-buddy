import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Eye, EyeOff, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { AppShell } from '@/components/patrion/AppShell';
import { HomeVoiceEntry } from '@/components/patrion/HomeVoiceEntry';
import { ExpenseDonut } from '@/components/patrion/ExpenseDonut';
import { FixedExpenses, ToolsStrip } from '@/components/patrion/HomeSections';
import { Button } from '@/components/ui/button';
import { TransactionEditor } from '@/components/patrion/TransactionEditor';
import { TransactionList } from '@/components/patrion/TransactionList';
import { useProfile, useTransactions, useUpdateProfile, useCategories } from '@/lib/data';
import { periodTotals, availableBalance, forecastBalance, monthPeriod, todayISO, expensesByCategory, fixedVsOneOff, type TxLike } from '@/lib/finance';
import { formatBRL, greeting } from '@/lib/format';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/inicio')({ head: () => pageMeta('Início', 'Acompanhe saldo, gastos fixos e pontuais, categorias e ferramentas no Patrion.'), component: HomePage });

function HomePage() {
  const profile = useProfile(); const txs = useTransactions(); const categories = useCategories(); const update = useUpdateProfile();
  const [offset, setOffset] = useState(0); const [adding, setAdding] = useState(false);
  const period = monthPeriod(offset); const today = todayISO(); const rows = txs.data ?? [];
  const valid = rows.map(t => ({ ...t, type: (t.type === 'income' ? 'income' : t.type === 'transfer' ? 'transfer' : 'expense') as TxLike['type'], status: (t.status === 'paid' ? 'paid' : 'pending') as TxLike['status'] }));
  const totals = periodTotals(valid, period); const hide = profile.data?.hide_values ?? false;
  const groups = expensesByCategory(valid, period); const split = fixedVsOneOff(valid, period);
  const fixedRows = rows.filter(t => t.recurring_id && t.type === 'expense' && t.occurred_on >= period.start && t.occurred_on <= period.end).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  const empty = totals.income + split.fixed + split.oneOff === 0;
  const stats: [string, number, string][] = [['Entrou', totals.income, 'bg-income'], ['Fixos', split.fixed, 'bg-chart-1'], ['Pontuais', split.oneOff, 'bg-expense']];

  return <AppShell>
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="min-w-0">
        <p className="truncate font-display text-2xl">{greeting()}{profile.data?.display_name ? `, ${profile.data.display_name.split(' ')[0]}` : ''}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button aria-label="Mês anterior" className="pressable rounded-full p-1" onClick={() => setOffset(offset - 1)}><ChevronLeft className="size-4" /></button>
          <span className="capitalize">{new Date(period.start + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          <button aria-label="Próximo mês" className="pressable rounded-full p-1" onClick={() => setOffset(offset + 1)}><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <Button size="icon" variant="outline" className="size-12 rounded-2xl" title={hide ? 'Mostrar valores' : 'Ocultar valores'} aria-label={hide ? 'Mostrar valores' : 'Ocultar valores'} onClick={() => update.mutate({ hide_values: !hide })}>{hide ? <EyeOff /> : <Eye />}</Button>
    </header>
    {txs.isPending ? <p className="py-8 text-muted-foreground">Carregando suas finanças…</p> : txs.error ? <p role="alert" className="py-8 text-destructive">Não foi possível carregar suas finanças.</p> : <>
      <section className="mb-6 animate-fade-up text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo</p>
        <p className="mt-2 break-words font-display text-5xl tabular-nums">{formatBRL(availableBalance(valid, today), hide)}</p>
        <div className="mt-6 flex h-1.5 gap-1.5" aria-hidden="true">
          {empty ? <span className="flex-1 rounded-full bg-muted" /> : stats.map(([l, v, c]) => v > 0 && <span key={l} className={`rounded-full transition-all duration-500 ${c}`} style={{ flex: v }} />)}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(([l, v, c]) => <div key={l} className="min-w-0"><p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${c}`} />{l}</p><p className="mt-1 truncate font-medium tabular-nums">{formatBRL(v, hide)}</p></div>)}
        </div>
        <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs"><CalendarClock className="size-4 shrink-0 text-primary" /><span className="truncate">Previsto no fim do mês · estimativa</span><span className="font-medium text-primary tabular-nums">{formatBRL(forecastBalance(valid, today, period.end), hide)}</span></p>
      </section>
      <HomeVoiceEntry />
      <div className="mb-8 flex justify-center"><Button variant="outline" className="rounded-full" onClick={() => setAdding(true)}><Plus />Adicionar manualmente</Button></div>
      <FixedExpenses rows={fixedRows} categories={categories.data ?? []} hide={hide} />
      <section className="mb-8"><h2 className="mb-3 text-xl">Gastos por categoria</h2><ExpenseDonut groups={groups.map(g => ({ ...g, name: categories.data?.find(c => c.id === g.category_id)?.name ?? 'Sem categoria' }))} total={totals.expense} hide={hide} /></section>
      <ToolsStrip />
      <section className="mb-8"><div className="mb-2 flex items-center justify-between"><h2 className="text-xl">Movimentações recentes</h2><Button asChild variant="link" size="sm"><Link to="/movimentacoes">Ver todas</Link></Button></div><TransactionList rows={rows.filter(t => t.occurred_on >= period.start && t.occurred_on <= period.end).slice(0, 5)} hide={hide} /></section>
    </>}
    {adding && <TransactionEditor onClose={() => setAdding(false)} />}
  </AppShell>;
}
