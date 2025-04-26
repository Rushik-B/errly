-- supabase/migrations/20240521173000_create_aggregate_errors_trend_function.sql

-- Create the new function with a unique name
CREATE FUNCTION get_aggregated_errors_trend_v1( -- New name
    project_id_param uuid,
    start_date_param timestamptz DEFAULT NULL,
    end_date_param timestamptz DEFAULT NULL,
    page_param int DEFAULT 1,
    limit_param int DEFAULT 20
)
RETURNS TABLE (
    out_message text,
    out_level text,
    out_count bigint,
    out_last_seen timestamptz,
    out_representative_id uuid,
    out_trend jsonb,
    out_total_groups bigint
)
LANGUAGE plpgsql
STABLE
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
            fe.received_at AS fe_received_at
        FROM public.errors fe
        WHERE fe.project_id = project_id_param
          AND fe.received_at >= _start_date
          AND fe.received_at <= _end_date
    ),
    time_buckets AS (
        SELECT generate_series(
                   date_trunc('hour', _start_date),
                   date_trunc('hour', _end_date),
                   INTERVAL '1 hour'
               ) AS hour_bucket
    ),
    hourly_counts_per_group AS (
        SELECT
            f.fe_message,
            f.fe_level,
            t.hour_bucket,
            COUNT(f.fe_id) AS hourly_count
        FROM time_buckets t
        LEFT JOIN filtered_errors f ON date_trunc(f.fe_received_at, 'hour') = t.hour_bucket
        WHERE f.fe_message IS NOT NULL AND f.fe_level IS NOT NULL
        GROUP BY f.fe_message, f.fe_level, t.hour_bucket
    ),
    grouped_errors AS (
        SELECT
            f.fe_message,
            f.fe_level,
            COUNT(f.fe_id) AS total_count,
            MAX(f.fe_received_at) AS last_seen,
            (array_agg(f.fe_id ORDER BY f.fe_received_at DESC))[1] AS representative_id,
            jsonb_agg(
                jsonb_build_object('time', hc.hour_bucket, 'count', hc.hourly_count)
                ORDER BY hc.hour_bucket ASC
            ) FILTER (WHERE hc.hour_bucket IS NOT NULL) AS trend_data
        FROM filtered_errors f
        LEFT JOIN hourly_counts_per_group hc ON f.fe_message = hc.fe_message AND f.fe_level = hc.fe_level
        GROUP BY f.fe_message, f.fe_level
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