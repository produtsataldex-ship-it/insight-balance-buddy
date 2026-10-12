import { createFileRoute } from '@tanstack/react-router';
import { AccessPage } from '@/components/patrion/AccessPage';
import { pageMeta } from '@/lib/meta';
export const Route=createFileRoute('/')({head:()=>pageMeta('Patrion · Seu dinheiro, com clareza','Acesse seu controle financeiro pessoal Patrion com segurança e convite exclusivo.'),component:AccessPage});
