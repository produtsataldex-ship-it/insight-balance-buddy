import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const getAdminOverview=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:allowed,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(error || !allowed) throw new Error('Acesso restrito à administração.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:users,error:queryError}=await supabaseAdmin.from('profiles').select('id,display_name,email,status,created_at,last_seen_at').order('created_at',{ascending:false}).limit(200);
 if(queryError) throw new Error('Não foi possível carregar os usuários.');
 return users ?? [];
});
