-- supabase/migrations/20240521150000_create_aggregate_errors_function.sql

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
    total_groups bigint -- Add total count of unique groups
)
LANGUAGE sql
STABLE -- Indicates the function doesn't modify the database
AS $$
WITH filtered_errors AS (
    SELECT
        id,
        message,
        level,
        received_at
    FROM public.errors
    WHERE project_id = project_id_param
      AND (start_date_param IS NULL OR received_at >= start_date_param)
      AND (end_date_param IS NULL OR received_at <= end_date_param)
),
grouped_errors AS (
    SELECT
        message,
        level,
        COUNT(*) AS count,
        MAX(received_at) AS last_seen,
        -- Get the ID of the row corresponding to the latest received_at within the group
        (array_agg(id ORDER BY received_at DESC))[1] AS representative_id
    FROM filtered_errors
    GROUP BY message, level
),
paginated_groups AS (
    SELECT *,
           COUNT(*) OVER() as total_groups -- Calculate total unique groups *before* pagination
    FROM grouped_errors
    ORDER BY last_seen DESC
    LIMIT limit_param OFFSET (page_param - 1) * limit_param
)
SELECT
    message,
    level,
    count,
    last_seen,
    representative_id,
    total_groups -- Return total groups from the paginated set (will be the same for all rows)
FROM paginated_groups;

$$; 