import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/patrion/AppShell";
import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mic, Send, Square, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PatrionLogo } from '@/components/patrion/PatrionLogo';
import { AssistantConfirmation } from '@/components/patrion/AssistantConfirmation';
import { askAssistant } from '@/lib/assistant.functions';
import { safeProposal, type TransactionProposal } from '@/lib/assistant-schema';
import { useTransactions } from '@/lib/data';
import { formatBRL } from '@/lib/format';
import { todayISO } from '@/lib/finance';
import { pageMeta } from '@/lib/meta';

interface SpeechSession { lang: string; interimResults: boolean; onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } }; length: number } }) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start(): void; stop(): void; abort(): void; }
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechSession; webkitSpeechRecognition?: new () => SpeechSession };

export const Route = createFileRoute("/_authenticated/assistente")({
  head: () => pageMeta('Assistente', 'Converse sobre suas finanças e confirme lançamentos por texto ou voz no Patrion.'),
  component: Page,
});

function Page() {
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [listening, setListening] = useState(false); const [error, setError] = useState(''); const [review, setReview] = useState(false); const [confirmation, setConfirmation] = useState<{ messageId: string; proposal: TransactionProposal }>();
  const speech = useRef<SpeechSession | null>(null); const lastRequest = useRef<{ text: string; requestId: string; replyId: string } | null>(null); const end = useRef<HTMLDivElement>(null); const qc = useQueryClient(); const ask = useServerFn(askAssistant); const transactions = useTransactions();
  const history = useQuery({ queryKey: ['assistant-history'], queryFn: async () => { const { data, error } = await supabase.from('assistant_messages').select('*').order('created_at', { ascending: false }).limit(200); if (error) throw error; return data.reverse(); } });
  useEffect(() => () => speech.current?.abort(), []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [history.data, busy]);
  function record() {
    if (listening) { speech.current?.stop(); return; }
    const w = window as SpeechWindow; const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Recognition) { setError('Este navegador não oferece reconhecimento de voz. Você pode enviar sua mensagem por texto.'); return; }
    setError(''); const session = new Recognition(); session.lang = 'pt-BR'; session.interimResults = false;
    session.onresult = event => { setText(Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? '').join(' ')); setReview(true); };
    session.onerror = event => { setListening(false); setError(event.error === 'not-allowed' ? 'Permita o acesso ao microfone ou use texto.' : 'Não foi possível ouvir. Tente novamente ou use texto.'); };
    session.onend = () => setListening(false); speech.current = session;
    try { session.start(); setListening(true); } catch { setError('Não foi possível iniciar o microfone.'); }
  }
  async function send(value = text) {
    if (busy || !value.trim()) return; setBusy(true); setError(''); setReview(false);
    const payload = lastRequest.current?.text === value.trim() ? lastRequest.current : { text: value.trim(), requestId: crypto.randomUUID(), replyId: crypto.randomUUID() }; lastRequest.current = payload;
    try { const result = await ask({ data: { ...payload, today: todayISO() } }); await qc.invalidateQueries({ queryKey: ['assistant-history'] }); if (result.error) setError(result.error); else { setText(''); lastRequest.current = null; } } catch { setError('Não foi possível conectar ao assistente. Sua mensagem foi mantida para tentar novamente.'); } finally { setBusy(false); }
  }
  return <AppShell><PageHeader title="Assistente" action={<PatrionLogo size={38} state={busy ? 'busy' : 'idle'}/>}/><div className="flex min-h-[65dvh] flex-col"><div className="flex-1 space-y-6 pb-6" aria-live="polite">{history.isPending ? <p className="text-sm text-muted-foreground">Carregando conversa…</p> : history.error ? <p role="alert">Não foi possível carregar a conversa.</p> : !history.data?.length ? <div className="py-8"><PatrionLogo size={68} state="intro"/><h2 className="mt-5 text-2xl">Suas finanças, em conversa.</h2><div className="mt-6 flex flex-col items-start gap-2">{['Quanto tenho disponível?', 'Quais contas preciso pagar esta semana?', 'Quanto gastei este mês?'].map(question => <Button key={question} variant="outline" className="h-auto max-w-full whitespace-normal text-left" disabled={busy} onClick={() => { setText(question); void send(question); }}>{question}</Button>)}</div></div> : history.data.map(message => {
    const meta = message.meta; const proposal = meta && typeof meta === 'object' && !Array.isArray(meta) ? safeProposal(meta['proposal']) : null;
    const saved = transactions.data?.find(t => t.client_request_id === message.id);
    return <article key={message.id} className={message.role === 'user' ? 'ml-6 rounded-lg bg-muted px-4 py-3 sm:ml-20' : 'mr-2 border-b border-border pb-5'}><p className="mb-2 text-xs text-muted-foreground">{message.role === 'user' ? 'Você' : 'PATRION'}</p><div className="break-words text-sm leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown skipHtml>{message.content}</ReactMarkdown></div>{proposal && (saved ? <p className="mt-3 flex items-center gap-2 text-sm text-primary"><Check className="size-4"/>Salvo · {formatBRL(saved.amount)}</p> : <Button variant="outline" className="mt-3" onClick={() => setConfirmation({ messageId: message.id, proposal })}>Revisar {formatBRL(proposal.amount)}</Button>)}</article>;
  })}{busy && <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status"><PatrionLogo size={28} state="busy"/>Consultando suas finanças…</div>}<div ref={end}/></div><form className="sticky bottom-20 border-t border-border bg-background py-4 md:bottom-0" onSubmit={e => { e.preventDefault(); void send(); }}>{error && <p className="mb-3 text-sm text-destructive" role="alert">{error}</p>}{review && <p className="mb-3 text-sm text-primary">Confira a transcrição antes de enviar.</p>}{listening && <p className="mb-3 text-sm text-primary" role="status">Ouvindo…</p>}<div className="flex items-end gap-2"><Button type="button" size="icon" variant={listening ? 'default' : 'outline'} className={listening ? 'shrink-0 animate-mic-ring' : 'shrink-0'} aria-label={listening ? 'Parar gravação' : 'Gravar mensagem'} title={listening ? 'Parar gravação' : 'Gravar mensagem'} disabled={busy} onClick={record}>{listening ? <Square/> : <Mic/>}</Button><Textarea className="min-h-11 max-h-40 resize-none" aria-label="Mensagem" placeholder="Sua mensagem…" value={text} maxLength={2000} onChange={e => setText(e.target.value)} disabled={busy}/><Button size="icon" aria-label="Enviar mensagem" title="Enviar mensagem" className="shrink-0" disabled={busy || listening || !text.trim()}><Send/></Button></div></form></div>{confirmation && <AssistantConfirmation {...confirmation} onClose={() => setConfirmation(undefined)}/>}</AppShell>;
}
