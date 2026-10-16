import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Check, X, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/patrion/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useThreads } from '@/lib/threads';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/assistente/historico')({
  head: () => pageMeta('Histórico de conversas', 'Reveja, renomeie ou apague suas conversas com o assistente do Patrion.'),
  component: History,
});

function History() {
  const threads = useThreads(); const qc = useQueryClient();
  const [editing, setEditing] = useState<string>(); const [title, setTitle] = useState('');
  async function rename(id: string) {
    const { error } = await supabase.from('assistant_threads').update({ title: title.trim().slice(0, 80) || 'Conversa' }).eq('id', id);
    if (error) toast.error('Não foi possível renomear.'); else { setEditing(undefined); void qc.invalidateQueries({ queryKey: ['assistant-threads'] }); }
  }
  async function remove(id: string, name: string) {
    if (!window.confirm(`Apagar "${name}"? As mensagens desta conversa serão removidas.`)) return;
    const { error } = await supabase.from('assistant_threads').delete().eq('id', id);
    if (error) toast.error('Não foi possível apagar.'); else { toast.success('Conversa apagada.'); void qc.invalidateQueries({ queryKey: ['assistant-threads'] }); }
  }
  return <AppShell>
    <PageHeader title="Conversas" action={<Button asChild size="sm" className="rounded-full"><Link to="/assistente"><Plus />Nova</Link></Button>} />
    {threads.isPending ? <p className="text-sm text-muted-foreground">Carregando…</p> : threads.error ? <p role="alert" className="text-destructive">Não foi possível carregar o histórico.</p> : !threads.data.length ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma conversa ainda.</p> :
      <ul className="surface divide-y divide-border overflow-hidden">{threads.data.map((t, i) => <li key={t.id} className="flex animate-fade-up items-center gap-3 px-4 py-3" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
        {editing === t.id ? <form className="flex flex-1 gap-2" onSubmit={e => { e.preventDefault(); void rename(t.id); }}><Input autoFocus aria-label="Nome da conversa" value={title} maxLength={80} onChange={e => setTitle(e.target.value)} /><Button size="icon" aria-label="Salvar nome"><Check /></Button><Button type="button" size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditing(undefined)}><X /></Button></form> : <>
          <Link to="/assistente/$threadId" params={{ threadId: t.id }} className="pressable flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary"><MessageCircle className="size-5" /></span>
            <span className="min-w-0"><span className="block truncate">{t.title}</span><span className="block text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></span>
          </Link>
          <Button size="icon" variant="ghost" aria-label={`Renomear ${t.title}`} onClick={() => { setEditing(t.id); setTitle(t.title); }}><Pencil /></Button>
          <Button size="icon" variant="ghost" aria-label={`Apagar ${t.title}`} onClick={() => void remove(t.id, t.title)}><Trash2 /></Button>
        </>}
      </li>)}</ul>}
  </AppShell>;
}
