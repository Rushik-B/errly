

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_aggregated_errors"("project_id_param" "uuid", "start_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "page_param" integer DEFAULT 1, "limit_param" integer DEFAULT 20) RETURNS TABLE("message" "text", "level" "text", "count" bigint, "last_seen" timestamp with time zone, "representative_id" "uuid", "trend" "jsonb", "total_groups" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    _start_date timestamptz := COALESCE(start_date_param, NOW() - INTERVAL '24 hours');
    _end_date timestamptz := COALESCE(end_date_param, NOW());
BEGIN
    RETURN QUERY
    WITH filtered_errors AS (
        SELECT
            id,
            message,
            level,
            received_at
        FROM public.errors
        WHERE project_id = project_id_param
          AND received_at >= _start_date
          AND received_at <= _end_date
    ),
    -- Generate hourly time buckets within the calculated range
    time_buckets AS (
        SELECT generate_series(
                   date_trunc('hour', _start_date),
                   date_trunc('hour', _end_date),
                   INTERVAL '1 hour'
               ) AS hour_bucket
    ),
    -- Calculate hourly counts for each error group
    hourly_counts_per_group AS (
        SELECT
            f.message,
            f.level,
            t.hour_bucket,
            COUNT(f.id) AS hourly_count
        FROM time_buckets t
        LEFT JOIN filtered_errors f ON date_trunc('hour', f.received_at) = t.hour_bucket
        WHERE f.message IS NOT NULL AND f.level IS NOT NULL -- Ensure we only join actual errors
        GROUP BY f.message, f.level, t.hour_bucket
    ),
    -- Aggregate hourly counts into a JSON array for each group
    grouped_errors AS (
        SELECT
            f.message,
            f.level,
            COUNT(f.id) AS total_count,
            MAX(f.received_at) AS last_seen,
            (array_agg(f.id ORDER BY f.received_at DESC))[1] AS representative_id,
            -- Aggregate hourly counts into a JSONB array, ordered by time
            jsonb_agg(
                jsonb_build_object('time', hc.hour_bucket, 'count', hc.hourly_count)
                ORDER BY hc.hour_bucket ASC
            ) FILTER (WHERE hc.hour_bucket IS NOT NULL) AS trend_data
        FROM filtered_errors f
        -- Left join pre-calculated hourly counts for this specific group
        LEFT JOIN hourly_counts_per_group hc ON f.message = hc.message AND f.level = hc.level
        GROUP BY f.message, f.level
    ),
    paginated_groups AS (
        SELECT *,
               COUNT(*) OVER() as total_groups
        FROM grouped_errors
        ORDER BY last_seen DESC
        LIMIT limit_param OFFSET (page_param - 1) * limit_param
    )
    SELECT
        g.message,
        g.level,
        g.total_count AS count, -- Renamed from count to total_count internally
        g.last_seen,
        g.representative_id,
        COALESCE(g.trend_data, '[]'::jsonb) AS trend, -- Return the JSONB trend data, default to empty array
        g.total_groups
    FROM paginated_groups g;
END;
$$;


ALTER FUNCTION "public"."get_aggregated_errors"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_aggregated_errors_trend_v1"("project_id_param" "uuid", "start_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date_param" timestamp with time zone DEFAULT NULL::timestamp with time zone, "page_param" integer DEFAULT 1, "limit_param" integer DEFAULT 20, "bucket_interval_param" text DEFAULT 'hour') RETURNS TABLE("out_message" "text", "out_level" "text", "out_count" bigint, "out_last_seen" timestamp with time zone, "out_representative_id" "uuid", "out_trend" "jsonb", "out_total_groups" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    _start_date timestamptz := COALESCE(start_date_param, NOW() - INTERVAL '24 hours');
    _end_date timestamptz := COALESCE(end_date_param, NOW());
BEGIN
    RETURN QUERY
    WITH filtered_errors AS (
        SELECT
            fe.id AS fe_id,
            fe.message AS fe_message,
            fe.level AS fe_level,
            fe.received_at AS fe_received_at,
            date_trunc(bucket_interval_param, fe.received_at AT TIME ZONE 'UTC') as hour_bucket
        FROM public.errors fe
        WHERE fe.project_id = project_id_param
          AND fe.received_at >= _start_date
          AND fe.received_at <= _end_date
    ),
    hourly_group_counts AS (
        SELECT
            fe_message,
            fe_level,
            hour_bucket,
            COUNT(*) as hourly_count
        FROM filtered_errors
        GROUP BY fe_message, fe_level, hour_bucket
    ),
    grouped_errors AS (
        SELECT
            hg.fe_message,
            hg.fe_level,
            SUM(hg.hourly_count) AS total_count,
            MAX(fe.fe_received_at) AS last_seen,
            (array_agg(fe.fe_id ORDER BY fe.fe_received_at DESC))[1] AS representative_id,
            jsonb_agg(
                jsonb_build_object('time', hg.hour_bucket, 'count', hg.hourly_count)
                ORDER BY hg.hour_bucket ASC
            ) FILTER (WHERE hg.hour_bucket IS NOT NULL) AS trend_data
        FROM hourly_group_counts hg
        JOIN filtered_errors fe ON hg.fe_message = fe.fe_message AND hg.fe_level = fe.fe_level AND hg.hour_bucket = fe.hour_bucket
        GROUP BY hg.fe_message, hg.fe_level
    ),
    paginated_groups AS (
        SELECT pg.*,
               COUNT(*) OVER() as total_groups
        FROM grouped_errors pg
        ORDER BY pg.last_seen DESC
        LIMIT limit_param OFFSET (page_param - 1) * limit_param
    )
    SELECT
        g.fe_message,        -- Maps to out_message
        g.fe_level,          -- Maps to out_level
        g.total_count,       -- Maps to out_count
        g.last_seen,         -- Maps to out_last_seen
        g.representative_id, -- Maps to out_representative_id
        COALESCE(g.trend_data, '[]'::jsonb), -- Maps to out_trend
        g.total_groups       -- Maps to out_total_groups
    FROM paginated_groups g;
END;
$$;


ALTER FUNCTION "public"."get_aggregated_errors_trend_v1"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer, "bucket_interval_param" text) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_log_volume_aggregate"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "bucket_interval" "text") RETURNS TABLE("timestamp" timestamp with time zone, "level" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        date_trunc(bucket_interval, e.received_at AT TIME ZONE 'UTC') as bucket_timestamp, -- Use alias temporarily
        e.level,
        COUNT(*) as count
    FROM
        public.errors e -- <<< IMPORTANT: Ensure 'public.errors' is your actual errors table name!
    WHERE
        e.project_id = project_id_param
        AND e.received_at >= start_date_param
        AND e.received_at < end_date_param -- Use exclusive end date for consistency
    GROUP BY
        bucket_timestamp, e.level -- Group by alias and level
    ORDER BY
        bucket_timestamp; -- Order by alias
