import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Keyboard, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PatrionLogo } from './PatrionLogo';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { createThread } from '@/lib/threads';
import { formatBRL } from '@/lib/format';
export function HomeBalance({ balance, forecast, hide, onManual }: { balance: number; forecast: number; hide: boolean; onManual: () => void }) {
  const navigate = useNavigate(); const qc = useQueryClient();
  const [transcript, setTranscript] = useState(''); const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const voice = useVoiceInput(text => { setTranscript(text); setReview(true); });
  async function send() {
    if (!transcript.trim() || busy) return; setBusy(true); setError('');
    try { const threadId = await createThread(); void qc.invalidateQueries({ queryKey: ['assistant-threads'] }); await navigate({ to: '/assistente/$threadId', params: { threadId }, search: { q: transcript.trim() } }); }
    catch { setError('Não foi possível abrir o assistente. Tente novamente.'); } finally { setBusy(false); }
  }
  return <section className="balance-ambient relative overflow-hidden py-6 text-center"><div className="relative flex flex-col items-center"><PatrionLogo size={80} state={voice.listening ? 'busy' : 'idle'} />
    <p className="mt-4 text-xs uppercase text-muted-foreground">Saldo disponível</p><p className="mt-2 break-all font-display text-4xl tabular-nums sm:text-5xl">{formatBRL(balance, hide)}</p>
    <p className="mt-3 flex max-w-full flex-wrap justify-center gap-x-2 text-xs text-muted-foreground"><span>Previsto no fim do mês · estimativa</span><span className="tabular-nums">{formatBRL(forecast, hide)}</span></p>
    <div className="mt-5 flex items-center gap-2"><Button variant="outline" className="h-12 select-none rounded-full border-primary/40 bg-accent px-5 text-primary" aria-label={voice.listening ? 'Encerrar gravação' : 'Gravar por voz'} onClick={voice.start}>{voice.listening ? <Square className="size-4" /> : <Mic className="size-4" />}{voice.listening ? 'Encerrar gravação' : 'Toque para falar'}</Button><Button size="icon" variant="ghost" aria-label="Adicionar manualmente" title="Adicionar manualmente" onClick={onManual}><Keyboard /></Button></div>
    {voice.listening && <div className="mt-2 flex h-6 items-center gap-1" role="status" aria-label="Registrando voz">{[0,1,2,3,4].map(i => <span key={i} className="h-5 w-1 animate-typing rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />)}</div>}
    {voice.error && <p role="alert" className="mt-3 max-w-sm text-sm text-destructive">{voice.error}</p>}</div>
    <Dialog open={review} onOpenChange={setReview}><DialogContent><DialogHeader><DialogTitle>Revise o que você falou</DialogTitle></DialogHeader><Textarea aria-label="Transcrição" value={transcript} onChange={e => setTranscript(e.target.value)} maxLength={2000} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy || !transcript.trim()} onClick={() => void send()}>{busy ? 'Abrindo…' : 'Revisar lançamento'}</Button></DialogContent></Dialog>
  </section>;
}