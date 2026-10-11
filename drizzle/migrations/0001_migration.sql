create or replace function public.generate_recurring_occurrences(_until date default (current_date + 60))
returns int language plpgsql security invoker set search_path = public as $$
declare r record; d date; i int; n int := 0; step interval;
begin
  for r in select * from public.recurring_expenses where user_id = auth.uid() and active loop
    step := case r.frequency when 'weekly' then interval '7 days' when 'monthly' then interval '1 month' else interval '1 year' end;
    i := 0;
    d := r.start_date;
    while d <= _until and i < 400 loop
      insert into public.transactions (user_id, type, amount, description, category_id, occurred_on, status, recurring_id, source)
      values (r.user_id, 'expense', r.amount, r.name, r.category_id, d, 'pending', r.id, 'recurring')
      on conflict (recurring_id, occurred_on) do nothing;
      if found then n := n + 1; end if;
      i := i + 1;
      d := (r.start_date + step * i)::date;
    end loop;
  end loop;
  return n;
end; $$;