-- Initial schema migration for Errly
-- Creates users, projects, and errors tables with appropriate relationships

-- Users table to store profile information
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for this table
    supabase_auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, -- Link to Supabase Auth user
    email text NOT NULL,
    phone_number text, -- Optional phone number for notifications
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON public.users 
    FOR ALL USING (auth.uid() = supabase_auth_id);
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Projects table
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Foreign key to Supabase Auth user
    name text NOT NULL,
    api_key uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_notified_at timestamp with time zone
);

-- Add RLS policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own projects" ON public.projects 
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all projects" ON public.projects
    FOR ALL USING (auth.role() = 'service_role');

-- Errors table
CREATE TABLE public.errors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL, -- Foreign key to projects table
    message text NOT NULL,
    stack_trace text,
    metadata jsonb,
    received_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for errors
ALTER TABLE public.errors ENABLE ROW LEVEL SECURITY;

-- Users can select/view errors from their own projects
CREATE POLICY "Users can select errors from their projects" ON public.errors
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- API key based insert via service role only
CREATE POLICY "Service role can insert errors" ON public.errors
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role can manage all errors
CREATE POLICY "Service role can manage all errors" ON public.errors
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger to automatically create a user profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
-- Keep SECURITY DEFINER as it might be needed for accessing auth.users depending on grants
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  phone_number_value text;
BEGIN
  -- Log the raw metadata received
  RAISE NOTICE 'handle_new_user trigger fired for user: %, email: %', NEW.id, NEW.email;
  RAISE NOTICE 'Raw user meta data: %', NEW.raw_user_meta_data;

  -- Extract phone_number from user_metadata if available
  phone_number_value := (NEW.raw_user_meta_data->>'phone_number')::text;
  RAISE NOTICE 'Extracted phone_number_value: %', phone_number_value;

  -- Temporarily bypass RLS for this insert
  SET LOCAL session_replication_role = replica; 

  -- Insert new user record with phone number if available
  RAISE NOTICE 'Attempting to insert into public.users with phone: % (RLS bypassed)', phone_number_value;
  INSERT INTO public.users (supabase_auth_id, email, phone_number)
  VALUES (NEW.id, NEW.email, phone_number_value);
  RAISE NOTICE 'Insert into public.users completed for user: %', NEW.id;

  -- Reset session replication role back to default
  SET LOCAL session_replication_role = origin; 

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Index to improve query performance
CREATE INDEX errors_project_id_idx ON public.errors(project_id);
CREATE INDEX errors_received_at_idx ON public.errors(received_at DESC);
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX users_supabase_auth_id_idx ON public.users(supabase_auth_id);
