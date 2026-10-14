import { useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Mic, Square, Send, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PatrionLogo } from './PatrionLogo';
import { AssistantConfirmation } from './AssistantConfirmation';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { askAssistant } from '@/lib/assistant.functions';
import { safeProposal, type TransactionProposal } from '@/lib/assistant-schema';
import { supabase } from '@/integrations/supabase/client';
import { todayISO } from '@/lib/finance';

export function HomeVoiceEntry() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [confirmation, setConfirmation] = useState<{ messageId: string; proposal: TransactionProposal }>();
  const lastRequest = useRef<{ text: string; requestId: string; replyId: string } | null>(null);
  const voice = useVoiceInput(value => { setText(value); setError(''); });
  const ask = useServerFn(askAssistant);
  const qc = useQueryClient();

  async function send() {
    if (busy || !text.trim()) return;
    setBusy(true); setError('');
    const payload = lastRequest.current?.text === text.trim() ? lastRequest.current : { text: text.trim(), requestId: crypto.randomUUID(), replyId: crypto.randomUUID() };
    lastRequest.current = payload;
    try {
      const result = await ask({ data: { ...payload, today: todayISO() } });
      if (result.error) { setError(result.error); return; }
      const response = await supabase.from('assistant_messages').select('content,meta').eq('id', payload.replyId).single();
      if (response.error) { setError('Não foi possível recuperar a resposta. Tente novamente.'); return; }
      await qc.invalidateQueries({ queryKey: ['assistant-history'] });
      const meta = response.data.meta;
      const proposal = meta && typeof meta === 'object' && !Array.isArray(meta) ? safeProposal(meta['proposal']) : null;
      lastRequest.current = null;
      if (proposal) { setOpen(false); setConfirmation({ messageId: payload.replyId, proposal }); }
      else { setReply(response.data.content); setText(''); }
    } catch { setError('Não foi possível conectar. Sua mensagem foi mantida para tentar novamente.'); }
    finally { setBusy(false); }
  }

  return <>
    <section className="flex flex-col items-center border-b border-border pb-8 pt-2 text-center">
      <PatrionLogo size={82} state={busy ? 'busy' : 'intro'}/>
      <h1 className="mt-3 font-display text-2xl">PATRION</h1>
      <Button variant="gold" className="mt-5 h-14 gap-3 rounded-full px-7 text-base" onClick={() => { setOpen(true); setReply(''); setError(''); voice.start(); }}><Mic className="size-5"/>Registrar por voz</Button>
    </section>
    <Dialog open={open} onOpenChange={value => { if (!busy) { setOpen(value); if (!value) voice.stop(); } }}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl">
        <DialogTitle>{voice.listening ? 'Ouvindo você…' : busy ? 'Interpretando sua mensagem…' : 'Registrar movimentação'}</DialogTitle>
        <DialogDescription>{voice.listening ? 'Pode falar seu gasto, valor e estabelecimento.' : 'Confira a mensagem antes de continuar. Você revisará os dados antes de salvar.'}</DialogDescription>
        {reply && <p className="whitespace-pre-wrap text-sm leading-relaxed" aria-live="polite">{reply}</p>}
        {(error || voice.error) && <p role="alert" className="text-sm text-destructive">{error || voice.error}</p>}
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); void send(); }}>
          <Textarea aria-label="Seu gasto" placeholder="Gastei 32 reais de Uber…" value={text} maxLength={2000} disabled={busy} onChange={e => setText(e.target.value)} className="min-h-28 resize-none"/>
          <div className="flex gap-3"><Button type="button" size="icon" variant="outline" disabled={busy} aria-label={voice.listening ? 'Parar gravação' : 'Gravar mensagem'} title={voice.listening ? 'Parar gravação' : 'Gravar mensagem'} className={voice.listening ? 'animate-mic-ring shrink-0' : 'shrink-0'} onClick={voice.start}>{voice.listening ? <Square/> : <Mic/>}</Button><Button className="flex-1" disabled={busy || voice.listening || !text.trim()}>{busy ? <LoaderCircle className="animate-spin"/> : <Send/>}{busy ? 'Processando…' : 'Revisar lançamento'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
    {confirmation && (
      <AssistantConfirmation
        {...confirmation}
        onClose={() => { setConfirmation(undefined); setText(''); }}
      />
    )}
  </>;
}