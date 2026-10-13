import { z } from 'zod';

// Nullable extraction fields make ambiguity explicit; no guessed values are saved.
export const assistantOutputSchema = z.object({
  reply: z.string(),
  proposal: z.object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().nullable(),
    description: z.string().nullable(),
    occurred_on: z.string().nullable(),
    category_id: z.string().nullable(),
    status: z.enum(['paid', 'pending']),
  }).nullable(),
}).strict();

export const transactionProposalSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive().finite().max(999999999),
  description: z.string().trim().min(1).max(300),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Data inválida.'),
  category_id: z.string().uuid().nullable(),
  status: z.enum(['paid', 'pending']),
}).strict();

export type TransactionProposal = z.infer<typeof transactionProposalSchema>;

export function safeProposal(value: unknown): TransactionProposal | null {
  const parsed = transactionProposalSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}