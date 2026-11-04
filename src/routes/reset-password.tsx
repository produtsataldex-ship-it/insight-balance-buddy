import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PatrionLogo } from '@/components/patrion/PatrionLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/reset-password')({
  head: () => pageMeta('Nova senha', 'Crie uma nova senha para sua conta Patrion.'),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true); });
    void supabase.auth.getSession().then(({ data: s }) => { if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMessage('');
    if (password.length < 6) return setMessage('A senha precisa ter pelo menos 6 caracteres.');
    if (password !== confirm) return setMessage('As senhas não coincidem.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage('Não foi possível salvar a nova senha. Peça um novo link.');
    setDone(true);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center"><PatrionLogo size={72} state="intro" /><h1 className="mt-5 text-3xl">Nova senha</h1></div>
        {done ? (
          <div className="space-y-5 text-center"><ShieldCheck className="mx-auto size-8 text-primary" /><p role="status">Senha atualizada com sucesso.</p><Button variant="gold" size="xl" className="w-full" onClick={() => window.location.assign('/inicio')}>Continuar <ArrowRight /></Button></div>
        ) : !ready ? (
          <p className="text-center text-sm text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, peça outro em “Esqueci a senha”.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {[['Nova senha', password, setPassword], ['Confirmar senha', confirm, setConfirm]].map(([label, value, set]) => (
              <label key={label as string} className="block text-xs text-muted-foreground">{label as string}
                <div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 size-5" />
                  <Input aria-label={label as string} type={visible ? 'text' : 'password'} autoComplete="new-password" value={value as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} required className="pl-11 pr-12" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0.5" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button>
                </div>
              </label>
            ))}
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button variant="gold" size="xl" className="w-full" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
