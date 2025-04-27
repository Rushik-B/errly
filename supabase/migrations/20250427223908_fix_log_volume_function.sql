-- Drop the existing function with the old signature first
DROP FUNCTION IF EXISTS public.get_log_volume_aggregate(uuid, timestamptz, timestamptz, text);

-- Function to aggregate log counts by time buckets (Corrected Version)
create or replace function public.get_log_volume_aggregate(
    project_id_param uuid,
    start_date_param timestamptz,
    end_date_param timestamptz,
    bucket_interval text -- 'minute', 'hour', 'day'
)
returns table (
    bucket_start_time timestamptz, -- Corrected: returns bucket_start_time
    level text,
    count int -- Changed from bigint to int to match original attempt, API might expect int
)
language sql
stable -- Indicates the function doesn't modify the database
as $$
  select
    date_trunc(bucket_interval, e.received_at) as bucket_start_time, -- Corrected: alias matches return name
    e.level,
    count(*)::int as count
  from
    public.errors e -- Correct table confirmed from db pull
  where
    e.project_id = project_id_param
    and e.received_at >= start_date_param
    and e.received_at < end_date_param -- Use '<' for end date for proper bucketing
  group by
    1, 2 -- Group by bucket_start_time and level
  order by
    1; -- Order by bucket_start_time
$$;
