import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSaveTool, type UserTool } from '@/lib/data';
import { isSafeHttpsUrl } from '@/lib/finance';
import { Link2, Calculator, FileSpreadsheet, Wallet } from 'lucide-react';

export const TOOL_ICONS = { link: Link2, calculator: Calculator, spreadsheet: FileSpreadsheet, wallet: Wallet };
export function ToolEditor({ tool, onClose }: { tool?: UserTool; onClose: () => void }) {
  const [name, setName] = useState(tool?.name ?? '');
  const [url, setUrl] = useState(tool?.url ?? '');
  const [description, setDescription] = useState(tool?.description ?? '');
  const [icon, setIcon] = useState(tool?.icon ?? 'link');
  const save = useSaveTool();
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogTitle>{tool ? 'Editar ferramenta' : 'Nova ferramenta'}</DialogTitle><DialogDescription>Minhas ferramentas</DialogDescription><form className="space-y-4" onSubmit={async e => {
    e.preventDefault();
    if (!isSafeHttpsUrl(url)) { toast.error('Informe um endereço HTTPS válido.'); return; }
    try { await save.mutateAsync({ id: tool?.id, name: name.trim(), description: description.trim(), url: url.trim(), icon }); toast.success('Ferramenta salva.'); onClose(); } catch { toast.error('Não foi possível salvar a ferramenta.'); }
  }}><label className="block text-sm">Nome<Input className="mt-2" value={name} onChange={e => setName(e.target.value)} required maxLength={100}/></label><label className="block text-sm">Endereço<Input className="mt-2" type="url" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} required/></label><label className="block text-sm">Descrição<Input className="mt-2" value={description} onChange={e => setDescription(e.target.value)} maxLength={300}/></label><div className="flex gap-2">{Object.entries(TOOL_ICONS).map(([key, Icon]) => <Button type="button" key={key} size="icon" variant={icon === key ? 'default' : 'outline'} aria-label={`Ícone ${key}`} title={key} onClick={() => setIcon(key)}><Icon/></Button>)}</div><Button className="w-full" disabled={save.isPending}>Salvar ferramenta</Button></form></DialogContent></Dialog>;
}