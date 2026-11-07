import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/patrion/AppShell';
import { ToolsStrip } from '@/components/patrion/HomeSections';
import { Button } from '@/components/ui/button';
import { TransactionEditor } from '@/components/patrion/TransactionEditor';
import { useProfile, useTransactions, useUpdateProfile, useCategories } from '@/lib/data';
import { availableBalance, forecastBalance, monthPeriod, todayISO, type TxLike } from '@/lib/finance';
import { greeting } from '@/lib/format';
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
  const hide = profile.data?.hide_values ?? false;

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
      {!rows.length && <CategoryStarters categories={categories.data ?? []} onSelect={id => { setInitialCategory(id); setAdding(true); }} />}
      <ToolsStrip />
    </>}
    {adding && <TransactionEditor initialCategory={initialCategory} onClose={() => setAdding(false)} />}
  </AppShell>;
}
