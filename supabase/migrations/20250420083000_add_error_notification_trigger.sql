-- Migration file for creating the error notification trigger

-- Ensure the http extension is enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Ensure pg_net is enabled (needed for Supabase Edge Function calls from triggers)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.notify_on_new_error()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to call pg_net
SET search_path = public
AS $$
DECLARE
  project_ref text := 'wzmatxgmswfwjuzhkvjk'; -- Replace with your project reference if different
  service_role_key text := current_setting('secrets.SERVICE_ROLE_KEY', true); -- Use secrets manager if available, or replace with env var access/hardcoding (not recommended)
  function_url text := 'https://' || project_ref || '.supabase.co/functions/v1/send-error-notification';
  payload jsonb;
  request_id bigint;
BEGIN
  -- Construct the JSON payload expected by the Edge Function
  -- Send the 'new' record which contains the inserted row data
  payload := jsonb_build_object('record', NEW);

  -- Perform the HTTP request to the Edge Function asynchronously
  -- We use pg_net.http_post for this
  -- Note: The SERVICE_ROLE_KEY needs to be accessible here. 
  -- Using current_setting relies on it being set in Supabase secrets.
  -- Alternatively, pass it directly (less secure) or handle auth differently.
  SELECT net.http_post(
      url := function_url,
      body := payload,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
      )
  )
  INTO request_id;

  -- Check if request was queued successfully (pg_net returns the request id)
  IF request_id IS NULL THEN
    RAISE WARNING '[notify_on_new_error] Failed to queue HTTP request to Edge Function.';
  ELSE 
    RAISE LOG '[notify_on_new_error] Queued request % to Edge Function.', request_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on the 'errors' table
DROP TRIGGER IF EXISTS on_new_error_notify ON public.errors;
CREATE TRIGGER on_new_error_notify
  AFTER INSERT ON public.errors
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_error();

-- Optional: Grant usage on pg_net schema to postgres role if needed (often default)
-- GRANT USAGE ON SCHEMA net TO postgres;
-- GRANT USAGE ON SCHEMA net TO authenticated; -- Depending on execution context
-- GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer, resolve_ip_address boolean, request_id bigint) TO postgres; 