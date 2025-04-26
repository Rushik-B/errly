-- supabase/migrations/20240521160000_update_aggregate_errors_function_for_trends.sql

-- Drop the old function signature first if it exists
DROP FUNCTION IF EXISTS get_aggregated_errors(uuid, timestamptz, timestamptz, int, int);

CREATE OR REPLACE FUNCTION get_aggregated_errors(
    project_id_param uuid,
    start_date_param timestamptz DEFAULT NULL,
    end_date_param timestamptz DEFAULT NULL,
    page_param int DEFAULT 1,
    limit_param int DEFAULT 20
)
RETURNS TABLE (
    message text,
    level text,
    count bigint,
    last_seen timestamptz,
    representative_id uuid,
    trend jsonb, -- Changed to JSONB to store array of {time_bucket, count}
    total_groups bigint
)
LANGUAGE plpgsql -- Changed to plpgsql because we use DECLARE
STABLE
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