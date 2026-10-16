import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { AppShell } from '@/components/patrion/AppShell';
import { PatrionLogo } from '@/components/patrion/PatrionLogo';
import { Button } from '@/components/ui/button';
import { createThread } from '@/lib/threads';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/assistente/')({
  validateSearch: z.object({ q: z.string().max(2000).optional() }),
  head: () => pageMeta('Assistente', 'Comece uma nova conversa com o assistente financeiro do Patrion.'),
  component: NewChat,
});

// Shared across StrictMode double effects so one visit creates one conversation.
let pending: Promise<string> | null = null;

function NewChat() {
  const { q } = Route.useSearch(); const navigate = useNavigate(); const [error, setError] = useState('');
  function start() {
    setError('');
    pending ??= createThread();
    pending.then(threadId => { pending = null; void navigate({ to: '/assistente/$threadId', params: { threadId }, search: q ? { q } : {}, replace: true }); })
      .catch((e: unknown) => { pending = null; setError(e instanceof Error ? e.message : 'Não foi possível iniciar a conversa.'); });
  }
  useEffect(start, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <AppShell><div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
    <PatrionLogo size={64} state={error ? 'idle' : 'busy'} />
    {error ? <><p role="alert" className="text-sm text-destructive">{error}</p><Button onClick={start}>Tentar novamente</Button></> : <p className="text-sm text-muted-foreground">Abrindo nova conversa…</p>}
  </div></AppShell>;
}