END;
$$;


ALTER FUNCTION "public"."get_log_volume_aggregate"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "bucket_interval" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  signup_phone_number text;
  inserted_user_id uuid;
BEGIN
  -- Create a user entry in public.users, linking to auth.users
  INSERT INTO public.users (supabase_auth_id, email)
  VALUES (NEW.id, NEW.email)
  RETURNING id INTO inserted_user_id; -- Get the primary key (id) of the newly created public.users row

  -- Check if phone_number was provided in metadata during signup
  signup_phone_number := NEW.raw_user_meta_data ->> 'phone_number';

  -- If a phone number was provided, insert it into phone_numbers as the primary one
  IF signup_phone_number IS NOT NULL AND signup_phone_number <> '' THEN
    INSERT INTO public.phone_numbers (user_id, phone_number, is_primary)
    VALUES (inserted_user_id, signup_phone_number, true); -- Use the users.id we just got

    -- Optional: Also update the single phone_number column in public.users
    -- UPDATE public.users SET phone_number = signup_phone_number WHERE id = inserted_user_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_new_error"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
      -- FROM net._http_request; -- Ensure this line is commented out or removed

      -- Check if request was queued successfully (pg_net returns the request id)
      IF request_id IS NULL THEN
        RAISE WARNING '[notify_on_new_error] Failed to queue HTTP request to Edge Function.';
      ELSE
        RAISE LOG '[notify_on_new_error] Queued request % to Edge Function.', request_id;
      END IF;

      RETURN NEW;
    END;
    $$;


ALTER FUNCTION "public"."notify_on_new_error"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_primary_phone"("target_user_id" "uuid", "target_phone_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Ensure the user calling this function owns the profile being changed
  -- This check uses the relationship public.users -> auth.users
  IF NOT EXISTS (
      SELECT 1 
      FROM public.users u
      WHERE u.id = target_user_id AND u.supabase_auth_id = auth.uid()
  ) THEN
      RAISE EXCEPTION 'User does not have permission to modify this profile''s phone numbers.';
  END IF;

  -- Ensure the target phone number exists and belongs to the target user
  IF NOT EXISTS (
      SELECT 1
      FROM public.phone_numbers pn
      WHERE pn.id = target_phone_id AND pn.user_id = target_user_id
  ) THEN
      RAISE EXCEPTION 'Target phone number not found for the specified user.';
  END IF;
  
  -- Set the current primary (if any) to false for this user
  UPDATE public.phone_numbers
  SET is_primary = false
  WHERE user_id = target_user_id AND is_primary = true;
  
  -- Set the target phone number to primary for this user
  UPDATE public.phone_numbers
  SET is_primary = true
  WHERE user_id = target_user_id AND id = target_phone_id;
