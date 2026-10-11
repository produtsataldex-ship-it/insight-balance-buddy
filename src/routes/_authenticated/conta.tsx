import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/patrion/AppShell";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({ meta: [{ title: "Minha conta — Patrion" }, { name: "description", content: "Minha conta no Patrion." }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Minha conta" />
      <div className="surface p-6 text-sm text-muted-foreground">Esta área ainda está em construção.</div>
    </AppShell>
  );
}
