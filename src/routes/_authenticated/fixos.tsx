import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CalendarDays, Pencil, Plus, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/patrion/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCategories, useDeleteRecurring, useRecurring, useSaveRecurring, useTransactions, useUpdateTransaction, generateRecurring, type Recurring } from '@/lib/data';
import { formatBRL } from '@/lib/format';
import { todayISO, monthPeriod } from '@/lib/finance';
import { categoryColor } from '@/lib/category-colors';
import { classifyBills, monthlyEquivalent } from '@/lib/bills';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/fixos')({
  head: () => pageMeta('Despesas fixas', 'Cadastre contas recorrentes, acompanhe vencimentos e marque pagamentos no Patrion.'),
  component: FixedPage,
});

const FREQ: Record<string, string> = { monthly: 'Mensal', weekly: 'Semanal', yearly: 'Anual' };
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

function FixedPage() {
  const recurring = useRecurring(); const txs = useTransactions(); const categories = useCategories(); const update = useUpdateTransaction(); const remove = useDeleteRecurring();
  const [editing, setEditing] = useState<Recurring | null | undefined>(undefined);
  useEffect(() => { void generateRecurring(); }, []);
  const today = todayISO(); const period = monthPeriod();
  const bills = useMemo(() => classifyBills(txs.data ?? [], today), [txs.data, today]);
  const monthlyTotal = (recurring.data ?? []).filter(r => r.active).reduce((s, r) => s + monthlyEquivalent(Number(r.amount), r.frequency), 0);
  const monthPending = bills.upcoming.filter(t => t.occurred_on <= period.end).reduce((s, t) => s + Number(t.amount), 0) + bills.overdue.reduce((s, t) => s + Number(t.amount), 0);
  const cat = (id: string | null) => categories.data?.find(c => c.id === id);
  const pay = (id: string) => update.mutate({ id, patch: { status: 'paid', paid_at: new Date().toISOString() } }, { onSuccess: () => toast.success('Pagamento registrado.'), onError: () => toast.error('Não foi possível registrar.') });

  const Row = ({ t, kind }: { t: (typeof bills.upcoming)[number]; kind: 'overdue' | 'upcoming' | 'paid' }) => <li className="flex items-center gap-3 rounded-2xl bg-card p-3 animate-fade-up">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${categoryColor(cat(t.category_id))} 22%, transparent)`, color: categoryColor(cat(t.category_id)) }}><Receipt className="size-5" /></span>
    <div className="min-w-0 flex-1"><p className="truncate font-medium">{t.description}</p><p className={`text-xs ${kind === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>{kind === 'paid' ? `Pago · venceu ${fmtDate(t.occurred_on)}` : kind === 'overdue' ? `Vencida em ${fmtDate(t.occurred_on)}` : `Vence ${fmtDate(t.occurred_on)}`}</p></div>
    <p className="tabular-nums">{formatBRL(Number(t.amount))}</p>
    {kind !== 'paid' && <Button size="sm" variant={kind === 'overdue' ? 'gold' : 'outline'} className="rounded-full" disabled={update.isPending} onClick={() => pay(t.id)}><Check />Pagar</Button>}
  </li>;

  return <AppShell>
    <PageHeader title="Despesas fixas" action={<Button size="icon" aria-label="Nova despesa fixa" title="Nova despesa fixa" onClick={() => setEditing(null)}><Plus /></Button>} />
    <Button asChild variant="link" className="-mt-4 mb-4 px-0"><Link to="/movimentacoes"><ArrowLeft />Movimentações</Link></Button>

    <div className="mb-6 grid grid-cols-3 gap-2">
      {[['Total mensal', monthlyTotal], ['A pagar no mês', monthPending], ['Vencidas', bills.overdue.reduce((s, t) => s + Number(t.amount), 0)]].map(([l, v]) =>
        <div key={l as string} className="surface rounded-2xl p-3"><p className="text-[11px] text-muted-foreground">{l}</p><p className="mt-1 font-display text-lg tabular-nums">{formatBRL(v as number)}</p></div>)}
    </div>

    {bills.overdue.length > 0 && <p role="alert" className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/40 p-3 text-sm text-destructive"><AlertTriangle className="size-4" />Você tem {bills.overdue.length} conta(s) vencida(s) aguardando pagamento.</p>}
    {bills.dueSoon > 0 && <p className="mb-4 text-sm text-primary">Lembrete: {bills.dueSoon} conta(s) vencem nos próximos 3 dias.</p>}

    <h2 className="mb-2 text-lg">Minhas despesas fixas</h2>
    {recurring.isPending ? <p className="text-muted-foreground">Carregando…</p> : recurring.error ? <p role="alert" className="text-destructive">Não foi possível carregar.</p> :
      !recurring.data?.length ? <div className="surface mb-6 rounded-2xl p-5 text-center"><p className="text-muted-foreground">Cadastre contas como aluguel, internet, energia ou Netflix para acompanhar os vencimentos.</p><Button className="mt-4" onClick={() => setEditing(null)}><Plus />Adicionar primeira conta</Button></div> :
      <ul className="mb-8 space-y-2">{(recurring.data ?? []).map(r => <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: categoryColor(cat(r.category_id)) }} />
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{FREQ[r.frequency] ?? r.frequency} · desde {fmtDate(r.start_date)}{cat(r.category_id) ? ` · ${cat(r.category_id)?.name}` : ''}{!r.active ? ' · pausada' : ''}</p></div>
        <p className="tabular-nums">{formatBRL(Number(r.amount))}</p>
        <Button size="icon" variant="ghost" aria-label={`Editar ${r.name}`} onClick={() => setEditing(r)}><Pencil /></Button>
        <Button size="icon" variant="ghost" aria-label={`Excluir ${r.name}`} onClick={() => { if (window.confirm(`Excluir "${r.name}"? Lançamentos já pagos são mantidos.`)) remove.mutate(r.id, { onSuccess: () => toast.success('Despesa fixa excluída.'), onError: () => toast.error('Não foi possível excluir.') }); }}><Trash2 /></Button>
      </li>)}</ul>}

    {bills.overdue.length > 0 && <Section title="Vencidas">{bills.overdue.map(t => <Row key={t.id} t={t} kind="overdue" />)}</Section>}
    <Section title="Próximas contas" icon>{bills.upcoming.length ? bills.upcoming.slice(0, 12).map(t => <Row key={t.id} t={t} kind="upcoming" />) : <p className="text-sm text-muted-foreground">Nenhum vencimento nos próximos 60 dias.</p>}</Section>
    <Section title="Histórico de pagamentos">{bills.paid.length ? bills.paid.slice(0, 12).map(t => <Row key={t.id} t={t} kind="paid" />) : <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>}</Section>
    {editing !== undefined && <RecurringEditor item={editing} onClose={() => setEditing(undefined)} />}
  </AppShell>;
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: boolean }) {
  return <section className="mb-8"><h2 className="mb-2 flex items-center gap-2 text-lg">{icon && <CalendarDays className="size-4 text-primary" />}{title}</h2><ul className="space-y-2">{children}</ul></section>;
}

