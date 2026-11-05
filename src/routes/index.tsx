import { createFileRoute } from '@tanstack/react-router';
import { LandingPage } from '@/components/patrion/LandingPage';
import { pageMeta } from '@/lib/meta';
export const Route = createFileRoute('/')({ head: () => pageMeta('PATRION · Controle financeiro com inteligência artificial', 'Organize receitas, despesas e contas fixas, converse com uma IA sobre seu dinheiro e acompanhe sua evolução no PATRION.'), component: LandingPage });
