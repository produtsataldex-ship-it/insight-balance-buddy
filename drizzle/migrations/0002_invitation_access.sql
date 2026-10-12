CREATE TABLE public.access_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{7}$'),
 created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 used_by uuid,
 used_at timestamptz,
 revoked_at timestamptz
);
GRANT SELECT ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read access codes" ON public.access_codes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.create_access_codes(_count integer DEFAULT 1)
RETURNS SETOF public.access_codes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE generated text; new_row public.access_codes; i integer; j integer; alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; bytes bytea;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso restrito à administração'; END IF;
 IF _count < 1 OR _count > 50 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
 FOR i IN 1.._count LOOP
  LOOP
   generated := ''; bytes := extensions.gen_random_bytes(32); j := 0;
   WHILE length(generated) < 7 LOOP
    IF j >= length(bytes) THEN bytes := extensions.gen_random_bytes(32); j := 0; END IF;
    IF get_byte(bytes,j) < 252 THEN generated := generated || substr(alphabet, (get_byte(bytes,j) % 36) + 1, 1); END IF;
    j := j + 1;
   END LOOP;
   INSERT INTO public.access_codes(code,created_by) VALUES(generated,auth.uid()) ON CONFLICT(code) DO NOTHING RETURNING * INTO new_row;
   EXIT WHEN new_row.id IS NOT NULL;
  END LOOP;
  RETURN NEXT new_row;
 END LOOP;
 INSERT INTO public.audit_logs(actor_id,action,details) VALUES(auth.uid(),'create_access_codes',jsonb_build_object('count',_count));
END;
$$;
REVOKE ALL ON FUNCTION public.create_access_codes(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_access_codes(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_access_code(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito à administração'; END IF;
 UPDATE public.access_codes SET revoked_at=now() WHERE id=_id AND used_at IS NULL AND revoked_at IS NULL;
 INSERT INTO public.audit_logs(actor_id,action,details) VALUES(auth.uid(),'revoke_access_code',jsonb_build_object('code_id',_id));
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_access_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_access_code(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.require_signup_invitation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE invite text;
BEGIN
 invite := upper(trim(coalesce(new.raw_user_meta_data->>'access_code','')));
 IF invite !~ '^[A-Z0-9]{7}$' THEN RAISE EXCEPTION 'Código de acesso inválido ou indisponível'; END IF;
 UPDATE public.access_codes SET used_by=new.id, used_at=now()
 WHERE code=invite AND used_at IS NULL AND revoked_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Código de acesso inválido ou indisponível'; END IF;
 new.raw_user_meta_data := new.raw_user_meta_data - 'access_code';
 RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.require_signup_invitation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER require_invitation_before_signup BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.require_signup_invitation();