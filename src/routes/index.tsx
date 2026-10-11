import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mic, ShieldCheck, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PatrionLogo, SplashScreen } from "@/components/patrion/PatrionLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patrion — Controle financeiro inteligente" },
      { name: "description", content: "Registre gastos por voz ou texto, acompanhe receitas, contas fixas e saldo previsto." },
      { property: "og:title", content: "Patrion — Controle financeiro inteligente" },
      { property: "og:description", content: "Registre gastos por voz ou texto e saiba exatamente quanto tem disponível." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
      else setTimeout(() => setChecking(false), 500);
    });
  }, [navigate]);

  if (checking) return <SplashScreen />;

  const features = [
    { icon: Mic, title: "Fale, e está registrado", text: "“Gastei 32 reais de Uber.” Você confirma, o Patrion salva." },
    { icon: CalendarClock, title: "Contas fixas sob controle", text: "Vencimentos, pagamentos e saldo previsto em um só lugar." },
    { icon: ShieldCheck, title: "Seus dados, só seus", text: "Cada conta acessa apenas os próprios registros." },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(var(--safe-top)+3rem)] pb-[calc(var(--safe-bottom)+2rem)]">
      <div className="flex flex-1 flex-col items-center text-center">
        <PatrionLogo size={112} state="intro" className="shadow-gold rounded-full" />
        <h1 className="mt-8 text-5xl text-gold-gradient">PATRION</h1>
        <p className="mt-3 text-lg text-muted-foreground">Seu dinheiro, com clareza.</p>
        <div className="mt-10 w-full space-y-3 text-left">
          {features.map((f, i) => (
            <div key={f.title} className="surface flex gap-4 p-4 animate-fade-up" style={{ animationDelay: `${150 + i * 90}ms` }}>
              <f.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-display text-base">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 space-y-3">
        <Button asChild variant="gold" size="xl" className="w-full">
          <Link to="/auth" search={{ mode: "signup" }}>Criar conta</Link>
        </Button>
        <Button asChild variant="outline" size="xl" className="w-full">
          <Link to="/auth" search={{ mode: "signin" }}>Já tenho conta</Link>
        </Button>
      </div>
    </div>
  );
}
