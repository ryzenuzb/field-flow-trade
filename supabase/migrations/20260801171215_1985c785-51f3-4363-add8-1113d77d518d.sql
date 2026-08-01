CREATE TABLE public.login_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  phone text,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.login_otp_codes TO service_role;

ALTER TABLE public.login_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to login_otp_codes"
ON public.login_otp_codes
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX idx_login_otp_user_created ON public.login_otp_codes (user_id, created_at DESC);
CREATE INDEX idx_login_otp_expires ON public.login_otp_codes (expires_at);