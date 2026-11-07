import { useEffect, useRef, useState } from 'react';

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: { length: number; [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  useEffect(() => () => { const session = recognition.current; recognition.current = null; if (session) { session.onresult = null; session.onerror = null; session.onend = null; session.abort(); } }, []);

  function stop() { recognition.current?.stop(); }
  function cancel() { const session = recognition.current; recognition.current = null; if (session) { session.onresult = null; session.onend = null; session.onerror = null; session.abort(); } setListening(false); setError(''); }
  function start() {
    if (recognition.current) { stop(); return; }
    const browser = window as VoiceWindow;
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) { setError('A voz não está disponível neste navegador. Digite seu gasto abaixo.'); return; }
    setError('');
    recognition.current?.abort();
    const session = new Constructor();
    let received = false;
    let finalText = '';
    session.lang = 'pt-BR';
    session.interimResults = false;
    session.onresult = event => {
      const text = Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? '').join(' ').trim();
      received = Boolean(text);
      finalText = text;
    };
    session.onerror = event => {
      received = true;
      setListening(false);
      finalText = '';
      const errors: Record<string, string> = {
        'not-allowed': 'Permita o microfone nas configurações do navegador para falar.',
        'service-not-allowed': 'O navegador não permitiu o reconhecimento de voz. Confira as permissões.',
        'audio-capture': 'Microfone não encontrado ou em uso por outro aplicativo.',
        'network': 'O reconhecimento de voz precisa de conexão. Confira sua internet e tente novamente.',
        'no-speech': 'Não ouvi uma mensagem. Tente novamente.',
        'aborted': 'A gravação foi interrompida. Toque para tentar novamente.',
      };
      setError(errors[event.error] ?? 'Não foi possível ouvir. Tente novamente ou digite seu lançamento.');
    };
    session.onend = () => { if (recognition.current !== session) return; recognition.current = null; setListening(false); if (finalText) callback.current(finalText); else if (!received) setError('Não ouvi uma mensagem. Tente novamente ou digite seu lançamento.'); };
    recognition.current = session;
    try { session.start(); setListening(true); } catch { recognition.current = null; setListening(false); setError('Não foi possível iniciar o microfone. Digite seu lançamento.'); }
  }
  return { listening, error, start, stop, cancel };
}