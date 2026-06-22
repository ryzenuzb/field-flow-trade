
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info','warning','error','critical')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs (severity);
CREATE INDEX idx_error_logs_resolved ON public.error_logs (resolved);
CREATE INDEX idx_error_logs_function ON public.error_logs (function_name);

GRANT SELECT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sub_admin'));

CREATE POLICY "Admins update error logs"
  ON public.error_logs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sub_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sub_admin'));

CREATE POLICY "Admins delete error logs"
  ON public.error_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Helper RPC: log error from any context safely
CREATE OR REPLACE FUNCTION public.log_error(
  p_function TEXT,
  p_severity TEXT,
  p_message TEXT,
  p_stack TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_user UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.error_logs(function_name, severity, message, stack, context, user_id)
  VALUES (p_function, COALESCE(p_severity,'error'), LEFT(COALESCE(p_message,'unknown'),5000), p_stack, COALESCE(p_context,'{}'::jsonb), p_user)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_error(TEXT,TEXT,TEXT,TEXT,JSONB,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_error(TEXT,TEXT,TEXT,TEXT,JSONB,UUID) TO service_role;
