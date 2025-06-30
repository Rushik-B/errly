-- Define possible states (optional but good practice)
-- create type public.error_state as enum ('active', 'resolved', 'muted');
-- Using text for simplicity, can enforce with check constraint later if needed

-- Add state column to track if an error is active, resolved, or muted
alter table public.errors
add column state text not null default 'active';

-- Add index for querying by state
create index if not exists errors_state_idx on public.errors(state);

-- Add muted_until column to track when a muted error should become active again
alter table public.errors
add column muted_until timestamp with time zone;

-- Optional: Add comments for clarity
comment on column public.errors.state is 'The current status of the error group (active, resolved, muted).';
comment on column public.errors.muted_until is 'If state is muted, the time until which it should remain muted.';
