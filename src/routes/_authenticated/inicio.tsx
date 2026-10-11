import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/patrion/AppShell";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início — Patrion" }, { name: "description", content: "Início no Patrion." }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Início" />
      <div className="surface p-6 text-sm text-muted-foreground">Esta área ainda está em construção.</div>
    </AppShell>
  );
}
