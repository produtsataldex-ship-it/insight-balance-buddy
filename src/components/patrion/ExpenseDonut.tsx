import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatBRL } from '@/lib/format';
import { IconTile, TONES, categoryIcon } from './HomeSections';

export function ExpenseDonut({ groups, total, hide }: { groups: { name: string; total: number; category_id: string }[]; total: number; hide: boolean }) {
  return <div className="surface rounded-3xl p-5">
    <div className="relative mx-auto h-56 w-56" role="img" aria-label={hide ? 'Despesas por categoria, valores ocultos' : `Despesas do período: ${formatBRL(total)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart><Pie data={total > 0 ? groups : [{ name: 'Sem despesas', total: 1 }]} dataKey="total" innerRadius={86} outerRadius={104} startAngle={90} endAngle={-270} paddingAngle={total > 0 && groups.length > 1 ? 4 : 0} cornerRadius={10} stroke="none" isAnimationActive={false}>
          {total > 0 ? groups.map((g, i) => <Cell key={g.category_id} fill={TONES[i % TONES.length]} />) : <Cell fill="var(--muted)" />}
        </Pie></PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center"><span className="w-full break-words font-display text-2xl">{formatBRL(total, hide)}</span><span className="mt-1 text-xs text-muted-foreground">em gastos</span></div>
    </div>
    {groups.length ? <ul className="mt-5 space-y-3">{groups.map((g, i) => <li key={g.category_id} className="flex items-center gap-3 text-sm">
      <IconTile icon={categoryIcon(g.name)} tone={TONES[i % TONES.length]!} />
      <span className="min-w-0 flex-1 truncate text-base">{g.name}</span>
      <span className="text-muted-foreground tabular-nums">{hide ? '•••' : `${Math.round(g.total / total * 100)}%`}</span>
      <span className="w-24 text-right font-medium tabular-nums">{formatBRL(g.total, hide)}</span>
    </li>)}</ul> : <p className="mt-4 text-center text-sm text-muted-foreground">Nenhuma despesa paga neste período.</p>}
  </div>;
}
