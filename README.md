# 🚌 BusTycoon – Busunternehmen-Manager

Wirtschaftssimulation im Browser: Du leitest ein Fernbus-Unternehmen. Starte mit
25.000 € und einem gebrauchten Setra, eröffne Linien zwischen deutschen Städten,
setze Ticketpreise und bring dein Unternehmen in die schwarzen Zahlen.

**Stack:** Next.js 15 (App Router) · Supabase (Auth + Postgres) · Tailwind CSS · TypeScript · Vercel

## Phase 1 (MVP)

- ✅ Auth (E-Mail/Passwort) + Spielstand pro User in Supabase
- ✅ Firma gründen: Startkapital + gebrauchter Starter-Bus + 1 Fahrer
- ✅ Bus-Modelle kaufbar (Preis, Sitzplätze, Verbrauch, Tempo, Zuverlässigkeit)
- ✅ Linien zwischen 12 deutschen Städten (Distanz via Haversine × Umwegfaktor)
- ✅ Ticketpreis pro Linie, Preis-Nachfrage-Kurve mit Elastizität
- ✅ Busse Linien zuweisen; nicht zugewiesene Busse kosten Depotgebühr
- ✅ Zeit-Ticks (1 Tick = 1 Ingame-Tag): Fahrten, Fahrgäste, Einnahmen,
  Treibstoff, Fahrergehalt, Wartung – manuell per Button oder stündlich per Cron
- ✅ Buchungsjournal + Tagesbilanz im Dashboard

## Phase 2 (Realismus & Tiefe)

- ✅ **Treibstoffarten:** Diesel (1,55 €/l), HVO100 (1,95 €/l, Image-Bonus,
  pro Bus umschaltbar) und Elektro (2 E-Bus-Modelle: teuer in der Anschaffung,
  ~0,30 €/kWh im Betrieb, Reichweiten-Limit bei der Linienzuweisung)
- ✅ **Bus-Upgrades:** WLAN, Steckdosen/USB, Klimaanlage, Ledersitze,
  Panorama-Fenster, Bordtoilette – Komfort-Score erhöht Zahlungsbereitschaft
  und Zufriedenheit, kostet Anschaffung + täglichen Unterhalt
- ✅ **Sitzklassen:** Economy/Comfort/Premium (70/20/10 der Sitze) mit eigenen
  Preisen pro Linie; Comfort braucht Komfort-Score ≥ 3, Premium ≥ 6
- ✅ **Wartung & Pannen:** Verschleiß pro km, Pannenrisiko steigt quadratisch
  mit sinkendem Zustand; Werkstatt-Service kostet Geld + 1 Tag Ausfall
- ✅ **Personal:** Fahrer in 3 Erfahrungsstufen (160–235 €/Tag), ohne Fahrer
  fährt kein Bus; EU-Lenkzeit (VO (EG) 561/2006, max. 9 h/Tag) begrenzt die
  Fahrten; Überlastung senkt die Zufriedenheit, Entlassung kostet Abfindung
- ✅ **Reputation:** Tagesnote aus Komfort, Preisfairness, Pannen, Antrieb und
  Fahrerzufriedenheit; träge geglättete Sterne-Bewertung (1–5) wirkt als
  Nachfrage-Multiplikator (3★ = ×1,0 · 5★ = ×1,2)

Phase 3 (Kredite, Events, Expansion, Achievements) folgt.

## Setup

### 1. Supabase-Projekt

1. Projekt auf [supabase.com](https://supabase.com) anlegen
2. Im SQL-Editor die Migrationen **in Reihenfolge** ausführen:
   `supabase/migrations/0001_phase1_schema.sql`, dann
   `supabase/migrations/0002_phase2_depth.sql`
   (legen Tabellen, RLS-Policies und Seed-Daten an)
3. Unter **Authentication → Providers** E-Mail/Passwort aktivieren.
   Für schnelles lokales Testen „Confirm email“ deaktivieren.

### 2. Lokale Entwicklung

```bash
cp .env.example .env.local   # Supabase-Keys eintragen
npm install
npm run dev
```

### 3. Vercel-Deployment

- Repo importieren, Umgebungsvariablen aus `.env.example` setzen
- `vercel.json` enthält den Cron (stündlich ein Ingame-Tag für alle Spieler);
  `CRON_SECRET` als Env-Variable setzen – Vercel sendet ihn automatisch als
  Bearer-Token an `/api/cron/tick`

## Spiellogik

- **Nachfrage pro Fahrt** ≈ `√(Einwohner A × Einwohner B) / 80.000 × Distanzfaktor`,
  gedämpft unter 120 km (Auto/ÖPNV) und über 450 km (Bahn/Flug), multipliziert
  mit dem Reputationsfaktor `0,7 + Sterne × 0,1`
- **Preis-Nachfrage:** `Nachfrage × (Marktpreis / Preis)^1,5`, Marktpreis ≈ 0,11 €/km
  (Comfort ×1,35, Premium ×1,8)
- **Fahrten/Tag:** Minimum aus 14 Einsatzstunden ÷ (Fahrzeit + 45 min Puffer)
  und EU-Lenkzeit 9 h ÷ Fahrzeit
- **Kosten:** Diesel 1,55 €/l · HVO 1,95 €/l · Strom 0,30 €/kWh, Fahrer
  160–235 €/Tag, Wartung 0,20 €/km, Upgrade-Unterhalt, Depotgebühr 25 €/Tag
- **Pannen:** `((100 − Zustand)/100)² × (1,2 − Zuverlässigkeit/100) × 0,9
  × Fahrerfaktor` pro Einsatztag; Panne halbiert den Tag und kostet Reparatur

Die Kernlogik ist pur in `src/lib/game/` – identisch genutzt vom
„Nächster Tag“-Button (Server Action) und vom Cron-Endpoint.

## Ordnerstruktur

```
supabase/migrations/      SQL-Schema + Seeds
src/
├── app/
│   ├── page.tsx          Redirect je nach Login-Status
│   ├── login/            Login/Registrierung (Server Actions)
│   ├── dashboard/        Spiel-UI + Server Actions (Kauf, Routen, Tick)
│   └── api/cron/tick/    Vercel-Cron: Tick für alle Spieler
├── components/           Dashboard-Panels, Dialoge, UI-Bausteine
├── lib/
│   ├── game/             Ökonomie-Konstanten, Nachfrage-/Tick-Logik (pur)
│   ├── supabase/         Browser-/Server-/Admin-Clients
│   └── types.ts          Gemeinsame Typen
└── middleware.ts         Session-Refresh + Auth-Guard für /dashboard
```
