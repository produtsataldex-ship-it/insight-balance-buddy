import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, BarChart3, CalendarClock, Check, ChevronLeft, ChevronRight, CreditCard, History, LayoutDashboard, LineChart, MessageCircle, Mic, PieChart, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react';
import { PatrionLogo } from './PatrionLogo';
import { PwaInstallButton } from './PwaInstall';
import { Button } from '@/components/ui/button';
import { whatsappLink, PLANS } from '@/lib/plans';

const BENEFITS = [
  [Wallet, 'Receitas e despesas'], [CalendarClock, 'Contas fixas'], [CreditCard, 'Assinaturas'], [Sparkles, 'Assistente com IA'],
  [Mic, 'Registro por voz'], [MessageCircle, 'Conversas inteligentes'], [BarChart3, 'Relatórios e gráficos'], [Target, 'Metas financeiras'],
  [TrendingUp, 'Evolução'], [LineChart, 'Planejamento'], [History, 'Histórico organizado'], [LayoutDashboard, 'Painel personalizado'],
] as const;
const FEATURES = [
  { icon: Wallet, title: 'Controle financeiro', text: 'Veja receitas, despesas e saldo em um só lugar.' },
  { icon: Sparkles, title: 'IA inteligente', text: 'Converse e entenda seus números com explicações claras.' },
  { icon: Mic, title: 'Registro por voz', text: '“Gastei 32 reais de Uber.” Revise e confirme.' },
  { icon: CalendarClock, title: 'Despesas fixas', text: 'Vencimentos, contas pagas e atrasadas organizados.' },
  { icon: PieChart, title: 'Gráficos', text: 'Categorias e comparações visuais com seus dados reais.' },
  { icon: Target, title: 'Metas', text: 'Saiba quanto pode separar para seus objetivos.' },
  { icon: BarChart3, title: 'Relatórios', text: 'Entenda para onde o seu dinheiro está indo.' },
  { icon: TrendingUp, title: 'Evolução', text: 'Compare meses e acompanhe seu progresso.' },
];
const PAINS = ['Perder-se entre contas e vencimentos', 'Esquecer despesas', 'Não saber para onde o dinheiro vai', 'Dificuldade para organizar receitas e gastos', 'Planejar sem acompanhar resultados', 'Controles financeiros complicados'];

function Carousel({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null); const [index, setIndex] = useState(0);
  const count = Array.isArray(children) ? children.length : 1;
  const go = (d: number) => { const el = ref.current; if (!el) return; el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: 'smooth' }); };
  return <div className="relative">
    <div ref={ref} aria-label={label} onScroll={e => { const el = e.currentTarget; setIndex(Math.round(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth) * (count - 1))); }}
      className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    <div className="mt-2 flex items-center justify-between">
      <div className="flex gap-1.5">{Array.from({ length: count }, (_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />)}</div>
      <div className="flex gap-2"><Button size="icon" variant="outline" className="rounded-full" aria-label="Anterior" onClick={() => go(-1)}><ChevronLeft /></Button><Button size="icon" variant="outline" className="rounded-full" aria-label="Próximo" onClick={() => go(1)}><ChevronRight /></Button></div>
    </div>
  </div>;
}

