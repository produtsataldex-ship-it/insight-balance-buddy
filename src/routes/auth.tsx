import { createFileRoute } from '@tanstack/react-router';
import { AccessPage } from '@/components/patrion/AccessPage';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/auth')({
 validateSearch: (s: Record<string,unknown>): {redirect?:string} => ({redirect:typeof s['redirect']==='string'?s['redirect']:undefined}),
 head:()=>pageMeta('Entrar','Entre no Patrion ou ative seu acesso exclusivo com um convite.'),
 component: AuthPage,
});
function AuthPage(){const {redirect}=Route.useSearch();return <AccessPage redirect={redirect}/>;}
