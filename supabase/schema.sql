-- Atelier N° — exécuter dans l'éditeur SQL du projet Supabase.
-- Ne pas créer de policies publiques pour ces tables.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  customer_phone text not null,
  delivery_city text not null,
  delivery_address text not null,
  customer_note text not null default '',
  items jsonb not null,
  estimated_total numeric(14,2) not null default 0,
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation','confirmed','preparing','shipped','delivered','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  customer_phone text not null default '',
  customer_email text,
  topic text not null default 'general',
  message text not null,
  order_reference text,
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.support_tickets enable row level security;

-- Les écritures sont réalisées exclusivement par les fonctions Vercel
-- avec SUPABASE_SERVICE_ROLE_KEY stockée dans les variables d'environnement.
-- Les clients ne doivent jamais recevoir cette clé ni une policy publique.
