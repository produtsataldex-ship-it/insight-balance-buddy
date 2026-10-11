import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/patrion/AppShell";

export const Route = createFileRoute("/_authenticated/movimentacoes")({
  head: () => ({ meta: [{ title: "Movimentações — Patrion" }, { name: "description", content: "Movimentações no Patrion." }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Movimentações" />
      <div className="surface p-6 text-sm text-muted-foreground">Esta área ainda está em construção.</div>
    </AppShell>
  );
}
