import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, Check, History, Mic, Pencil, Plus, RotateCcw, Square } from 'lucide-react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { ConversationLibrary } from './ConversationLibrary';
import { toast } from 'sonner';
import { AppShell } from './AppShell';
import { PatrionLogo } from './PatrionLogo';
import { AssistantConfirmation } from './AssistantConfirmation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { askAssistant, confirmAssistantTransaction } from '@/lib/assistant.functions';
import { safeProposal, safeSuggestions, safeTable, type TransactionProposal } from '@/lib/assistant-schema';
import { useCategories, useTransactions } from '@/lib/data';
import { useThreadMessages } from '@/lib/threads';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { formatBRL } from '@/lib/format';
import { todayISO } from '@/lib/finance';
import { categoryColor } from '@/lib/category-colors';
import { ASSISTANT_ERROR_TEXT, kindFromClientError } from '@/lib/assistant-errors';

const STARTERS = ['Quanto tenho disponível?', 'Qual foi minha maior despesa no mês passado?', 'Quais contas preciso pagar esta semana?'];
const TYPE_LABEL = { expense: 'Despesa', income: 'Receita', transfer: 'Transferência' } as const;
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function metaOf(meta: unknown) { return meta && typeof meta === 'object' && !Array.isArray(meta) ? meta as Record<string, unknown> : {}; }

