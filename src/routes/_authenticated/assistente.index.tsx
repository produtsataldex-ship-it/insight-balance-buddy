import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { AppShell, PageHeader } from '@/components/patrion/AppShell';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ConversationLibrary } from '@/components/patrion/ConversationLibrary';
import { createThread } from '@/lib/threads';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/_authenticated/assistente/')({
  validateSearch: z.object({ q: z.string().max(2000).optional() }),
  head: () => pageMeta('Assistente', 'Converse com o Patrion ou continue suas conversas anteriores.'),
  component: NewChat,
});
function NewChat() {
  const { q } = Route.useSearch(); const navigate = useNavigate();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const creating = useRef(false);
  async function start() {
    if (creating.current) return; creating.current = true; setBusy(true); setError('');
    try { const threadId = await createThread(); await navigate({ to: '/assistente/$threadId', params: { threadId }, search: q ? { q } : {}, replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível iniciar a conversa.'); }
    finally { creating.current = false; setBusy(false); }
  }
  useEffect(() => { if (q) void start(); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return <AppShell><PageHeader title="Chat" action={<Button disabled={busy} onClick={() => void start()}><Plus />{busy ? 'Abrindo…' : 'Nova conversa'}</Button>} />{error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}<ConversationLibrary /></AppShell>;
}
