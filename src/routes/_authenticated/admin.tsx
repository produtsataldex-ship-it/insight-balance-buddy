import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/patrion/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — Patrion" }, { name: "description", content: "Administração no Patrion." }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Administração" />
      <div className="surface p-6 text-sm text-muted-foreground">Esta área ainda está em construção.</div>
    </AppShell>
  );
}
