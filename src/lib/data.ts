import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Transaction = Tables<"transactions">;
export type Category = Tables<"categories">;
export type Recurring = Tables<"recurring_expenses">;
export type UserTool = Tables<"user_tools">;
export type Profile = Tables<"profiles">;

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

function check<T>(res: { data: T; error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const id = await uid();
      return check(await supabase.from("profiles").select("*").eq("id", id).maybeSingle());
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const id = await uid();
      const { data } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
      return !!data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"profiles">) => {
      const id = await uid();
      check(await supabase.from("profiles").update(patch).eq("id", id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () =>
      check(await supabase.from("transactions").select("*").order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(5000)),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => check(await supabase.from("categories").select("*").order("name")),
  });
}

export function useRecurring() {
  return useQuery({
    queryKey: ["recurring"],
    queryFn: async () => check(await supabase.from("recurring_expenses").select("*").order("name")),
  });
}

export function useTools() {
  return useQuery({
    queryKey: ["tools"],
    queryFn: async () => check(await supabase.from("user_tools").select("*").order("position").order("created_at")),
  });
}

function invalidateFinance(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["recurring"] });
}

export function useSaveTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<TablesInsert<"transactions">, "user_id">[]) => {
      const user_id = await uid();
      check(await supabase.from("transactions").insert(rows.map((r) => ({ ...r, user_id }))));
    },
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"transactions"> }) => {
      check(await supabase.from("transactions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id));
    },
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      check(await supabase.from("transactions").delete().eq("id", id));
    },
    onSuccess: () => invalidateFinance(qc),
  });
}

export async function generateRecurring() {
  await supabase.rpc("generate_recurring_occurrences", {});
}

export function useSaveRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Omit<TablesInsert<"recurring_expenses">, "user_id"> }) => {
      const user_id = await uid();
      if (id) {
        check(await supabase.from("recurring_expenses").update(values).eq("id", id));
        // Future pending occurrences follow the new rule.
        check(
          await supabase
            .from("transactions")
            .delete()
            .eq("recurring_id", id)
            .eq("status", "pending")
            .gte("occurred_on", new Date().toISOString().slice(0, 10)),
        );
      } else {
        check(await supabase.from("recurring_expenses").insert({ ...values, user_id }));
      }
      await generateRecurring();
    },
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      check(await supabase.from("recurring_expenses").delete().eq("id", id));
    },
    onSuccess: () => invalidateFinance(qc),
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id?: string; name: string; kind: "income" | "expense"; icon?: string }) => {
      const user_id = await uid();
      if (v.id) check(await supabase.from("categories").update({ name: v.name, icon: v.icon }).eq("id", v.id));
      else check(await supabase.from("categories").insert({ name: v.name, kind: v.kind, icon: v.icon ?? "tag", user_id }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.from("categories").delete().eq("id", id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useSaveTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id?: string; name: string; description: string; url: string; icon: string; position?: number }) => {
      const user_id = await uid();
      const { id, ...rest } = v;
      if (id) check(await supabase.from("user_tools").update(rest).eq("id", id));
      else check(await supabase.from("user_tools").insert({ ...rest, user_id }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }),
  });
}

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.from("user_tools").delete().eq("id", id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }),
  });
}
