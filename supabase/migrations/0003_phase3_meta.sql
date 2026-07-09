-- =============================================================
-- Bus-Unternehmen-Manager – Phase 3
-- Kredite/Bonität, Zufallsereignisse, Expansion (Regionen +
-- Werkstätten), Level-System mit freischaltbaren Bussen
-- =============================================================

-- ---------- Progression & Expansion am Spielstand ----------
alter table public.player_stats
  add column xp integer not null default 0,
  add column unlocked_regions text[] not null default '{de}',
  add column workshops text[] not null default '{}';

-- ---------- Städte bekommen Regionen ----------
alter table public.cities
  add column region text not null default 'de';

-- ---------- Bus-Modelle: Level-Freischaltung ----------
alter table public.bus_models
  add column required_level integer not null default 1;

update public.bus_models set required_level = 2 where id = 'man-intercity';
update public.bus_models set required_level = 3 where id = 'setra-516';
update public.bus_models set required_level = 4 where id = 'ebus-yutong';
update public.bus_models set required_level = 5 where id = 'setra-531-dt';
update public.bus_models set required_level = 6 where id = 'ebus-eintouro';

-- ---------- Kredite ----------
create table public.loans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  principal          integer not null,        -- ausgezahlte Summe
  remaining          integer not null,        -- Restschuld inkl. Zinsen
  daily_payment      integer not null,        -- Rate €/Tag
  interest_total_pct numeric(4,1) not null,   -- Gesamtzins über die Laufzeit
  term_days          integer not null,
  taken_on_day       integer not null,
  created_at         timestamptz not null default now()
);

create index loans_user_idx on public.loans (user_id);

-- ---------- Zufallsereignisse ----------
create table public.game_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('fuel_spike','holiday','storm')),
  magnitude   numeric(4,2) not null,   -- Multiplikator (z.B. 1.40 Spritpreis)
  day_start   integer not null,
  day_end     integer not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create index game_events_user_idx on public.game_events (user_id, day_end desc);

-- ---------- Neue Buchungstypen ----------
alter table public.transactions drop constraint transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in
    ('ticket_revenue','fuel','driver_salary','maintenance','bus_purchase',
     'depot_fee','starting_capital',
     'upgrade_purchase','maintenance_service','repair','severance',
     'loan_payout','loan_payment','region_unlock','workshop_purchase'));

-- ---------- RLS ----------
alter table public.loans       enable row level security;
alter table public.game_events enable row level security;

create policy "eigene loans" on public.loans
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene game_events" on public.game_events
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Seed: Städte Österreich & Schweiz
-- =============================================================
insert into public.cities (id, name, population, lat, lng, region) values
  ('wien',      'Wien',      1930000, 48.2082, 16.3738, 'at'),
  ('graz',      'Graz',       295000, 47.0707, 15.4395, 'at'),
  ('linz',      'Linz',       210000, 48.3069, 14.2858, 'at'),
  ('salzburg',  'Salzburg',   155000, 47.8095, 13.0550, 'at'),
  ('innsbruck', 'Innsbruck',  132000, 47.2692, 11.4041, 'at'),
  ('zuerich',   'Zürich',     423000, 47.3769,  8.5417, 'ch'),
  ('genf',      'Genf',       204000, 46.2044,  6.1432, 'ch'),
  ('basel',     'Basel',      178000, 47.5596,  7.5886, 'ch'),
  ('bern',      'Bern',       135000, 46.9480,  7.4474, 'ch');
