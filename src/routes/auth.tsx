import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PatrionLogo } from "@/components/patrion/PatrionLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s["mode"] === "signup" ? ("signup" as const) : ("signin" as const),
    redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Patrion" },
      { name: "description", content: "Entre ou crie sua conta no Patrion." },
      { property: "og:title", content: "Entrar — Patrion" },
      { property: "og:description", content: "Entre ou crie sua conta no Patrion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
      });
      setMsg(error ? error.message : "Conta criada. Confirme pelo link enviado ao seu e-mail.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("E-mail ou senha inválidos.");
      else navigate({ to: "/inicio", replace: true });
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <PatrionLogo size={72} state="intro" />
        <h1 className="text-3xl">{mode === "signup" ? "Criar conta" : "Entrar"}</h1>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />}
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha (mín. 6)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <Button type="submit" variant="gold" size="xl" className="w-full" disabled={busy}>
          {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
      </form>
      <button className="mt-6 text-sm text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Já tenho conta" : "Criar uma conta"}
      </button>
    </div>
  );
}
