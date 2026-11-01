import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORY_COLORS } from '@/lib/category-colors';
export function CategoryPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return <div className="col-span-2 flex flex-wrap gap-2" role="group" aria-label="Cor da categoria">{CATEGORY_COLORS.map((color, i) => <Button key={color} type="button" size="icon" variant="outline" className="rounded-full" aria-label={`Cor ${i + 1}`} aria-pressed={value === color} onClick={() => onChange(color)}><span className="grid size-6 place-items-center rounded-full" style={{ background: color }}>{value === color && <Check className="size-4 text-background" />}</span></Button>)}</div>;
}