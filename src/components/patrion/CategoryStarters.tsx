import { Button } from '@/components/ui/button';
import { categoryColor } from '@/lib/category-colors';
import type { Category } from '@/lib/data';
import { categoryIcon } from './HomeSections';
export function CategoryStarters({ categories, onSelect }: { categories: Category[]; onSelect: (id: string) => void }) {
  return <div className="mb-6"><p className="mb-3 text-sm text-muted-foreground">Sua primeira movimentação</p><div className="flex flex-wrap gap-2">{categories.filter(c => c.kind === 'expense').slice(0, 6).map(c => { const Icon = categoryIcon(c.name); return <Button key={c.id} variant="outline" className="pressable rounded-full" onClick={() => onSelect(c.id)}><Icon className="size-4" style={{ color: categoryColor(c) }} />{c.name}</Button>; })}</div></div>;
}