-- Add the phone_notifications_enabled column to the users table
alter table public.users
add column phone_notifications_enabled boolean default true not null;

-- Optional: Add a comment to the column for clarity
comment on column public.users.phone_notifications_enabled is 'Whether the user wants to receive phone notifications for errors.';
