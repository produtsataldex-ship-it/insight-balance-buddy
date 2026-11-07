import { createFileRoute } from '@tanstack/react-router';
import { AppShell, PageHeader } from '@/components/patrion/AppShell';
import { ConversationLibrary } from '@/components/patrion/ConversationLibrary';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/_authenticated/assistente/historico')({
  head: () => pageMeta('Conversas anteriores', 'Abra, continue, renomeie e organize suas conversas financeiras no Patrion.'),
  component: History,
});
function History() { return <AppShell><PageHeader title="Conversas anteriores" /><ConversationLibrary /></AppShell>; }
