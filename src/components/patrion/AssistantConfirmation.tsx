import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/lib/data';
import { confirmAssistantTransaction } from '@/lib/assistant.functions';
import { transactionProposalSchema, type TransactionProposal } from '@/lib/assistant-schema';

export function AssistantConfirmation({ messageId, proposal, onClose }: { messageId: string; proposal: TransactionProposal; onClose: () => void }) {
  const [draft, setDraft] = useState(proposal); const [amount, setAmount] = useState(String(proposal.amount)); const [busy, setBusy] = useState(false);
  const categories = useCategories(); const confirm = useServerFn(confirmAssistantTransaction); const qc = useQueryClient();
  const field = 'mt-2 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm';
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogTitle>Confirmar movimentação</DialogTitle><DialogDescription>Confira os dados antes de salvar.</DialogDescription><form className="space-y-4" onSubmit={async e => {
    e.preventDefault(); const value = transactionProposalSchema.safeParse({ ...draft, amount: Number(amount.replace(',', '.')) });
    if (!value.success) { toast.error('Confira o valor, a descrição e a data.'); return; }
    setBusy(true); try { await confirm({ data: { messageId, proposal: value.data } }); await qc.invalidateQueries({ queryKey: ['transactions'] }); toast.success('Movimentação salva.'); onClose(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setBusy(false); }
  }}><label className="block text-sm">Tipo<select className={field} value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as TransactionProposal['type'], category_id: null })}><option value="expense">Despesa</option><option value="income">Receita</option><option value="transfer">Transferência</option></select></label><label className="block text-sm">Valor (R$)<Input className="mt-2" aria-label="Valor" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required/></label><label className="block text-sm">Descrição<Input className="mt-2" aria-label="Descrição" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} required/></label><label className="block text-sm">Data<Input className="mt-2" type="date" value={draft.occurred_on} onChange={e => setDraft({ ...draft, occurred_on: e.target.value })} required/></label><label className="block text-sm">Categoria<select className={field} value={draft.category_id ?? ''} onChange={e => setDraft({ ...draft, category_id: e.target.value || null })}><option value="">Sem categoria</option>{categories.data?.filter(c => c.kind === draft.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="block text-sm">Situação<select className={field} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value === 'paid' ? 'paid' : 'pending' })}><option value="paid">Pago</option><option value="pending">Pendente</option></select></label><Button className="w-full" disabled={busy}><Check/>{busy ? 'Salvando…' : 'Confirmar e salvar'}</Button></form></DialogContent></Dialog>;
}