import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export async function createThread() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão expirada. Entre novamente.');
  const { data, error } = await supabase.from('assistant_threads').insert({ user_id: auth.user.id }).select('id').single();
  if (error) throw new Error('Não foi possível iniciar a conversa.');
  return data.id;
}

export function useThreads() {
  return useQuery({
    queryKey: ['assistant-threads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assistant_threads').select('*').order('updated_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
}

export function useThreadMessages(threadId: string) {
  return useQuery({
    queryKey: ['assistant-messages', threadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('assistant_messages').select('*').eq('thread_id', threadId).order('created_at').limit(500);
      if (error) throw error;
      return data;
    },
  });
}
