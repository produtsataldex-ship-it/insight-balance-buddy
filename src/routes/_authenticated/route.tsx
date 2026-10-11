import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateRecurring } from "@/lib/data";
import { SplashScreen } from "@/components/patrion/PatrionLogo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  pendingComponent: () => <SplashScreen />,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  useEffect(() => {
    const key = `patrion-boot-${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    void generateRecurring();
  }, [user.id]);
  return <Outlet />;
}
