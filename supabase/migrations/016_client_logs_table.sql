-- Create client_logs table for remote logging
CREATE TABLE IF NOT EXISTS public.client_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info')),
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  screen TEXT,
  user_id UUID,
  app_version TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL
);

-- Add index for querying
CREATE INDEX IF NOT EXISTS idx_client_logs_user_id ON public.client_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_client_logs_event ON public.client_logs(event);
CREATE INDEX IF NOT EXISTS idx_client_logs_created_at ON public.client_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own logs"
  ON public.client_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous users to insert logs (for boot errors before auth)
CREATE POLICY "Anonymous users can insert logs"
  ON public.client_logs
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL OR user_id::text = 'anonymous');

-- Only allow reading logs by the user or admins (for future use)
CREATE POLICY "Users can read their own logs"
  ON public.client_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.client_logs IS 'Client-side error and event logs for debugging';
