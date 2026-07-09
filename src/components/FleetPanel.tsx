"use client";

import { useState } from "react";
import { assignBus, buyUpgrade, serviceBus, setBusFuel } from "@/app/dashboard/actions";
import { serviceCost } from "@/lib/game/economy";
import type { Bus, BusModel, City, Driver, Route, Upgrade } from "@/lib/types";
import { ActionForm, Modal, formatEuro } from "./ui";

function routeLabel(route: Route, citiesById: Map<string, City>): string {
  const a = citiesById.get(route.origin_city_id)?.name ?? "?";
  const b = citiesById.get(route.dest_city_id)?.name ?? "?";
  return `${a} – ${b}`;
}

const selectClass =
  "min-w-0 flex-1 rounded-lg bg-slate-900 px-2 py-1.5 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500";
const smallButtonClass =
  "rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:text-slate-400";

function UpgradesDialog({
  bus,
  upgrades,
  ownedIds,
  cash,
}: {
  bus: Bus;
  upgrades: Upgrade[];
  ownedIds: Set<string>;
  cash: number;
}) {
  const [open, setOpen] = useState(false);
  const comfortScore = upgrades
    .filter((u) => ownedIds.has(u.id))
    .reduce((sum, u) => sum + u.comfort_bonus, 0);

  return (
    <>
      <button onClick={() => setOpen(true)} className={smallButtonClass}>
        Upgrades ({comfortScore}★K)
      </button>
      <Modal title={`Upgrades: ${bus.name}`} open={open} onClose={() => setOpen(false)}>
        <p className="mb-3 text-sm text-slate-400">
          Komfort-Score: <span className="font-semibold text-white">{comfortScore}</span>
          {" · "}ab 3 verkauft sich Comfort, ab 6 auch Premium voll.
        </p>
        <div className="space-y-2">
          {upgrades.map((upgrade) => {
            const owned = ownedIds.has(upgrade.id);
            const affordable = cash >= upgrade.price;
            return (
              <ActionForm
                key={upgrade.id}
                action={buyUpgrade}
                className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700"
              >
                {(pending) => (
                  <div className="flex items-center justify-between gap-3">
                    <input type="hidden" name="bus_id" value={bus.id} />
                    <input type="hidden" name="upgrade_id" value={upgrade.id} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {upgrade.name}{" "}
                        <span className="font-normal text-slate-400">
                          +{upgrade.comfort_bonus} Komfort
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatEuro(upgrade.price)} · Unterhalt {upgrade.upkeep_per_day} €/Tag
                      </p>
                    </div>
                    {owned ? (
                      <span className="shrink-0 rounded bg-emerald-950 px-2 py-1 text-xs font-medium text-emerald-400">
                        Eingebaut
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={!affordable || pending}
                        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        {pending ? "…" : "Einbauen"}
                      </button>
                    )}
                  </div>
                )}
              </ActionForm>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

export function FleetPanel({
  buses,
  routes,
  models,
  cities,
  drivers,
  upgrades,
  busUpgradeIds,
  cash,
  currentDay,
}: {
  buses: Bus[];
  routes: Route[];
  models: BusModel[];
  cities: City[];
  drivers: Driver[];
  upgrades: Upgrade[];
  busUpgradeIds: Record<string, string[]>; // bus_id -> upgrade_ids
  cash: number;
  currentDay: number;
}) {
  const modelsById = new Map(models.map((m) => [m.id, m]));
  const citiesById = new Map(cities.map((c) => [c.id, c]));
  const driverByBusId = new Map(
    drivers.filter((d) => d.assigned_bus_id).map((d) => [d.assigned_bus_id!, d])
  );

  if (buses.length === 0) {
    return <p className="text-sm text-slate-400">Noch keine Busse in der Flotte.</p>;
  }

  return (
    <ul className="space-y-3">
      {buses.map((bus) => {
        const model = modelsById.get(bus.model_id);
        if (!model) return null;
        const condition = Number(bus.condition);
        const conditionColor =
          condition > 70 ? "text-emerald-400" : condition > 40 ? "text-amber-400" : "text-red-400";
        const driver = driverByBusId.get(bus.id);
        const inWorkshop =
          bus.in_maintenance_until_day !== null && currentDay < bus.in_maintenance_until_day;
        const ownedIds = new Set(busUpgradeIds[bus.id] ?? []);
        const cost = serviceCost(condition, model);

        return (
          <li key={bus.id} className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">
                  {bus.name}{" "}
                  <span className="text-sm font-normal text-slate-400">{model.name}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {model.seats} Sitze ·{" "}
                  {model.powertrain === "electric"
                    ? `⚡ Elektro (${model.range_km} km Reichweite)`
                    : bus.fuel_type === "hvo"
                      ? "🌿 HVO"
                      : "Diesel"}{" "}
                  · Zustand:{" "}
                  <span className={`font-semibold ${conditionColor}`}>{condition}%</span>
                  {" · "}
                  {driver ? (
                    <>Fahrer: {driver.name}</>
                  ) : (
                    <span className="text-red-400">kein Fahrer</span>
                  )}
                </p>
              </div>
              {inWorkshop ? (
                <span className="rounded bg-amber-950 px-1.5 py-0.5 text-xs text-amber-400">
                  In der Werkstatt
                </span>
              ) : (
                !bus.assigned_route_id && (
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                    Im Depot
                  </span>
                )
              )}
            </div>

            <ActionForm action={assignBus} className="mt-3">
              {(pending) => (
                <div className="flex items-center gap-2">
                  <input type="hidden" name="bus_id" value={bus.id} />
                  <select
                    name="route_id"
                    defaultValue={bus.assigned_route_id ?? ""}
                    disabled={pending}
                    className={selectClass}
                  >
                    <option value="">— Keine Linie (Depot) —</option>
                    {routes
                      .filter((r) => r.active)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {routeLabel(r, citiesById)} ({r.distance_km} km)
                        </option>
                      ))}
                  </select>
                  <button type="submit" disabled={pending} className={smallButtonClass}>
                    {pending ? "…" : "Zuweisen"}
                  </button>
                </div>
              )}
            </ActionForm>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <UpgradesDialog bus={bus} upgrades={upgrades} ownedIds={ownedIds} cash={cash} />

              {condition < 99.5 && !inWorkshop && (
                <ActionForm action={serviceBus}>
                  {(pending) => (
                    <>
                      <input type="hidden" name="bus_id" value={bus.id} />
                      <button type="submit" disabled={pending} className={smallButtonClass}>
                        {pending ? "…" : `Warten (${formatEuro(cost)}, 1 Tag)`}
                      </button>
                    </>
                  )}
                </ActionForm>
              )}

              {model.powertrain === "diesel" && (
                <ActionForm action={setBusFuel}>
                  {(pending) => (
                    <>
                      <input type="hidden" name="bus_id" value={bus.id} />
                      <input
                        type="hidden"
                        name="fuel_type"
                        value={bus.fuel_type === "hvo" ? "diesel" : "hvo"}
                      />
                      <button type="submit" disabled={pending} className={smallButtonClass}>
                        {pending
                          ? "…"
                          : bus.fuel_type === "hvo"
                            ? "Auf Diesel wechseln"
                            : "Auf HVO wechseln 🌿"}
                      </button>
                    </>
                  )}
                </ActionForm>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
