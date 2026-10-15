import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { Check, CircleDot, Repeat, Plus, Link2, ShoppingCart, ShoppingBag, Utensils, HeartPulse, Car, Home, Tv, GraduationCap, Zap, Wallet, Tag, type LucideIcon } from 'lucide-react';
import { useTools, useUpdateTransaction, type Transaction, type Category } from '@/lib/data';
import { faviconUrl } from '@/lib/finance';
import { formatBRL } from '@/lib/format';
import { ToolEditor } from './ToolEditor';
import { cn } from '@/lib/utils';

export const TONES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const RULES: [RegExp, LucideIcon][] = [
  [/mercad|super/i, ShoppingCart], [/compra|roupa/i, ShoppingBag], [/aliment|restaur|almo|comida/i, Utensils],
  [/saúde|saude|academ|farm/i, HeartPulse], [/transp|uber|combust|carro/i, Car], [/morad|alug|casa/i, Home],
  [/assin|stream|lazer/i, Tv], [/educa|curso/i, GraduationCap], [/conta|luz|energia|água|internet/i, Zap], [/salár|salar|renda/i, Wallet],
];
export function categoryIcon(name = ''): LucideIcon { return RULES.find(([r]) => r.test(name))?.[1] ?? Tag; }

export function IconTile({ icon: Icon, tone, className }: { icon: LucideIcon; tone: string; className?: string }) {
  return <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', className)} style={{ background: `color-mix(in oklab, ${tone} 16%, transparent)`, color: tone }}><Icon className="size-5" strokeWidth={1.8} /></span>;
}

export function FixedExpenses({ rows, categories, hide }: { rows: Transaction[]; categories: Category[]; hide: boolean }) {
  const update = useUpdateTransaction();
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const pending = rows.filter(r => r.status === 'pending').length;
  return <section className="mb-8">
    <div className="mb-3 flex items-center gap-2">
      <span className="size-2 rounded-full bg-primary" /><h2 className="text-xl">Fixos</h2><span className="text-muted-foreground">{rows.length}</span>
      {pending > 0 && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{pending} a confirmar</span>}
      <span className="ml-auto text-sm text-primary tabular-nums">{formatBRL(total, hide)}/mês</span>
    </div>
    {rows.length === 0 ? <p className="rounded-3xl border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhuma despesa fixa neste mês. Cadastre em <Link to="/movimentacoes" className="text-primary">Movimentações</Link>.</p> :
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {rows.map((r, i) => {
        const cat = categories.find(c => c.id === r.category_id); const paid = r.status === 'paid';
        return <div key={r.id} className="w-44 shrink-0 snap-start animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="surface rounded-3xl p-4">
            <div className="mb-4 flex items-start justify-between"><IconTile icon={categoryIcon(cat?.name ?? r.description)} tone={TONES[i % TONES.length]!} /><span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"><Repeat className="size-3 text-primary" />dia {Number(r.occurred_on.slice(8))}</span></div>
            <p className="break-words font-display text-xl tabular-nums">{formatBRL(Number(r.amount), hide)}</p>
            <p className="mt-1 truncate text-sm">{r.description || cat?.name || 'Despesa fixa'}</p>
            <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">{paid ? 'Pago' : 'Pendente'}<span className={cn('size-2 rounded-full', paid ? 'bg-primary' : 'bg-expense')} /></p>
          </div>
          <button type="button" disabled={paid || update.isPending} onClick={() => update.mutate({ id: r.id, patch: { status: 'paid', paid_at: new Date().toISOString() } }, { onSuccess: () => toast.success('Marcado como pago.'), onError: () => toast.error('Não foi possível atualizar.') })}
            className={cn('pressable mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm', paid ? 'border border-primary/40 bg-accent text-primary' : 'border border-dashed border-border text-muted-foreground hover:text-foreground')}>
            {paid ? <><Check className="size-4" />Pago</> : <><CircleDot className="size-4" />Marcar pago</>}
          </button>
        </div>;
      })}
    </div>}
  </section>;
}

export function ToolsStrip() {
  const tools = useTools(); const [adding, setAdding] = useState(false);
  return <section className="mb-8">
    <div className="mb-3 flex items-center justify-between"><h2 className="text-xl">Minhas ferramentas</h2><Link to="/conta" className="text-sm text-primary">Gerenciar</Link></div>
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {(tools.data ?? []).map(t => { const fav = faviconUrl(t.url); return (
        <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer nofollow" title={t.description || t.name} className="pressable flex min-w-0 flex-col items-center gap-2">
          <span className="surface grid size-14 place-items-center rounded-2xl">{fav ? <img src={fav} alt="" loading="lazy" className="size-7 rounded-md" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <Link2 className="size-6 text-primary" />}</span>
          <span className="w-full truncate text-center text-xs">{t.name}</span>
        </a>); })}
      <button type="button" onClick={() => setAdding(true)} className="pressable flex flex-col items-center gap-2" aria-label="Adicionar ferramenta">
        <span className="grid size-14 place-items-center rounded-2xl border border-dashed border-border text-muted-foreground"><Plus className="size-6" /></span>
        <span className="text-xs text-muted-foreground">Adicionar</span>
      </button>
    </div>
    {adding && <ToolEditor onClose={() => setAdding(false)} />}
  </section>;
}