END;$$;


ALTER FUNCTION "public"."set_primary_phone"("target_user_id" "uuid", "target_phone_id" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "stack_trace" "text",
    "metadata" "jsonb",
    "level" "text" DEFAULT 'error'::"text"
);


ALTER TABLE "public"."errors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."phone_numbers" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "phone_number" "text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "label" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "phone_numbers_phone_number_check" CHECK (("phone_number" <> ''::"text"))
);


ALTER TABLE "public"."phone_numbers" OWNER TO "postgres";


ALTER TABLE "public"."phone_numbers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."phone_numbers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "api_key" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "last_notified_at" timestamp with time zone
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."last_notified_at" IS 'Timestamp when the last error notification was sent for this project';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone_number" "text",
    "supabase_auth_id" "uuid" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."errors"
    ADD CONSTRAINT "errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_api_key_key" UNIQUE ("api_key");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "user_phone_number_unique" UNIQUE ("user_id", "phone_number");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_supabase_auth_id_key" UNIQUE ("supabase_auth_id");



CREATE UNIQUE INDEX "user_primary_phone_unique_idx" ON "public"."phone_numbers" USING "btree" ("user_id") WHERE ("is_primary" = true);



CREATE OR REPLACE TRIGGER "on_new_error_notify" AFTER INSERT ON "public"."errors" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_new_error"();



CREATE OR REPLACE TRIGGER "on_phone_number_updated" BEFORE UPDATE ON "public"."phone_numbers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."errors"
    ADD CONSTRAINT "errors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."phone_numbers"
    ADD CONSTRAINT "phone_numbers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to read own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "supabase_auth_id"));



DROP POLICY IF EXISTS "Allow authenticated users to read their project errors" ON "public"."errors"; -- Drop existing policy first
CREATE POLICY "Allow authenticated users to read their project errors" ON "public"."errors" FOR SELECT TO "authenticated"
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.users u ON p.user_id = u.id
    WHERE p.id = errors.project_id
      AND u.supabase_auth_id = auth.uid()
  )
);



CREATE POLICY "Allow authenticated users to update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "supabase_auth_id")) WITH CHECK (("auth"."uid"() = "supabase_auth_id"));



CREATE POLICY "Allow public error inserts" ON "public"."errors" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow users to delete their own projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to insert their own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to manage own phone numbers" ON "public"."phone_numbers" USING (("auth"."uid"() = ( SELECT "users"."supabase_auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "phone_numbers"."user_id")))) WITH CHECK (("auth"."uid"() = ( SELECT "users"."supabase_auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "phone_numbers"."user_id"))));



CREATE POLICY "Allow users to select their own projects" ON "public"."projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to update their own projects" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."errors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phone_numbers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."errors";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




































































































































































































































GRANT ALL ON FUNCTION "public"."get_aggregated_errors"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_aggregated_errors"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_aggregated_errors"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_aggregated_errors_trend_v1"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer, "bucket_interval_param" text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_aggregated_errors_trend_v1"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer, "bucket_interval_param" text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_aggregated_errors_trend_v1"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "page_param" integer, "limit_param" integer, "bucket_interval_param" text) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_log_volume_aggregate"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "bucket_interval" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_log_volume_aggregate"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "bucket_interval" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_log_volume_aggregate"("project_id_param" "uuid", "start_date_param" timestamp with time zone, "end_date_param" timestamp with time zone, "bucket_interval" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_new_error"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_new_error"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_new_error"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_primary_phone"("target_user_id" "uuid", "target_phone_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."set_primary_phone"("target_user_id" "uuid", "target_phone_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_primary_phone"("target_user_id" "uuid", "target_phone_id" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."errors" TO "anon";
GRANT ALL ON TABLE "public"."errors" TO "authenticated";
GRANT ALL ON TABLE "public"."errors" TO "service_role";



GRANT ALL ON TABLE "public"."phone_numbers" TO "anon";
GRANT ALL ON TABLE "public"."phone_numbers" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_numbers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."phone_numbers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."phone_numbers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."phone_numbers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
