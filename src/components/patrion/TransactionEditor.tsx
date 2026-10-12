import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useSaveTransactions, useUpdateTransaction, type Transaction } from '@/lib/data';
import { todayISO, splitInstallments, addMonths } from '@/lib/finance';
import { PAYMENT_METHODS } from '@/lib/format';
export function TransactionEditor({transaction,onClose}:{transaction?:Transaction|undefined;onClose:()=>void}){
 const [type,setType]=useState(transaction?.type??'expense');const [amount,setAmount]=useState(String(transaction?.amount??''));const [description,setDescription]=useState(transaction?.description??'');const [date,setDate]=useState(transaction?.occurred_on??todayISO());const [status,setStatus]=useState(transaction?.status??'paid');const [category,setCategory]=useState(transaction?.category_id??'');const [method,setMethod]=useState(transaction?.payment_method??'Pix');const [installments,setInstallments]=useState(1);
 const categories=useCategories();const save=useSaveTransactions();const update=useUpdateTransaction();
 async function submit(e:React.FormEvent){e.preventDefault();const value=Number(amount.replace(',','.'));if(!Number.isFinite(value)||value<=0){toast.error('Informe um valor maior que zero.');return;}try{
 const base={type,description:description.trim(),amount:value,occurred_on:date,status,category_id:category||null,payment_method:method,paid_at:status==='paid'?new Date().toISOString():null};
 if(transaction)await update.mutateAsync({id:transaction.id,patch:base});else{const group=installments>1?crypto.randomUUID():null;await save.mutateAsync(splitInstallments(value,installments).map((part,i)=>({...base,amount:part,occurred_on:addMonths(date,i),status:i>0?'pending':status,paid_at:i>0?null:base.paid_at,installment_group:group,installment_number:installments>1?i+1:null,installment_total:installments>1?installments:null,client_request_id:crypto.randomUUID()})));}toast.success('Movimentação salva.');onClose();
 }catch(e){toast.error(e instanceof Error?e.message:'Não foi possível salvar.');}}
 const field='h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground';
 return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={transaction?'Editar movimentação':'Nova movimentação'}><form onSubmit={submit} className="surface max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto p-6"><div className="flex items-center justify-between"><h2 className="text-xl">{transaction?'Editar':'Nova'} movimentação</h2><Button type="button" variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}><X/></Button></div>
 <label className="block text-sm">Tipo<select className={field+' mt-2'} value={type} onChange={e=>{setType(e.target.value);setCategory('');}}><option value="expense">Despesa</option><option value="income">Receita</option><option value="transfer">Transferência</option></select></label>
 <label className="block text-sm">Valor (R$)<Input className="mt-2" aria-label="Valor" inputMode="decimal" placeholder="0,00" value={amount} onChange={e=>setAmount(e.target.value)} required/></label>
 <label className="block text-sm">Descrição<Input className="mt-2" aria-label="Descrição" value={description} onChange={e=>setDescription(e.target.value)} required/></label>
 <div className="grid grid-cols-2 gap-3"><label className="text-sm">Data<Input className="mt-2" aria-label="Data" type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="text-sm">Situação<select className={field+' mt-2'} value={status} onChange={e=>setStatus(e.target.value)}><option value="paid">Pago</option><option value="pending">Pendente</option></select></label></div>
 <label className="block text-sm">Categoria<select className={field+' mt-2'} value={category} onChange={e=>setCategory(e.target.value)}><option value="">Sem categoria</option>{categories.data?.filter(c=>c.kind===type).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <div className="grid grid-cols-2 gap-3"><label className="text-sm">Pagamento<select className={field+' mt-2'} value={method} onChange={e=>setMethod(e.target.value)}>{PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}</select></label>{!transaction&&<label className="text-sm">Parcelas<Input aria-label="Parcelas" className="mt-2" type="number" min={1} max={60} value={installments} onChange={e=>setInstallments(Math.min(60,Math.max(1,Number(e.target.value))))}/></label>}</div>
 <Button type="submit" className="w-full" disabled={save.isPending||update.isPending}><Check/>{save.isPending||update.isPending?'Salvando…':'Salvar'}</Button></form></div>;
}