export function LandingPage() {
  return <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <span className="flex items-center gap-2"><PatrionLogo size={32} /><span className="font-display text-lg text-gold-gradient">PATRION</span></span>
        <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
      </div>
    </header>

    <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 md:grid-cols-2 md:pt-24">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
      <div className="relative animate-fade-up">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-1 text-xs text-primary"><Sparkles className="size-3.5" />Finanças pessoais com inteligência artificial</p>
        <h1 className="text-4xl leading-[1.05] md:text-6xl">Sua vida financeira merece mais controle. <span className="text-gold-gradient">E muito menos complicação.</span></h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">O PATRION reúne organização financeira, inteligência artificial e acompanhamento de evolução em um único aplicativo.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="gold" size="xl"><a href="#planos">QUERO CONHECER O PATRION<ArrowRight /></a></Button>
          <Button asChild variant="outline" size="xl"><Link to="/auth">Já tenho uma conta — Entrar</Link></Button>
        </div>
        <div className="mt-4 max-w-xs"><PwaInstallButton className="w-full" /></div>
      </div>
      <PhoneMock />
    </section>

    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-3xl md:text-4xl">Tudo o que você recebe</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{BENEFITS.map(([Icon, label], i) =>
        <div key={label} className="surface rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1 animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-gold-gradient text-primary-foreground"><Icon className="size-5" /></span><p className="text-sm font-medium">{label}</p>
        </div>)}</div>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-3xl md:text-4xl">Veja o PATRION por dentro</h2>
      <div className="mt-8"><Carousel label="Funcionalidades">{FEATURES.map(f =>
        <article key={f.title} className="relative min-w-[78%] snap-start overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/15 p-6 shadow-gold sm:min-w-[45%] lg:min-w-[30%]">
          <f.icon className="size-9 text-primary" /><h3 className="mt-10 text-2xl">{f.title}</h3><p className="mt-2 text-muted-foreground">{f.text}</p>
        </article>)}</Carousel></div>
    </section>

    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
      <div><h2 className="text-3xl md:text-4xl">Menos confusão. Mais clareza. <span className="text-gold-gradient">Mais controle sobre seu dinheiro.</span></h2></div>
      <ul className="space-y-3">{PAINS.map(p => <li key={p} className="flex items-center gap-3 border-b border-border pb-3 text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /><span className="line-through decoration-primary/60">{p}</span></li>)}</ul>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="max-w-2xl text-3xl md:text-4xl">Não sabe como organizar suas finanças? <span className="text-gold-gradient">Simplesmente pergunte.</span></h2>
      <p className="mt-3 max-w-xl text-muted-foreground">Converse com o assistente em vez de interpretar planilhas. Ele usa somente os seus registros e explica como chegou a cada número.</p>
      <div className="mt-8 max-w-md space-y-2">
        <div className="ml-auto w-fit rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">Onde estou gastando mais?</div>
        <div className="w-fit max-w-[90%] rounded-3xl rounded-bl-md bg-card px-4 py-3 text-sm">Exemplo de resposta com um gráfico por categoria:
          <div className="mt-3 space-y-2">{[['Moradia', 80], ['Alimentação', 55], ['Transporte', 30]].map(([n, w]) => <div key={n}><p className="text-xs text-muted-foreground">{n}</p><div className="h-2 rounded-full bg-gold-gradient" style={{ width: `${w}%` }} /></div>)}</div>
        </div>
      </div>
    </section>

    <section id="planos" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
      <h2 className="text-3xl md:text-4xl">Planos</h2><p className="mt-2 text-muted-foreground">A contratação e a ativação são feitas pelo WhatsApp.</p>
      <div className="mt-8"><Carousel label="Planos">{PLANS.map(p =>
        <article key={p.id} className={`flex min-w-[85%] snap-start flex-col rounded-3xl border p-6 sm:min-w-[48%] ${p.highlight ? 'border-primary/60 bg-gradient-to-br from-primary/20 via-card to-card shadow-gold' : 'border-border bg-card'}`}>
          <p className="text-sm text-primary">{p.name}</p>
          <p className="mt-3 font-display text-4xl tabular-nums">{p.price}<span className="ml-1 text-base text-muted-foreground">{p.suffix}</span></p>
          {p.tagline && <p className="mt-2 text-sm">{p.tagline}</p>}
          <ul className="my-6 flex-1 space-y-2 text-sm">{p.items.map(i => <li key={i} className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />{i}</li>)}</ul>
          <Button asChild variant={p.highlight ? 'gold' : 'outline'} size="xl"><a href={whatsappLink(p.message)} target="_blank" rel="noopener noreferrer">{p.cta}</a></Button>
        </article>)}</Carousel></div>
    </section>

    <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">PATRION · Desenvolvido por Samuel J.M. · Não prometemos resultados financeiros.</footer>
  </div>;
}

function PhoneMock() {
  return <div className="relative mx-auto w-full max-w-[300px] animate-fade-up" aria-hidden>
    <div className="rounded-[2.5rem] border border-border bg-card p-3 shadow-gold">
      <div className="rounded-[2rem] bg-background p-5">
        <div className="flex items-center gap-2"><PatrionLogo size={28} /><span className="text-sm text-muted-foreground">Olá!</span></div>
        <p className="mt-6 text-xs text-muted-foreground">Saldo disponível</p><p className="font-display text-3xl text-gold-gradient">R$ ••••</p>
        <div className="mt-5 grid grid-cols-2 gap-2">{['Receitas', 'Despesas'].map(l => <div key={l} className="rounded-2xl bg-card p-3"><p className="text-[11px] text-muted-foreground">{l}</p><div className="mt-2 h-1.5 rounded-full bg-gold-gradient" /></div>)}</div>
        <div className="mt-5 flex justify-center"><span className="flex size-16 items-center justify-center rounded-full bg-gold-gradient text-primary-foreground motion-safe:animate-pulse"><Mic /></span></div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Toque e segure para falar</p>
      </div>
    </div>
  </div>;
}
