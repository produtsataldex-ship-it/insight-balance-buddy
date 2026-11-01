import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/patrion/AppShell';
import { ExpenseDonut } from '@/components/patrion/ExpenseDonut';
import { FixedExpenses, ToolsStrip } from '@/components/patrion/HomeSections';
import { Button } from '@/components/ui/button';
import { TransactionEditor } from '@/components/patrion/TransactionEditor';
import { TransactionList } from '@/components/patrion/TransactionList';
import { useProfile, useTransactions, useUpdateProfile, useCategories } from '@/lib/data';
import { periodTotals, availableBalance, forecastBalance, monthPeriod, todayISO, expensesByCategory, fixedVsOneOff, type TxLike } from '@/lib/finance';
import { formatBRL, greeting } from '@/lib/format';
import { HomeBalance } from '@/components/patrion/HomeBalance';
import { CategoryStarters } from '@/components/patrion/CategoryStarters';
import { shouldShowWelcome } from '@/lib/category-colors';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/inicio')({ head: () => pageMeta('Início', 'Acompanhe saldo, gastos fixos e pontuais, categorias e ferramentas no Patrion.'), component: HomePage });

function HomePage() {
  const profile = useProfile(); const txs = useTransactions(); const categories = useCategories(); const update = useUpdateProfile();
  const [initialCategory, setInitialCategory] = useState<string>(); const [welcome, setWelcome] = useState(false); const checkedWelcome = useRef(false);
  useEffect(() => { if (!profile.data || checkedWelcome.current) return; checkedWelcome.current = true; setWelcome(shouldShowWelcome(profile.data)); update.mutate({ last_seen_at: new Date().toISOString() }); }, [profile.data]);
  const [offset, setOffset] = useState(0); const [adding, setAdding] = useState(false);
  const period = monthPeriod(offset); const today = todayISO(); const rows = txs.data ?? [];
  const valid = rows.map(t => ({ ...t, type: (t.type === 'income' ? 'income' : t.type === 'transfer' ? 'transfer' : 'expense') as TxLike['type'], status: (t.status === 'paid' ? 'paid' : 'pending') as TxLike['status'] }));
  const totals = periodTotals(valid, period); const hide = profile.data?.hide_values ?? false;
  const groups = expensesByCategory(valid, period); const split = fixedVsOneOff(valid, period);
  const fixedRows = rows.filter(t => t.recurring_id && t.type === 'expense' && t.occurred_on >= period.start && t.occurred_on <= period.end).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
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
    {welcome && <aside className="mb-5 flex items-center gap-3 border-y border-border py-4"><div className="flex-1"><p className="font-medium">Bem-vindo ao Patrion</p><p className="mt-1 text-sm text-muted-foreground">Fale um gasto, acompanhe seu saldo ou converse com seu assistente.</p></div><Button variant="ghost" onClick={() => { update.mutate({ welcome_seen_at: new Date().toISOString() }); setWelcome(false); }}>Entendi</Button></aside>}
    {txs.isPending ? <p className="py-8 text-muted-foreground">Carregando suas finanças…</p> : txs.error ? <p role="alert" className="py-8 text-destructive">Não foi possível carregar suas finanças.</p> : <>
      <HomeBalance balance={availableBalance(valid, today)} forecast={forecastBalance(valid, today, period.end)} hide={hide} onManual={() => { setInitialCategory(undefined); setAdding(true); }} />
      <div className="mb-6 grid grid-cols-3 gap-2">{stats.map(([l, v, c]) => <div key={l} className="min-w-0 text-center"><p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${c}`} />{l}</p><p className="mt-1 truncate font-medium tabular-nums">{formatBRL(v, hide)}</p></div>)}</div>
      {!rows.length && <CategoryStarters categories={categories.data ?? []} onSelect={id => { setInitialCategory(id); setAdding(true); }} />}
      <FixedExpenses rows={fixedRows} categories={categories.data ?? []} hide={hide} />
      <section className="mb-8"><h2 className="mb-3 text-xl">Gastos por categoria</h2><ExpenseDonut groups={groups.map(g => ({ ...g, color: categories.data?.find(c => c.id === g.category_id)?.color, name: categories.data?.find(c => c.id === g.category_id)?.name ?? 'Sem categoria' }))} total={totals.expense} hide={hide} /></section>
      <ToolsStrip />
      <section className="mb-8"><div className="mb-2 flex items-center justify-between"><h2 className="text-xl">Movimentações recentes</h2><Button asChild variant="link" size="sm"><Link to="/movimentacoes">Ver todas</Link></Button></div><TransactionList rows={rows.filter(t => t.occurred_on >= period.start && t.occurred_on <= period.end).slice(0, 5)} hide={hide} /></section>
    </>}
    {adding && <TransactionEditor initialCategory={initialCategory} onClose={() => setAdding(false)} />}
  </AppShell>;
}
