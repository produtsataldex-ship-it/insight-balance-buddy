import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { AppShell } from '@/components/patrion/AppShell';
import { Button } from '@/components/ui/button';
import { PatrionLogo } from '@/components/patrion/PatrionLogo';
import { createThread, threadListOptions, threadKeys } from '@/lib/threads';
import { resumeThreadId } from '@/lib/thread-policy';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/_authenticated/assistente/')({
  validateSearch: z.object({ q: z.string().max(2000).optional(), fresh: z.boolean().optional() }),
  head: () => pageMeta('Assistente', 'Converse com o Patrion ou continue suas conversas anteriores.'),
  component: OpenChat,
});
function OpenChat() {
  const { q, fresh } = Route.useSearch(); const { user } = Route.useRouteContext();
  const navigate = useNavigate(); const qc = useQueryClient(); const opening = useRef(false); const [error, setError] = useState('');
  async function open() {
    if (opening.current) return; opening.current = true; setError('');
    try {
      const threads = fresh || q ? [] : await qc.ensureQueryData(threadListOptions(user.id));
      const existing = resumeThreadId(threads, fresh, q); const threadId = existing ?? await createThread();
      if (!existing) void qc.invalidateQueries({ queryKey: threadKeys.list(user.id) });
      await navigate({ to: '/assistente/$threadId', params: { threadId }, search: q ? { q } : {}, replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível abrir a conversa.'); opening.current = false; }
  }
  useEffect(() => { void open(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <AppShell><div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4"><PatrionLogo size={64} state="intro" /><h1 className="text-2xl">PATRION</h1>{error ? <><p role="alert" className="text-sm text-destructive">{error}</p><Button onClick={() => void open()}>Tentar novamente</Button></> : <p role="status" className="text-sm text-muted-foreground">Abrindo sua conversa…</p>}</div></AppShell>;
}
