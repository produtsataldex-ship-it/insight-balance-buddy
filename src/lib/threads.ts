import { queryOptions, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

import { useRouteContext } from '@tanstack/react-router';
import { threadKeys } from './thread-policy';
export { threadKeys } from './thread-policy';

type StoredMessage = Database['public']['Tables']['assistant_messages']['Row'];
const PAGE_SIZE = 500;

export async function loadThreadMessages(threadId: string, ownerId: string): Promise<StoredMessage[]> {
  const thread = await supabase.from('assistant_threads').select('id').eq('id', threadId).eq('user_id', ownerId).single();
  if (thread.error) throw new Error('Conversa não encontrada ou indisponível.');
  const messages: StoredMessage[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from('assistant_messages').select('*').eq('thread_id', threadId).eq('user_id', ownerId).order('created_at').order('id').range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    messages.push(...data);
    if (data.length < PAGE_SIZE) return messages;
  }
}

export async function createThread() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão expirada. Entre novamente.');
  const { data, error } = await supabase.from('assistant_threads').insert({ user_id: auth.user.id }).select('id').single();
  if (error) throw new Error('Não foi possível iniciar a conversa.');
  return data.id;
}

export function threadListOptions(ownerId: string) {
  return queryOptions({
    queryKey: threadKeys.list(ownerId),
    staleTime: 30_000,
    queryFn: async () => {
      const all = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase.from('assistant_threads').select('*, assistant_messages(content,created_at)').eq('user_id', ownerId).order('updated_at', { ascending: false }).order('id').range(offset, offset + PAGE_SIZE - 1).order('created_at', { referencedTable: 'assistant_messages', ascending: false }).limit(1, { referencedTable: 'assistant_messages' });
        if (error) throw error;
        all.push(...data.map(t => ({ ...t, preview: t.assistant_messages[0]?.content ?? '', lastActivity: t.assistant_messages[0]?.created_at ?? t.updated_at })));
        if (data.length < PAGE_SIZE) return all;
      }
    },
  });
}

export function useThreads() {
  const { user } = useRouteContext({ from: '/_authenticated' });
  return useQuery(threadListOptions(user.id));
}
export function threadMessageOptions(ownerId: string, threadId: string) {
  return queryOptions({ queryKey: threadKeys.messages(ownerId, threadId), staleTime: 60_000, queryFn: () => loadThreadMessages(threadId, ownerId) });
}
export function useThreadMessages(threadId: string) {
  const { user } = useRouteContext({ from: '/_authenticated' });
  return useQuery(threadMessageOptions(user.id, threadId));
}
