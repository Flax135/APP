"use client";

import type { ReactNode } from "react";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { AdvanceDayButton } from "@/components/AdvanceDayButton";
import { BuyBusDialog } from "@/components/BuyBusDialog";
import { DriversPanel } from "@/components/DriversPanel";
import { EventBanner } from "@/components/EventBanner";
import { ExpansionPanel } from "@/components/ExpansionPanel";
import { FinancePanel } from "@/components/FinancePanel";
import { FleetPanel } from "@/components/FleetPanel";
import { NetworkPanel } from "@/components/NetworkPanel";
import {
  creditScore,
  levelForXp,
  loanOffers,
  totalDebt,
  xpForLevel,
} from "@/lib/game/meta";
import type {
  Bus,
  BusModel,
  BusUpgrade,
  City,
  Driver,
  GameEvent,
  Loan,
  PlayerStats,
  Route,
  Transaction,
  Upgrade,
} from "@/lib/types";

const euro = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const TYPE_LABELS: Record<Transaction["type"], string> = {
  ticket_revenue: "Tickets",
  fuel: "Energie",
  driver_salary: "Gehalt",
  maintenance: "Wartung",
  bus_purchase: "Buskauf",
  depot_fee: "Depot",
  starting_capital: "Startkapital",
  upgrade_purchase: "Upgrade",
  maintenance_service: "Werkstatt",
  repair: "Reparatur",
  severance: "Abfindung",
  loan_payout: "Kredit",
  loan_payment: "Kreditrate",
  region_unlock: "Expansion",
  workshop_purchase: "Werkstattbau",
};

export type DashboardData = {
  stats: PlayerStats;
  buses: Bus[];
  routes: Route[];
  models: BusModel[];
  cities: City[];
  drivers: Driver[];
  upgrades: Upgrade[];
  busUpgrades: BusUpgrade[];
  loans: Loan[];
  events: GameEvent[];
  transactions: Transaction[];
};

/**
 * Komplettes Spiel-Dashboard, unabhängig von der Datenquelle: Der Server
 * rendert es mit Supabase-Daten, der Demo-Modus mit localStorage-Daten.
 */
export function DashboardView({
  data,
  headerExtra,
  notice,
}: {
  data: DashboardData;
  headerExtra?: ReactNode;
  notice?: ReactNode;
}) {
  const {
    stats,
    buses,
    routes,
    models,
    cities,
    drivers,
    upgrades,
    busUpgrades,
    loans,
    events,
    transactions,
  } = data;

  const busUpgradeIds: Record<string, string[]> = {};
  for (const owned of busUpgrades) {
    (busUpgradeIds[owned.bus_id] ??= []).push(owned.upgrade_id);
  }

  // Nur Städte in freigeschalteten Regionen für neue Linien
  const availableCities = cities.filter((c) =>
    stats.unlocked_regions.includes(c.region)
  );

  // Level & Bonität
  const level = levelForXp(stats.xp);
  const nextLevelXp = xpForLevel(level + 1);
  const levelProgress = Math.min(
    100,
    Math.round(
      ((stats.xp - xpForLevel(level)) / (nextLevelXp - xpForLevel(level))) * 100
    )
  );
  const activeLoans = loans.filter((l) => l.remaining > 0);
  const score = creditScore({
    cash: stats.cash,
    reputation: Number(stats.reputation),
    totalDebt: totalDebt(activeLoans),
  });
  const offers = loanOffers(score);

  // Bilanz des letzten abgeschlossenen Tages (nur operative Posten)
  const lastDay = stats.current_day - 1;
  const nonOperative: Transaction["type"][] = [
    "bus_purchase",
    "starting_capital",
    "upgrade_purchase",
    "severance",
    "loan_payout",
    "region_unlock",
    "workshop_purchase",
  ];
  const lastDayResult = transactions
    .filter((t) => t.day === lastDay && !nonOperative.includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const reputation = Number(stats.reputation);
  const kpis = [
    { label: "Kontostand", value: euro(stats.cash), highlight: stats.cash < 0 },
    {
      label: `Bilanz Tag ${lastDay >= 1 ? lastDay : "–"}`,
      value: lastDay >= 1 ? euro(lastDayResult) : "—",
      highlight: lastDay >= 1 && lastDayResult < 0,
    },
    { label: "Flotte", value: String(buses.length), highlight: false },
    {
      label: "Reputation",
      value: `${reputation.toFixed(1)} ★`,
      highlight: reputation < 2.5,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚌</span>
            <div>
              <h1 className="font-bold leading-tight">{stats.company_name}</h1>
              <p className="text-xs text-slate-400">
                Tag {stats.current_day} · Level {level}
                <span className="ml-2 inline-block h-1.5 w-16 overflow-hidden rounded-full bg-slate-700 align-middle">
                  <span
                    className="block h-full rounded-full bg-amber-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </span>
              </p>
            </div>
          </div>
          {headerExtra}
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {notice}

        <EventBanner events={events} currentDay={stats.current_day} />

        {/* KPI-Leiste */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
            >
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p
                className={`mt-1 text-lg font-bold sm:text-xl ${
                  kpi.highlight ? "text-red-400" : "text-white"
                }`}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <AdvanceDayButton />

        {/* Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <NetworkPanel
              cities={cities}
              availableCities={availableCities}
              routes={routes}
              buses={buses}
              reputation={reputation}
              unlockedRegions={stats.unlocked_regions}
            />

            <FinancePanel
              loans={activeLoans}
              offers={offers}
              score={score}
              playerLevel={level}
            />

            <ExpansionPanel
              unlockedRegions={stats.unlocked_regions}
              workshops={stats.workshops}
              playerLevel={level}
            />
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Flotte</h2>
                <BuyBusDialog models={models} cash={stats.cash} playerLevel={level} />
              </div>
              <FleetPanel
                buses={buses}
                routes={routes}
                models={models}
                cities={cities}
                drivers={drivers}
                upgrades={upgrades}
                busUpgradeIds={busUpgradeIds}
                cash={stats.cash}
                currentDay={stats.current_day}
              />
            </section>

            <DriversPanel drivers={drivers} buses={buses} />

            <AchievementsPanel
              fleetSize={buses.length}
              routeCount={routes.length}
              reputation={reputation}
              regionCount={stats.unlocked_regions.length}
              cash={stats.cash}
              lastDayResult={lastDay >= 1 ? lastDayResult : null}
            />
          </div>
        </div>

        {/* Buchungsjournal */}
        <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="mb-4 font-bold">Letzte Buchungen</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-400">Noch keine Buchungen.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-300">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      Tag {t.day} · {TYPE_LABELS[t.type]}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      t.amount >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {euro(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
