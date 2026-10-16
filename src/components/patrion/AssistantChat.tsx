import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, Check, History, Mic, Pencil, Plus, RotateCcw, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { AppShell } from './AppShell';
import { PatrionLogo } from './PatrionLogo';
import { AssistantConfirmation } from './AssistantConfirmation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { askAssistant, confirmAssistantTransaction } from '@/lib/assistant.functions';
import { safeProposal, safeSuggestions, safeTable, type TransactionProposal } from '@/lib/assistant-schema';
import { useCategories, useTransactions } from '@/lib/data';
import { useThreadMessages } from '@/lib/threads';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { formatBRL } from '@/lib/format';
import { todayISO } from '@/lib/finance';
import { categoryColor } from '@/lib/category-colors';

const STARTERS = ['Quanto tenho disponível?', 'Qual foi minha maior despesa no mês passado?', 'Quais contas preciso pagar esta semana?'];
const TYPE_LABEL = { expense: 'Despesa', income: 'Receita', transfer: 'Transferência' } as const;
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function metaOf(meta: unknown) { return meta && typeof meta === 'object' && !Array.isArray(meta) ? meta as Record<string, unknown> : {}; }

export function AssistantChat({ threadId, initial }: { threadId: string; initial?: string | undefined }) {
  const messages = useThreadMessages(threadId); const transactions = useTransactions(); const categories = useCategories();
  const ask = useServerFn(askAssistant); const confirm = useServerFn(confirmAssistantTransaction); const qc = useQueryClient(); const navigate = useNavigate();
  const [text, setText] = useState(''); const [pendingText, setPendingText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ messageId: string; proposal: TransactionProposal }>(); const [confirming, setConfirming] = useState<string>();
  const last = useRef<{ text: string; requestId: string; replyId: string } | null>(null); const end = useRef<HTMLDivElement>(null); const input = useRef<HTMLTextAreaElement>(null); const autoSent = useRef(false);
  const voice = useVoiceInput(value => { setText(value); setError(''); input.current?.focus(); });

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.data?.length, busy]);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (!initial || autoSent.current) return; autoSent.current = true;
    void navigate({ to: '/assistente/$threadId', params: { threadId }, search: {}, replace: true });
    void send(initial);
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(value = text) {
    const clean = value.trim(); if (busy || !clean) return;
    setBusy(true); setError(''); setPendingText(clean); setText('');
    // Same text after a failure reuses ids so the server never duplicates the exchange.
    const payload = last.current?.text === clean ? last.current : { text: clean, requestId: crypto.randomUUID(), replyId: crypto.randomUUID() }; last.current = payload;
    try {
      const result = await ask({ data: { ...payload, threadId, today: todayISO() } });
      await Promise.all([qc.invalidateQueries({ queryKey: ['assistant-messages', threadId] }), qc.invalidateQueries({ queryKey: ['assistant-threads'] })]);
      if (result.error) { setError(result.error); setText(clean); } else last.current = null;
    } catch { setError('Sem conexão com o assistente. Sua mensagem foi mantida.'); setText(clean); }
    finally { setBusy(false); setPendingText(''); input.current?.focus(); }
  }

  async function quickConfirm(messageId: string, proposal: TransactionProposal) {
    setConfirming(messageId);
    try { await confirm({ data: { messageId, proposal } }); await qc.invalidateQueries({ queryKey: ['transactions'] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setConfirming(undefined); }
  }

  const rows = messages.data ?? []; const lastAssistant = [...rows].reverse().find(m => m.role === 'assistant');
  const suggestions = !busy && lastAssistant ? safeSuggestions(metaOf(lastAssistant.meta)['suggestions']) : [];

  return <AppShell>
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
      <PatrionLogo size={36} state={busy ? 'busy' : 'idle'} />
      <div className="min-w-0 flex-1"><p className="font-display text-lg leading-tight">PATRION</p><p className="text-xs text-muted-foreground" aria-live="polite">{busy ? 'pensando…' : 'assistente financeiro'}</p></div>
      <Button asChild size="icon" variant="ghost" aria-label="Histórico de conversas" title="Histórico"><Link to="/assistente/historico"><History /></Link></Button>
      <Button asChild size="icon" variant="ghost" aria-label="Nova conversa" title="Nova conversa"><Link to="/assistente"><Plus /></Link></Button>
    </header>

    <div className="flex min-h-[60dvh] flex-col gap-2 pb-4" aria-live="polite">
      {messages.isPending ? <p className="text-sm text-muted-foreground">Carregando conversa…</p> : messages.error ? <p role="alert" className="text-destructive">Não foi possível carregar a conversa.</p> :
        !rows.length && !pendingText ? <div className="flex flex-1 flex-col items-center justify-center py-8 text-center animate-fade-up">
          <PatrionLogo size={64} state="intro" /><h2 className="mt-4 text-2xl">Nova conversa</h2><p className="mt-1 text-sm text-muted-foreground">Pergunte ou registre um gasto.</p>
          <div className="mt-6 flex w-full flex-col gap-2">{STARTERS.map(s => <button key={s} className="pressable surface rounded-2xl px-4 py-3 text-left text-sm" onClick={() => void send(s)}>{s}</button>)}</div>
        </div> : rows.map(m => {
          const meta = metaOf(m.meta); const proposal = safeProposal(meta['proposal']); const table = safeTable(meta['table']);
          const saved = transactions.data?.find(t => t.client_request_id === m.id); const mine = m.role === 'user';
          const cat = categories.data?.find(c => c.id === (saved?.category_id ?? proposal?.category_id));
          return <div key={m.id} className={`flex animate-fade-up ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-2.5 ${mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-card'}`}>
              <div className="break-words text-[15px] leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"><ReactMarkdown skipHtml>{m.content}</ReactMarkdown></div>
              {table && <div className="mt-3 overflow-x-auto rounded-2xl border border-border"><p className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">{table.title}</p><table className="w-full text-sm"><thead><tr>{table.columns.map(c => <th key={c} className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">{c}</th>)}</tr></thead><tbody>{table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((cell, j) => <td key={j} className={`px-3 py-1.5 ${j > 0 ? 'tabular-nums' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
              {proposal && <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background/60">
                <div className="h-1" style={{ background: categoryColor(cat) }} />
                <div className="p-3"><p className="text-xs text-muted-foreground">{TYPE_LABEL[proposal.type]} · {new Date(proposal.occurred_on + 'T12:00:00').toLocaleDateString('pt-BR')}{cat ? ` · ${cat.name}` : ''}</p>
                  <p className="font-display text-xl tabular-nums">{formatBRL(saved ? Number(saved.amount) : proposal.amount)}</p><p className="truncate text-sm">{saved?.description ?? proposal.description}</p>
                  {saved ? <p className="mt-2 flex items-center gap-1.5 text-sm text-primary"><Check className="size-4" />{TYPE_LABEL[proposal.type]} de {formatBRL(Number(saved.amount))}{cat ? ` em ${cat.name}` : ''} registrada.</p>
                    : <div className="mt-3 flex gap-2"><Button size="sm" className="flex-1 rounded-full" disabled={confirming === m.id} onClick={() => void quickConfirm(m.id, proposal)}><Check />{confirming === m.id ? 'Salvando…' : 'Confirmar'}</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing({ messageId: m.id, proposal })}><Pencil />Corrigir</Button></div>}
                </div></div>}
              <p className={`mt-1 text-right text-[11px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{time(m.created_at)}</p>
            </div>
          </div>;
        })}
      {pendingText && !rows.some(m => m.role === 'user' && m.content === pendingText && last.current) && <div className="flex justify-end animate-fade-up"><div className="max-w-[85%] rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">{pendingText}</div></div>}
      {busy && <div className="flex justify-start" role="status" aria-label="Assistente pensando"><div className="flex gap-1 rounded-3xl rounded-bl-md bg-card px-4 py-3.5">{[0, 1, 2].map(i => <span key={i} className="size-2 animate-typing rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 160}ms` }} />)}</div></div>}
      {suggestions.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{suggestions.map(s => <button key={s} className="pressable rounded-full border border-primary/40 px-3 py-1.5 text-left text-sm text-primary" onClick={() => void send(s)}>{s}</button>)}</div>}
      <div ref={end} />
    </div>

    <form className="sticky bottom-20 -mx-4 border-t border-border bg-background/85 px-4 py-3 backdrop-blur-xl md:bottom-0" onSubmit={e => { e.preventDefault(); void send(); }}>
      {(error || voice.error) && <p className="mb-2 flex items-center gap-2 text-sm text-destructive" role="alert">{error || voice.error}{error && text && <button type="button" className="inline-flex items-center gap-1 text-primary" onClick={() => void send()}><RotateCcw className="size-3.5" />Tentar de novo</button>}</p>}
      {voice.listening && <p className="mb-2 text-sm text-primary" role="status">Ouvindo… toque para parar e revisar.</p>}
      <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-1.5">
        <Button type="button" size="icon" variant="ghost" className={`shrink-0 rounded-full ${voice.listening ? 'animate-mic-ring text-primary' : ''}`} aria-label={voice.listening ? 'Parar gravação' : 'Gravar mensagem'} disabled={busy} onClick={voice.start}>{voice.listening ? <Square /> : <Mic />}</Button>
        <Textarea ref={input} rows={1} className="min-h-10 max-h-36 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0" aria-label="Mensagem" placeholder="Mensagem" value={text} maxLength={2000} disabled={busy} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); void send(); } }} />
        <Button size="icon" className="shrink-0 rounded-full" aria-label="Enviar mensagem" disabled={busy || voice.listening || !text.trim()}><ArrowUp /></Button>
      </div>
    </form>
    {editing && <AssistantConfirmation {...editing} onClose={() => setEditing(undefined)} />}
  </AppShell>;
}
