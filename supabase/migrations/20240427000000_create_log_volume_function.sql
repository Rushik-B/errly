-- Function to aggregate log counts by time buckets
create or replace function get_log_volume_aggregate(
    project_id_param uuid,
    start_date_param timestamptz,
    end_date_param timestamptz,
    bucket_interval text -- 'minute', 'hour', 'day'
)
returns table (
    timestamp timestamptz,
    level text,
    count int
)
language sql
stable -- Indicates the function doesn't modify the database
as $$
  select
    date_trunc(bucket_interval, e.received_at) as timestamp,
    e.level,
    count(*)::int as count
  from
    public.errors e -- Assuming your errors table is in the public schema
  where
    e.project_id = project_id_param
    and e.received_at >= start_date_param
    and e.received_at < end_date_param -- Use '<' for end date for proper bucketing
  group by
    1, 2 -- Group by timestamp bucket and level
  order by
    1; -- Order by timestamp
$$; 