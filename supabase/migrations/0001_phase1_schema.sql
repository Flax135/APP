-- =============================================================
-- Bus-Unternehmen-Manager – Phase 1 Schema
-- Tabellen: player_stats, bus_models, buses, cities, routes,
--           transactions
-- (drivers, upgrades folgen in Phase 2)
-- =============================================================

-- ---------- Katalog: Bus-Modelle (statisch, seeded) ----------
create table public.bus_models (
  id            text primary key,
  name          text not null,
  price         integer not null,               -- Kaufpreis in €
  seats         integer not null,
  consumption   numeric(4,1) not null,          -- Liter Diesel / 100 km
  speed_kmh     integer not null,               -- Ø Reisegeschwindigkeit
  reliability   integer not null,               -- 0-100, ab Phase 2 relevant
  is_used       boolean not null default false, -- Gebrauchtmodell
  description   text not null default ''
);

-- ---------- Katalog: Städte (statisch, seeded) ----------
create table public.cities (
  id          text primary key,
  name        text not null,
  population  integer not null,
  lat         double precision not null,
  lng         double precision not null
);

-- ---------- Spielstand pro User ----------
create table public.player_stats (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  company_name  text not null,
  cash          bigint not null default 0,      -- Cent-frei, ganze €
  current_day   integer not null default 1,
  reputation    numeric(3,1) not null default 3.0,  -- Sterne, Phase 2
  created_at    timestamptz not null default now()
);

-- ---------- Eigene Busse ----------
create table public.buses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  model_id          text not null references public.bus_models (id),
  name              text not null,
  condition         numeric(4,1) not null default 100.0,  -- %
  purchased_on_day  integer not null,
  assigned_route_id uuid,                        -- FK unten, nach routes
  created_at        timestamptz not null default now()
);

-- ---------- Routen ----------
create table public.routes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  origin_city_id  text not null references public.cities (id),
  dest_city_id    text not null references public.cities (id),
  distance_km     integer not null,
  ticket_price    numeric(6,2) not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint distinct_cities check (origin_city_id <> dest_city_id)
);

alter table public.buses
  add constraint buses_assigned_route_fk
  foreign key (assigned_route_id) references public.routes (id)
  on delete set null;

-- ---------- Buchungsjournal ----------
create table public.transactions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         integer not null,
  type        text not null check (type in
                ('ticket_revenue','fuel','driver_salary','maintenance',
                 'bus_purchase','depot_fee','starting_capital')),
  amount      bigint not null,                  -- positiv = Einnahme, negativ = Ausgabe
  description text not null default '',
  created_at  timestamptz not null default now()
);

create index transactions_user_day_idx on public.transactions (user_id, day desc);
create index buses_user_idx on public.buses (user_id);
create index routes_user_idx on public.routes (user_id);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.bus_models   enable row level security;
alter table public.cities       enable row level security;
alter table public.player_stats enable row level security;
alter table public.buses        enable row level security;
alter table public.routes       enable row level security;
alter table public.transactions enable row level security;

-- Kataloge: für alle eingeloggten User lesbar
create policy "bus_models lesbar" on public.bus_models
  for select to authenticated using (true);
create policy "cities lesbar" on public.cities
  for select to authenticated using (true);

-- Spielertabellen: nur eigene Zeilen
create policy "eigene player_stats" on public.player_stats
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene buses" on public.buses
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene routes" on public.routes
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene transactions" on public.transactions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Seed: Bus-Modelle
-- Preise/Verbräuche grob an realen Reisebus-Betriebskosten orientiert
-- =============================================================
insert into public.bus_models
  (id, name, price, seats, consumption, speed_kmh, reliability, is_used, description) values
  ('used-setra-315', 'Setra S 315 (gebraucht)', 42000, 49, 34.0, 90, 68, true,
   'Solider Veteran. Günstig in der Anschaffung, durstig und störanfällig.'),
  ('sprinter-mini',  'Mercedes Sprinter Minibus', 78000, 19, 14.5, 95, 88, false,
   'Wendiger Minibus für dünne Strecken. Niedriger Verbrauch, wenig Plätze.'),
  ('man-intercity',  'MAN Lion''s Intercity', 195000, 35, 22.0, 92, 90, false,
   'Zuverlässiger Überlandbus. Guter Kompromiss aus Kosten und Kapazität.'),
  ('setra-516',      'Setra S 516 HD', 335000, 53, 26.5, 98, 94, false,
   'Moderner Reisebus. Effizient auf langen Strecken, hoher Komfortstandard.'),
  ('setra-531-dt',   'Setra S 531 DT Doppeldecker', 495000, 83, 31.0, 96, 92, false,
   'Das Flaggschiff. Maximale Kapazität für nachfragestarke Korridore.');

-- =============================================================
-- Seed: Städte (Einwohner gerundet, Koordinaten für Distanzberechnung)
-- =============================================================
insert into public.cities (id, name, population, lat, lng) values
  ('berlin',     'Berlin',      3700000, 52.5200, 13.4050),
  ('hamburg',    'Hamburg',     1900000, 53.5511,  9.9937),
  ('muenchen',   'München',     1500000, 48.1351, 11.5820),
  ('koeln',      'Köln',        1100000, 50.9375,  6.9603),
  ('frankfurt',  'Frankfurt',    760000, 50.1109,  8.6821),
  ('stuttgart',  'Stuttgart',    630000, 48.7758,  9.1829),
  ('duesseldorf','Düsseldorf',   620000, 51.2277,  6.7735),
  ('leipzig',    'Leipzig',      600000, 51.3397, 12.3731),
  ('dresden',    'Dresden',      560000, 51.0504, 13.7373),
  ('hannover',   'Hannover',     540000, 52.3759,  9.7320),
  ('nuernberg',  'Nürnberg',     520000, 49.4521, 11.0767),
  ('bremen',     'Bremen',       570000, 53.0793,  8.8017);
