import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { formatBRL } from '@/lib/format';

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function ExpenseDonut({ groups, total, hide }: { groups: { name: string; total: number; category_id: string }[]; total: number; hide: boolean }) {
  return <div className="grid items-center gap-6 sm:grid-cols-[240px_1fr]">
    <div className="relative mx-auto h-60 w-60" role="img" aria-label={hide ? 'Despesas por categoria, valores ocultos' : `Despesas do período: ${formatBRL(total)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart><Pie data={total > 0 ? groups : [{ name: 'Sem despesas', total: 1 }]} dataKey="total" innerRadius={91} outerRadius={111} startAngle={90} endAngle={-270} paddingAngle={total > 0 && groups.length > 1 ? 3 : 0} cornerRadius={4} stroke="none" isAnimationActive={false}>
          {total > 0 ? groups.map((group, i) => <Cell key={group.category_id} fill={colors[i % colors.length]}/>) : <Cell fill="var(--muted)"/>}
        </Pie></PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center"><span className="text-xs text-muted-foreground">Despesas pagas</span><span className="mt-2 w-full break-words font-display text-2xl">{formatBRL(total, hide)}</span></div>
    </div>
    <div>{groups.length ? <ul className="space-y-4">{groups.map((group, i) => <li key={group.category_id} className="flex items-center gap-3 text-sm"><svg className="size-2 shrink-0" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill={colors[i % colors.length]}/></svg><span className="min-w-0 flex-1 break-words">{group.name}</span><span className="text-muted-foreground">{hide ? '•••' : `${Math.round(group.total / total * 100)}%`}</span><span className="text-right tabular-nums">{formatBRL(group.total, hide)}</span></li>)}</ul> : <p className="text-center text-sm text-muted-foreground sm:text-left">Nenhuma despesa paga neste período.</p>}</div>
  </div>;
}