export function AssistantChat({ threadId, initial }: { threadId: string; initial?: string | undefined }) {
  const messages = useThreadMessages(threadId); const transactions = useTransactions(); const categories = useCategories();
  const ask = useServerFn(askAssistant); const confirm = useServerFn(confirmAssistantTransaction); const qc = useQueryClient(); const navigate = useNavigate();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [text, setText] = useState(''); const [pendingText, setPendingText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ messageId: string; proposal: TransactionProposal }>(); const [confirming, setConfirming] = useState<string>();
  const last = useRef<{ text: string; requestId: string; replyId: string } | null>(null); const end = useRef<HTMLDivElement>(null); const input = useRef<HTMLTextAreaElement>(null); const autoSent = useRef(false); const sending = useRef(false);
  const voice = useVoiceInput(value => { setText(value); setError(''); input.current?.focus(); });

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.data?.length, busy]);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (!initial || autoSent.current || !messages.isSuccess) return; autoSent.current = true;
    void navigate({ to: '/assistente/$threadId', params: { threadId }, search: {}, replace: true });
    void send(initial);
  }, [initial, messages.isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(value = text) {
    const clean = value.trim(); if (sending.current || !clean || !messages.isSuccess) return;
    sending.current = true;
    setBusy(true); setError(''); setPendingText(clean); setText('');
    // Same text after a failure reuses ids so the server never duplicates the exchange.
    const payload = last.current?.text === clean ? last.current : { text: clean, requestId: crypto.randomUUID(), replyId: crypto.randomUUID() }; last.current = payload;
    try {
      const result = await ask({ data: { ...payload, threadId, today: todayISO() } });
      await Promise.all([qc.invalidateQueries({ queryKey: ['assistant-messages', threadId] }), qc.invalidateQueries({ queryKey: ['assistant-threads'] })]);
      if (result.error) { setError(result.error); setText(clean); } else last.current = null;
    } catch (e) {
      const kind = kindFromClientError(e, navigator.onLine);
      console.error('[assistant] client', { correlationId: payload.requestId, kind });
      setError(ASSISTANT_ERROR_TEXT[kind]); setText(clean);
      if (kind === 'auth') void navigate({ to: '/auth', search: { redirect: `/assistente/${threadId}` } });
    }
    finally { sending.current = false; setBusy(false); setPendingText(''); input.current?.focus(); }
  }

  async function quickConfirm(messageId: string, proposal: TransactionProposal) {
    setConfirming(messageId);
    try { await confirm({ data: { messageId, proposal } }); await qc.invalidateQueries({ queryKey: ['transactions'] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setConfirming(undefined); }
  }

  const rows = messages.data ?? []; const lastAssistant = [...rows].reverse().find(m => m.role === 'assistant');
  const suggestions = !busy && lastAssistant ? safeSuggestions(metaOf(lastAssistant.meta)['suggestions']) : [];

  return <AppShell wide><div className="grid min-w-0 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]"><aside className="hidden max-h-[85dvh] overflow-y-auto border-r border-border pr-4 xl:block"><ConversationLibrary activeId={threadId} /></aside><div className="flex h-[calc(100dvh-var(--safe-top)-8.5rem)] min-h-96 min-w-0 flex-col md:h-[calc(100dvh-5rem)]">
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
      <PatrionLogo size={36} state={busy ? 'busy' : 'idle'} />
      <div className="min-w-0 flex-1"><p className="font-display text-lg leading-tight">PATRION</p><p className="text-xs text-muted-foreground" aria-live="polite">{busy ? 'pensando…' : 'assistente financeiro'}</p></div>
      <Button size="icon" variant="ghost" aria-label="Conversas anteriores" title="Conversas anteriores" onClick={() => setLibraryOpen(true)}><History /></Button>
      <Button asChild size="icon" variant="ghost" aria-label="Nova conversa" title="Nova conversa"><Link to="/assistente"><Plus /></Link></Button>
    </header>

    <Conversation className="min-h-0"><ConversationContent className="gap-4 px-0 py-3">
      {messages.isPending ? <p className="text-sm text-muted-foreground">Carregando conversa…</p> : messages.error ? <div role="alert"><p className="text-destructive">Não foi possível carregar a conversa.</p><Button variant="outline" onClick={() => void messages.refetch()}>Tentar novamente</Button></div> :
        !rows.length && !pendingText ? <div className="flex flex-1 flex-col items-center justify-center py-8 text-center animate-fade-up">
          <PatrionLogo size={64} state="intro" /><h2 className="mt-4 text-2xl">Nova conversa</h2><p className="mt-1 text-sm text-muted-foreground">Pergunte ou registre um gasto.</p>
          <div className="mt-6 flex w-full flex-col gap-2">{STARTERS.map(s => <Button key={s} variant="outline" className="h-auto whitespace-normal px-4 py-3 text-left text-sm" onClick={() => void send(s)}>{s}</Button>)}</div>
        </div> : rows.map(m => {
          const meta = metaOf(m.meta); const proposal = safeProposal(meta['proposal']); const table = safeTable(meta['table']);
          const saved = transactions.data?.find(t => t.client_request_id === m.id); const mine = m.role === 'user';
          const cat = categories.data?.find(c => c.id === (saved?.category_id ?? proposal?.category_id));
          return <Message key={m.id} from={mine ? "user" : "assistant"}>
            <MessageContent className={mine ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "bg-transparent py-2"}>
              <div className="break-words text-[15px] leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"><MessageResponse>{m.content}</MessageResponse></div>
              {table && <div className="mt-3 overflow-x-auto rounded-2xl border border-border"><p className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">{table.title}</p><table className="w-full text-sm"><thead><tr>{table.columns.map(c => <th key={c} className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">{c}</th>)}</tr></thead><tbody>{table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((cell, j) => <td key={j} className={`px-3 py-1.5 ${j > 0 ? 'tabular-nums' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
              {proposal && <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background/60">
                <div className="h-1" style={{ background: categoryColor(cat) }} />
                <div className="p-3"><p className="text-xs text-muted-foreground">{TYPE_LABEL[proposal.type]} · {new Date(proposal.occurred_on + 'T12:00:00').toLocaleDateString('pt-BR')}{cat ? ` · ${cat.name}` : ''}</p>
                  <p className="font-display text-xl tabular-nums">{formatBRL(saved ? Number(saved.amount) : proposal.amount)}</p><p className="truncate text-sm">{saved?.description ?? proposal.description}</p>
                  {saved ? <p className="mt-2 flex items-center gap-1.5 text-sm text-primary"><Check className="size-4" />{TYPE_LABEL[proposal.type]} de {formatBRL(Number(saved.amount))}{cat ? ` em ${cat.name}` : ''} registrada.</p>
                    : <div className="mt-3 flex gap-2"><Button size="sm" className="flex-1 rounded-full" disabled={confirming === m.id} onClick={() => void quickConfirm(m.id, proposal)}><Check />{confirming === m.id ? 'Salvando…' : 'Confirmar'}</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing({ messageId: m.id, proposal })}><Pencil />Corrigir</Button></div>}
                </div></div>}
              <p className={`mt-1 text-right text-[11px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{time(m.created_at)}</p>
            </MessageContent>
          </Message>;
        })}
      {pendingText && !rows.some(m => m.id === last.current?.requestId) && <div className="flex justify-end animate-fade-up"><div className="max-w-[85%] rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">{pendingText}</div></div>}
      {busy && <Message from="assistant"><Shimmer>Patrion pensando…</Shimmer></Message>}
      {suggestions.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{suggestions.map(s => <Button key={s} variant="outline" className="h-auto whitespace-normal px-3 py-2 text-left text-sm text-primary" onClick={() => void send(s)}>{s}</Button>)}</div>}
      <div ref={end} />
    </ConversationContent><ConversationScrollButton aria-label="Ir para a última mensagem" /></Conversation>

    <div className="shrink-0 border-t border-border bg-background pt-3">
      {(error || voice.error) && <div className="mb-2 text-sm text-destructive" role="alert">{error || voice.error}{error && text && <Button type="button" variant="ghost" className="text-primary" onClick={() => void send()}><RotateCcw />Tentar novamente</Button>}</div>}
      {voice.listening && <p className="mb-2 text-sm text-primary" role="status">Gravando… encerre para revisar.</p>}
      <PromptInput onSubmit={() => send()}>
        <PromptInputTextarea ref={input} className="min-h-12 max-h-36" aria-label="Mensagem" placeholder="Mensagem" value={text} maxLength={2000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !window.matchMedia('(pointer: fine)').matches) e.stopPropagation(); }} />
        <PromptInputFooter>
          <Button type="button" size="icon" variant="ghost" aria-label={voice.listening ? 'Parar gravação' : 'Gravar mensagem'} disabled={busy} onClick={voice.start}>{voice.listening ? <Square /> : <Mic />}</Button>
          <PromptInputSubmit aria-label="Enviar mensagem" status={busy ? 'submitted' : 'ready'} className="size-10" disabled={busy || voice.listening || !text.trim() || !messages.isSuccess}><ArrowUp /></PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>
    </div>
    </div></div>
    <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Conversas anteriores</DialogTitle></DialogHeader><ConversationLibrary activeId={threadId} /></DialogContent></Dialog>
    {editing && <AssistantConfirmation {...editing} onClose={() => setEditing(undefined)} />}
  </AppShell>;
}
