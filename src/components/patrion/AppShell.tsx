import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ArrowLeftRight, MessageCircle, UserRound, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { PatrionLogo } from "./PatrionLogo";
import { useIsAdmin } from "@/lib/data";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/assistente", label: "Assistente", icon: MessageCircle },
  { to: "/conta", label: "Minha conta", icon: UserRound },
] as const;

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin } = useIsAdmin();

  return (
    <div className="min-h-dvh bg-background md:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar p-5 md:flex">
        <Link to="/inicio" className="mb-8 flex items-center gap-3">
          <PatrionLogo size={36} />
          <span className="font-display text-xl text-gold-gradient">PATRION</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => {
            const active = path.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "pressable flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <t.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {t.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "pressable mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                path.startsWith("/admin") ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Shield className="size-5" /> Administração
            </Link>
          )}
        </nav>
      </aside>

      <main
        key={path}
        className={cn("mx-auto w-full px-4 pt-[calc(var(--safe-top)+1.25rem)] pb-[calc(var(--safe-bottom)+6.5rem)] animate-fade-up md:pb-12", wide ? "max-w-6xl" : "max-w-3xl")}
      >
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 pb-safe backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((t) => {
            const active = path.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? "page" : undefined}
                className="pressable relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px]"
              >
                <span
                  className={cn(
                    "absolute top-0 h-0.5 rounded-full bg-primary transition-all duration-300",
                    active ? "w-8 opacity-100" : "w-0 opacity-0",
                  )}
                />
                <t.icon
                  className={cn("size-6 transition-all duration-300", active ? "scale-110 text-primary" : "text-muted-foreground")}
                  strokeWidth={active ? 2.2 : 1.7}
                />
                <span className={active ? "text-primary" : "text-muted-foreground"}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <h1 className="truncate text-3xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}
