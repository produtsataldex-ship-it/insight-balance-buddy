ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#D4AF37';
ALTER TABLE public.categories ADD CONSTRAINT categories_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
UPDATE public.categories SET color = CASE
  WHEN name ILIKE '%merc%' OR name ILIKE '%aliment%' THEN '#D4AF37'
  WHEN name ILIKE '%transp%' THEN '#C8873A'
  WHEN name ILIKE '%mora%' OR name ILIKE '%casa%' THEN '#B89435'
  WHEN name ILIKE '%saú%' OR name ILIKE '%sau%' THEN '#E3C77A'
  WHEN name ILIKE '%lazer%' THEN '#A8693C'
  WHEN kind = 'income' THEN '#F5F5F5'
  ELSE '#929292' END;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_seen_at timestamptz;

CREATE TABLE public.assistant_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_threads TO authenticated;
GRANT ALL ON public.assistant_threads TO service_role;
ALTER TABLE public.assistant_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own threads" ON public.assistant_threads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_active_user(auth.uid()));
CREATE INDEX assistant_threads_user_idx ON public.assistant_threads(user_id, updated_at DESC);

ALTER TABLE public.assistant_messages ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.assistant_threads(id) ON DELETE CASCADE;
CREATE INDEX assistant_messages_thread_idx ON public.assistant_messages(thread_id, created_at);

INSERT INTO public.assistant_threads (user_id, title)
SELECT DISTINCT user_id, 'Conversa anterior' FROM public.assistant_messages WHERE thread_id IS NULL;
UPDATE public.assistant_messages m SET thread_id = t.id FROM public.assistant_threads t
WHERE m.thread_id IS NULL AND t.user_id = m.user_id AND t.title = 'Conversa anterior';