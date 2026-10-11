import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/patrion/AppShell";

export const Route = createFileRoute("/_authenticated/assistente")({
  head: () => ({ meta: [{ title: "Assistente — Patrion" }, { name: "description", content: "Assistente no Patrion." }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Assistente" />
      <div className="surface p-6 text-sm text-muted-foreground">Esta área ainda está em construção.</div>
    </AppShell>
  );
}
