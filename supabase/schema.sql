create extension if not exists pgcrypto;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  manage_token uuid not null default gen_random_uuid(),
  host_slug text not null,
  host_name text not null,
  host_email text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  note text,
  source text default 'direct',
  campaign text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Asia/Bangkok',
  status text not null default 'confirmed',
  crm_stage text not null default 'booked',
  meet_url text,
  calendar_event_id text,
  reminder_24h_sent_at timestamptz,
  reminder_1h_sent_at timestamptz,
  follow_up_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_start_at on bookings(start_at);
create index if not exists idx_bookings_customer_email on bookings(customer_email);
create unique index if not exists idx_bookings_manage_token on bookings(manage_token);
