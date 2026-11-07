import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useVoiceInput } from '@/hooks/use-voice-input';

class FakeRecognition {
  static latest: FakeRecognition;
  lang = '';
  interimResults = false;
  onresult: ((event: { results: { length: number; [index: number]: { [index: number]: { transcript: string } } } }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() { FakeRecognition.latest = this; }
}

afterEach(() => { Reflect.deleteProperty(window, 'SpeechRecognition'); });

describe('Voice input', () => {
  it('cancels a recording without submitting its transcript', () => {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeRecognition });
    const transcript = vi.fn();
    const { result } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start());
    const session = FakeRecognition.latest;
    act(() => result.current.cancel());
    session.onresult?.({ results: { length: 1, 0: { 0: { transcript: 'Gastei 32 reais de Uber.' } } } });
    expect(transcript).not.toHaveBeenCalled();
    expect(session.abort).toHaveBeenCalledOnce();
    expect(result.current.listening).toBe(false);
  });
  it('captures the spoken expense without changing the amount', () => {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeRecognition });
    const transcript = vi.fn();
    const { result, unmount } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start());
    expect(result.current.listening).toBe(true);
    act(() => FakeRecognition.latest.onresult?.({ results: { length: 1, 0: { 0: { transcript: 'Gastei 32 reais de Uber.' } } } }));
    expect(transcript).not.toHaveBeenCalled();
    act(() => FakeRecognition.latest.onend?.());
    expect(transcript).toHaveBeenCalledExactlyOnceWith('Gastei 32 reais de Uber.');
    expect(result.current.listening).toBe(false);
    unmount();
    expect(FakeRecognition.latest.abort).not.toHaveBeenCalled();
  });

  it('stops an active recording rather than starting another one', () => {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeRecognition });
    const { result } = renderHook(() => useVoiceInput(vi.fn()));
    act(() => result.current.start());
    const session = FakeRecognition.latest;
    act(() => result.current.start());
    expect(session.start).toHaveBeenCalledOnce();
    expect(session.stop).toHaveBeenCalledOnce();
  });

  it('does not produce a transcript when microphone permission is denied', () => {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeRecognition });
    const transcript = vi.fn();
    const { result } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start());
    act(() => FakeRecognition.latest.onerror?.({ error: 'not-allowed' }));
    expect(result.current.listening).toBe(false);
    expect(result.current.error.length).toBeGreaterThan(0);
    expect(transcript).not.toHaveBeenCalled();
  });
  it.each(['Gastei 35 reais no mercado.', 'Recebi 500 reais de um serviço.', 'Paguei 80 reais de combustível.', 'Ganhei 150 reais hoje.', 'Gastei 25 reais no almoço.'])('preserves spoken income or expense for review: %s', phrase => {
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeRecognition });
    const transcript = vi.fn(); const { result } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start());
    act(() => FakeRecognition.latest.onresult?.({ results: { length: 1, 0: { 0: { transcript: phrase } } } }));
    expect(transcript).not.toHaveBeenCalled();
    act(() => result.current.stop()); act(() => FakeRecognition.latest.onend?.());
    expect(transcript).toHaveBeenCalledExactlyOnceWith(phrase);
  });
});