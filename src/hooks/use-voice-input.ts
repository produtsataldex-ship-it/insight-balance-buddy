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
  useEffect(() => () => recognition.current?.abort(), []);

  function stop() { recognition.current?.stop(); }
  function start() {
    if (listening) { stop(); return; }
    const browser = window as VoiceWindow;
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) { setError('A voz não está disponível neste navegador. Digite seu gasto abaixo.'); return; }
    setError('');
    recognition.current?.abort();
    const session = new Constructor();
    let received = false;
    session.lang = 'pt-BR';
    session.interimResults = false;
    session.onresult = event => {
      const text = Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? '').join(' ').trim();
      received = Boolean(text);
      if (text) callback.current(text);
    };
    session.onerror = event => {
      received = true;
      setListening(false);
      setError(event.error === 'not-allowed' ? 'Permita o microfone para falar, ou digite seu gasto.' : 'Não foi possível ouvir. Tente novamente ou digite seu gasto.');
    };
    session.onend = () => { setListening(false); if (!received) setError('Não ouvi uma mensagem. Tente novamente ou digite seu gasto.'); };
    recognition.current = session;
    try { session.start(); setListening(true); } catch { setError('Não foi possível iniciar o microfone. Digite seu gasto.'); }
  }
  return { listening, error, start, stop };
}