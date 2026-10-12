import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, KeyRound, LockKeyhole, Mail, UserRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PatrionLogo } from './PatrionLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidAccessCode, normalizeAccessCode, safeDestination } from '@/lib/access';

export function AccessPage({ redirect }: {redirect?:string}) {
 const navigate = useNavigate();
 const [activation,setActivation] = useState(false);
 const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [name,setName] = useState(''); const [code,setCode] = useState('');
 const [visible,setVisible] = useState(false); const [busy,setBusy] = useState(false); const [message,setMessage] = useState(''); const [confirmed,setConfirmed] = useState(false);
 useEffect(()=>{ void supabase.auth.getUser().then(({data})=>{if(data.user) void navigate({to:'/inicio',replace:true});}); },[navigate]);
 async function submit(e:React.FormEvent) {
  e.preventDefault(); setMessage('');
  if(activation && !isValidAccessCode(code)){setMessage('Informe um código de 7 caracteres, com letras e números.');return;}
  setBusy(true);
  try {
   if(activation){
    const {error} = await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin,data:{display_name:name.trim(),access_code:normalizeAccessCode(code)}}});
    if(error) throw new Error(error.message.includes('Database') ? 'Código inválido, utilizado ou revogado. Confira seu convite.' : error.message);
    setConfirmed(true); setMessage('Acesso ativado. Confira seu e-mail para confirmar a conta antes de entrar.');
   } else {
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error) throw new Error('Não foi possível entrar. Confira seu e-mail, senha e a confirmação da conta.');
    window.location.assign(safeDestination(redirect));
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível conectar. Tente novamente.');}finally{setBusy(false);}
 }
 return <div className="min-h-dvh bg-background px-6 py-10 flex flex-col items-center justify-center">
  <div className="w-full max-w-sm">
   <div className="mb-10 flex flex-col items-center text-center"><PatrionLogo size={86} state="intro"/><h1 className="mt-5 text-4xl text-gold-gradient">PATRION</h1><p className="mt-2 text-sm text-muted-foreground">Seu dinheiro, com clareza.</p></div>
   <div className="mb-6"><h2 className="text-2xl">{activation?'Ativar meu acesso':'Bem-vindo de volta'}</h2><p className="mt-2 text-sm text-muted-foreground">{activation?'Um novo começo para suas finanças.':'Tudo que importa, em um só lugar.'}</p></div>
   {confirmed ? <div className="space-y-5"><ShieldCheck className="size-8 text-primary"/><p role="status" className="text-sm leading-relaxed">{message}</p><Button className="w-full" onClick={()=>{setActivation(false);setConfirmed(false);setMessage('');}}>Ir para o login <ArrowRight/></Button></div> : <form onSubmit={submit} className="space-y-4">
    {activation && <><label className="block text-xs text-muted-foreground">Código de acesso<div className="relative mt-2"><KeyRound className="absolute left-3 top-3 size-5 text-primary"/><Input aria-label="Código de acesso" autoComplete="off" value={code} onChange={e=>setCode(normalizeAccessCode(e.target.value))} maxLength={7} placeholder="XXXXXXX" required className="pl-11 uppercase font-mono"/></div></label><label className="block text-xs text-muted-foreground">Nome<div className="relative mt-2"><UserRound className="absolute left-3 top-3 size-5"/><Input aria-label="Nome" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required className="pl-11"/></div></label></>}
    <label className="block text-xs text-muted-foreground">E-mail<div className="relative mt-2"><Mail className="absolute left-3 top-3 size-5"/><Input aria-label="E-mail" autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="pl-11" placeholder="voce@email.com"/></div></label>
    <label className="block text-xs text-muted-foreground">Senha<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 size-5"/><Input aria-label="Senha" type={visible?'text':'password'} autoComplete={activation?'new-password':'current-password'} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required className="pl-11 pr-12" placeholder="Sua senha"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0.5" title={visible?'Ocultar senha':'Mostrar senha'} aria-label={visible?'Ocultar senha':'Mostrar senha'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff/>:<Eye/>}</Button></div></label>
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <Button variant="gold" size="xl" className="mt-2 w-full" disabled={busy}>{busy?'Aguarde…':activation?'Ativar acesso':'Entrar'}<ArrowRight/></Button>
   </form>}
   {!confirmed && <Button variant="link" className="mt-5 w-full" onClick={()=>{setActivation(!activation);setMessage('');}}>{activation?'Voltar ao login':'Tenho um código de acesso'}</Button>}
   <div className="mt-10 flex items-center justify-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary"/>Acesso exclusivo. Finanças pessoais.</div>
  </div>
 </div>;
}
