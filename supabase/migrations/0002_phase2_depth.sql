-- =============================================================
-- Bus-Unternehmen-Manager – Phase 2
-- Treibstoffarten, Upgrades, Sitzklassen, Wartung/Pannen,
-- Personal (drivers), Reputation
-- =============================================================

-- ---------- Antrieb & Elektro-Reichweite ----------
alter table public.bus_models
  add column powertrain text not null default 'diesel'
    check (powertrain in ('diesel','electric')),
  add column range_km integer;  -- nur für Elektro relevant

-- Verbrenner können Diesel oder HVO tanken (pro Bus wählbar)
alter table public.buses
  add column fuel_type text not null default 'diesel'
    check (fuel_type in ('diesel','hvo')),
  add column in_maintenance_until_day integer;  -- Bus steht in der Werkstatt

-- ---------- Sitzklassen: Preise pro Route ----------
alter table public.routes
  add column price_comfort numeric(6,2),
  add column price_premium numeric(6,2);

update public.routes set
  price_comfort = round(ticket_price * 1.35, 2),
  price_premium = round(ticket_price * 1.80, 2);

alter table public.routes
  alter column price_comfort set not null,
  alter column price_premium set not null;

-- ---------- Upgrade-Katalog + gekaufte Upgrades ----------
create table public.upgrades (
  id                text primary key,
  name              text not null,
  price             integer not null,
  upkeep_per_day    integer not null,   -- laufende Wartung €/Tag
  comfort_bonus     integer not null,   -- Punkte für Komfort-Score
  description       text not null default ''
);

create table public.bus_upgrades (
  bus_id      uuid not null references public.buses (id) on delete cascade,
  upgrade_id  text not null references public.upgrades (id),
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (bus_id, upgrade_id)
);

-- ---------- Personal: Fahrer ----------
create table public.drivers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  experience      text not null check (experience in ('rookie','experienced','veteran')),
  daily_salary    integer not null,
  satisfaction    numeric(4,1) not null default 80.0,   -- 0-100
  assigned_bus_id uuid references public.buses (id) on delete set null,
  hired_on_day    integer not null,
  created_at      timestamptz not null default now()
);

create index drivers_user_idx on public.drivers (user_id);
create index bus_upgrades_user_idx on public.bus_upgrades (user_id);

-- ---------- Neue Buchungstypen ----------
alter table public.transactions drop constraint transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in
    ('ticket_revenue','fuel','driver_salary','maintenance','bus_purchase',
     'depot_fee','starting_capital',
     'upgrade_purchase','maintenance_service','repair','severance'));

-- ---------- RLS ----------
alter table public.upgrades     enable row level security;
alter table public.bus_upgrades enable row level security;
alter table public.drivers      enable row level security;

create policy "upgrades lesbar" on public.upgrades
  for select to authenticated using (true);

create policy "eigene bus_upgrades" on public.bus_upgrades
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eigene drivers" on public.drivers
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Seed: Elektro-Busse
-- consumption = kWh/100km bei powertrain 'electric'
-- =============================================================
insert into public.bus_models
  (id, name, price, seats, consumption, speed_kmh, reliability, is_used, powertrain, range_km, description) values
  ('ebus-yutong',   'Yutong ICe12 (Elektro)', 365000, 48, 98.0, 92, 89, false, 'electric', 320,
   'Bezahlbarer E-Bus für Regionalstrecken. Günstig im Betrieb, begrenzte Reichweite.'),
  ('ebus-eintouro', 'Mercedes eIntouro', 430000, 50, 105.0, 95, 94, false, 'electric', 400,
   'Elektrischer Überlandbus der Spitzenklasse. Niedrige Energiekosten, starkes Image.');

-- =============================================================
-- Seed: Upgrades
-- =============================================================
insert into public.upgrades (id, name, price, upkeep_per_day, comfort_bonus, description) values
  ('wifi',     'WLAN an Bord',        1500,  3, 1, 'Kostenloses WLAN für Fahrgäste.'),
  ('usb',      'Steckdosen & USB',    2800,  2, 1, 'Lademöglichkeit an jedem Sitz.'),
  ('klima',    'Klimaanlage',         9500,  6, 2, 'Angenehmes Klima zu jeder Jahreszeit.'),
  ('leder',    'Ledersitze',         14000,  4, 2, 'Hochwertige Bestuhlung mit mehr Beinfreiheit.'),
  ('panorama', 'Panorama-Fenster',   16000,  3, 2, 'Großzügige Verglasung für Aussicht unterwegs.'),
  ('wc',       'Bordtoilette',       19000,  8, 2, 'Unverzichtbar auf langen Strecken.');
