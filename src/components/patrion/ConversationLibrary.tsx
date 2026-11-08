import { useState } from 'react';
import { Link, useNavigate, useRouteContext } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useThreads, threadKeys, threadMessageOptions } from '@/lib/threads';
import { cn } from '@/lib/utils';

export function ConversationLibrary({ activeId }: { activeId?: string }) {
  const { user } = useRouteContext({ from: '/_authenticated' }); const navigate = useNavigate();
  const threads = useThreads(); const qc = useQueryClient();
  const [editing, setEditing] = useState<string>(); const [title, setTitle] = useState('');
  const [deleting, setDeleting] = useState<{ id: string; title: string }>(); const [busy, setBusy] = useState(false);
  async function rename(id: string) {
    setBusy(true);
    const { error } = await supabase.from('assistant_threads').update({ title: title.trim().slice(0, 80) || 'Conversa' }).eq('id', id).eq('user_id', user.id);
    setBusy(false);
    if (error) toast.error('Não foi possível renomear.'); else { setEditing(undefined); await qc.invalidateQueries({ queryKey: threadKeys.list(user.id) }); }
  }
  async function remove() {
    if (!deleting) return; setBusy(true);
    const { error } = await supabase.from('assistant_threads').delete().eq('id', deleting.id).eq('user_id', user.id);
    setBusy(false);
    if (error) toast.error('Não foi possível apagar.'); else { qc.removeQueries({ queryKey: threadKeys.messages(user.id, deleting.id) }); if (deleting.id === activeId) void navigate({ to: '/assistente', search: {}, replace: true }); setDeleting(undefined); await qc.invalidateQueries({ queryKey: threadKeys.list(user.id) }); }
  }
  return <div className="min-w-0">
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg">Conversas anteriores</h2><Button asChild size="icon" variant="ghost" aria-label="Nova conversa"><Link to="/assistente" search={{ fresh: true }}><Plus /></Link></Button></div>
    {threads.isPending ? <p role="status" className="text-sm text-muted-foreground">Carregando conversas…</p> : threads.error ? <div role="alert"><p className="text-sm text-destructive">Não foi possível carregar as conversas.</p><Button variant="ghost" onClick={() => void threads.refetch()}>Tentar novamente</Button></div> : !threads.data?.length ? <p className="py-8 text-sm text-muted-foreground">Nenhuma conversa ainda.</p> : <ul className="divide-y divide-border">{threads.data.map(t => <li key={t.id} className={cn('py-3', activeId === t.id && 'bg-accent')}>
      {editing === t.id ? <form className="flex gap-1" onSubmit={e => { e.preventDefault(); void rename(t.id); }}><Input autoFocus aria-label="Nome da conversa" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} /><Button size="icon" disabled={busy} aria-label="Salvar nome"><Check /></Button><Button type="button" size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditing(undefined)}><X /></Button></form> : <>
      <Link to="/assistente/$threadId" params={{ threadId: t.id }} onMouseEnter={() => void qc.prefetchQuery(threadMessageOptions(user.id, t.id))} onFocus={() => void qc.prefetchQuery(threadMessageOptions(user.id, t.id))} className="block min-w-0 px-2" aria-current={activeId === t.id ? 'page' : undefined}><p className="truncate font-medium">{t.title}</p><p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{t.preview || 'Conversa vazia'}</p><p className="mt-2 text-xs text-muted-foreground">Atualizada {new Date(t.lastActivity).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p></Link>
      <div className="mt-1 flex justify-end"><Button size="icon" variant="ghost" aria-label={`Renomear ${t.title}`} onClick={() => { setEditing(t.id); setTitle(t.title); }}><Pencil /></Button><Button size="icon" variant="ghost" aria-label={`Apagar ${t.title}`} onClick={() => setDeleting(t)}><Trash2 /></Button></div></>}
    </li>)}</ul>}
    <Dialog open={Boolean(deleting)} onOpenChange={open => { if (!open && !busy) setDeleting(undefined); }}><DialogContent><DialogHeader><DialogTitle>Apagar conversa?</DialogTitle></DialogHeader><p className="break-words text-sm text-muted-foreground">“{deleting?.title}” e suas mensagens serão removidas. Seus registros financeiros serão preservados.</p><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(undefined)}>Cancelar</Button><Button variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'Apagando…' : 'Apagar conversa'}</Button></div></DialogContent></Dialog>
  </div>;
}