function RecurringEditor({ item, onClose }: { item: Recurring | null; onClose: () => void }) {
  const categories = useCategories(); const save = useSaveRecurring();
  const [name, setName] = useState(item?.name ?? ''); const [amount, setAmount] = useState(item ? String(item.amount) : '');
  const [frequency, setFrequency] = useState(item?.frequency ?? 'monthly'); const [start, setStart] = useState(item?.start_date ?? todayISO());
  const [category, setCategory] = useState(item?.category_id ?? ''); const [active, setActive] = useState(item?.active ?? true); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const value = Number(amount.replace(',', '.'));
    if (!name.trim() || !(value > 0)) { setError('Informe nome e um valor maior que zero.'); return; }
    try { await save.mutateAsync({ ...(item ? { id: item.id } : {}), values: { name: name.trim().slice(0, 120), amount: Math.round(value * 100) / 100, frequency, start_date: start, category_id: category || null, active } }); toast.success('Despesa fixa salva.'); onClose(); }
    catch { setError('Não foi possível salvar. Tente novamente.'); }
  }
  const select = 'h-11 w-full rounded-xl border border-input bg-card px-3 text-sm';
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl">
    <DialogTitle>{item ? 'Editar despesa fixa' : 'Nova despesa fixa'}</DialogTitle>
    <form onSubmit={submit} className="space-y-3">
      <Input aria-label="Nome" placeholder="Ex.: Internet, Aluguel, Netflix" value={name} onChange={e => setName(e.target.value)} required />
      <Input aria-label="Valor" inputMode="decimal" placeholder="Valor (R$)" value={amount} onChange={e => setAmount(e.target.value)} required />
      <label className="block text-xs text-muted-foreground">Primeiro vencimento<Input type="date" className="mt-1" value={start} onChange={e => setStart(e.target.value)} required /></label>
      <select aria-label="Periodicidade" className={select} value={frequency} onChange={e => setFrequency(e.target.value)}>{Object.entries(FREQ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select aria-label="Categoria" className={select} value={category} onChange={e => setCategory(e.target.value)}><option value="">Sem categoria</option>{categories.data?.filter(c => c.kind === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={active} onChange={e => setActive(e.target.checked)} />Ativa (gera próximos vencimentos)</label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar'}</Button>
    </form>
  </DialogContent></Dialog>;
}
