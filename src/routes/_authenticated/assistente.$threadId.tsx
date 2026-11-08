import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AssistantChat } from '@/components/patrion/AssistantChat';
import { threadMessageOptions } from '@/lib/threads';
import { pageMeta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/assistente/$threadId')({
  validateSearch: z.object({ q: z.string().max(2000).optional() }),
  head: () => pageMeta('Conversa', 'Converse com o assistente financeiro do Patrion e confirme lançamentos.'),
  loader: ({ context, params }) => { void context.queryClient.prefetchQuery(threadMessageOptions(context.user.id, params.threadId)); },
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams(); const { q } = Route.useSearch();
  return <AssistantChat key={threadId} threadId={threadId} initial={q} />;
}
