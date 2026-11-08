export const threadKeys = {
  list: (ownerId: string) => ['assistant-threads', ownerId] as const,
  messages: (ownerId: string, threadId: string) => ['assistant-messages', ownerId, threadId] as const,
};
export function resumeThreadId(threads: { id: string }[], fresh = false, prompt?: string) {
  return fresh || Boolean(prompt) ? undefined : threads[0]?.id;
}
