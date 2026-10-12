import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Copy, Ban, ShieldCheck, Users, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/patrion/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsAdmin } from '@/lib/data';
import { supabase } from '@/integrations/supabase/client';
import { getAdminOverview } from '@/lib/admin.functions';
import { pageMeta } from '@/lib/meta';
export const Route=createFileRoute('/_authenticated/admin')({head:()=>pageMeta('Administração','Gerencie os convites e os acessos ao Patrion.'),component:AdminPage});
function AdminPage(){
 const {data:admin,isPending}=useIsAdmin(); const qc=useQueryClient(); const overview=useServerFn(getAdminOverview); const [count,setCount]=useState(1); const [busy,setBusy]=useState(false);
 const codes=useQuery({queryKey:['access-codes'],enabled:!!admin,queryFn:async()=>{const {data,error}=await supabase.from('access_codes').select('*').order('created_at',{ascending:false});if(error)throw error;return data;}});
 const users=useQuery({queryKey:['admin-users'],enabled:!!admin,queryFn:()=>overview()});
 async function generate(){setBusy(true);try{const {error}=await supabase.rpc('create_access_codes',{_count:count});if(error)throw error;await qc.invalidateQueries({queryKey:['access-codes']});toast.success('Convites criados.');}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível gerar os códigos.');}finally{setBusy(false);}}
 async function revoke(id:string){if(!window.confirm('Revogar este convite?'))return;const {error}=await supabase.rpc('revoke_access_code',{_id:id});if(error)toast.error(error.message);else{await qc.invalidateQueries({queryKey:['access-codes']});toast.success('Convite revogado.');}}
 return <AppShell wide><PageHeader title="Administração" subtitle="PATRION · Acesso exclusivo"/>{isPending?<p>Verificando acesso…</p>:!admin?<p role="alert">Acesso restrito à administração.</p>:<>
  <div className="mb-8 grid grid-cols-2 gap-4"><div className="surface p-5"><Users className="mb-3 size-5 text-primary"/><p className="text-3xl">{users.data?.length??'—'}</p><p className="text-sm text-muted-foreground">Usuários</p></div><div className="surface p-5"><KeyRound className="mb-3 size-5 text-primary"/><p className="text-3xl">{codes.data?.filter(c=>!c.used_at&&!c.revoked_at).length??'—'}</p><p className="text-sm text-muted-foreground">Convites disponíveis</p></div></div>
  <section className="mb-10"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">Códigos de acesso</h2><div className="flex items-center gap-2"><Input type="number" aria-label="Quantidade de códigos" className="w-20" min={1} max={50} value={count} onChange={e=>setCount(Math.min(50,Math.max(1,Number(e.target.value))))}/><Button onClick={generate} disabled={busy}><Plus/>Gerar códigos</Button></div></div>
   {(codes.error||users.error)&&<p role="alert" className="mb-4 text-sm text-destructive">Não foi possível carregar todos os dados. Tente novamente.</p>}
   {codes.isPending?<p className="text-muted-foreground">Carregando convites…</p>:codes.data?.length===0?<p className="border-y border-border py-8 text-sm text-muted-foreground">Nenhum convite criado.</p>:<div className="divide-y divide-border">{codes.data?.map(c=><div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-mono text-lg text-primary">{c.code}</p><p className="mt-1 text-xs text-muted-foreground">{c.revoked_at?'Revogado':c.used_at?'Utilizado':'Disponível'} · {new Date(c.created_at).toLocaleDateString('pt-BR')}</p></div>{!c.used_at&&!c.revoked_at&&<div className="flex gap-2"><Button variant="ghost" size="icon" aria-label={`Copiar ${c.code}`} title="Copiar código" onClick={async()=>{try{await navigator.clipboard.writeText(c.code);toast.success('Código copiado.');}catch{toast.error('Não foi possível copiar.');}}}><Copy/></Button><Button variant="ghost" size="icon" aria-label={`Revogar ${c.code}`} title="Revogar código" onClick={()=>revoke(c.id)}><Ban/></Button></div>}</div>)}</div>}
  </section><section><h2 className="mb-4 flex items-center gap-2 text-xl"><ShieldCheck className="size-5 text-primary"/>Usuários</h2><div className="divide-y divide-border">{users.data?.map(u=><div key={u.id} className="flex flex-wrap justify-between gap-2 py-4"><div><p>{u.display_name||'Sem nome'}</p><p className="break-all text-sm text-muted-foreground">{u.email}</p></div><span className="text-xs text-primary">{u.status==='active'?'Ativo':'Bloqueado'}</span></div>)}</div></section>
 </>}</AppShell>;
}
