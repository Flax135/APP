# 🚌 BusTycoon – Busunternehmen-Manager

Wirtschaftssimulation im Browser: Du leitest ein Fernbus-Unternehmen. Starte mit
25.000 € und einem gebrauchten Setra, eröffne Linien zwischen deutschen Städten,
setze Ticketpreise und bring dein Unternehmen in die schwarzen Zahlen.

**Stack:** Next.js 15 (App Router) · Supabase (Auth + Postgres) · Tailwind CSS · TypeScript · Vercel

## Phase 1 (aktueller Stand – MVP)

- ✅ Auth (E-Mail/Passwort) + Spielstand pro User in Supabase
- ✅ Firma gründen: Startkapital + gebrauchter Starter-Bus
- ✅ 5 Bus-Modelle kaufbar (Preis, Sitzplätze, Verbrauch, Tempo, Zuverlässigkeit)
- ✅ Linien zwischen 12 deutschen Städten (Distanz via Haversine × Umwegfaktor)
- ✅ Ticketpreis pro Linie, Preis-Nachfrage-Kurve mit Elastizität
- ✅ Busse Linien zuweisen; nicht zugewiesene Busse kosten Depotgebühr
- ✅ Zeit-Ticks (1 Tick = 1 Ingame-Tag): Fahrten, Fahrgäste, Einnahmen,
  Treibstoff, Fahrergehalt, Wartung – manuell per Button oder stündlich per Cron
- ✅ Buchungsjournal + Tagesbilanz im Dashboard

Phase 2 (Treibstoffarten, Upgrades, Sitzklassen, Personal, Reputation) und
Phase 3 (Kredite, Events, Expansion, Achievements) folgen.

## Setup

### 1. Supabase-Projekt

1. Projekt auf [supabase.com](https://supabase.com) anlegen
2. Im SQL-Editor die Migration ausführen:
   `supabase/migrations/0001_phase1_schema.sql`
   (legt Tabellen, RLS-Policies und Seed-Daten an)
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

## Spiellogik (Phase 1)

- **Nachfrage pro Fahrt** ≈ `√(Einwohner A × Einwohner B) / 80.000 × Distanzfaktor`,
  gedämpft unter 120 km (Auto/ÖPNV) und über 450 km (Bahn/Flug)
- **Preis-Nachfrage:** `Nachfrage × (Marktpreis / Preis)^1,5`, Marktpreis ≈ 0,11 €/km
- **Fahrten/Tag:** 14 Einsatzstunden ÷ (Fahrzeit + 45 min Puffer)
- **Kosten:** Diesel 1,55 €/l, Fahrer 180 €/Tag, Wartung 0,20 €/km,
  Depotgebühr 25 €/Tag für Busse ohne Linie

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
