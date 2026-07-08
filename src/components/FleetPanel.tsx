"use client";

import { assignBus } from "@/app/dashboard/actions";
import type { Bus, BusModel, City, Route } from "@/lib/types";
import { ActionForm } from "./ui";

function routeLabel(route: Route, citiesById: Map<string, City>): string {
  const a = citiesById.get(route.origin_city_id)?.name ?? "?";
  const b = citiesById.get(route.dest_city_id)?.name ?? "?";
  return `${a} – ${b}`;
}

export function FleetPanel({
  buses,
  routes,
  models,
  cities,
}: {
  buses: Bus[];
  routes: Route[];
  models: BusModel[];
  cities: City[];
}) {
  const modelsById = new Map(models.map((m) => [m.id, m]));
  const citiesById = new Map(cities.map((c) => [c.id, c]));

  if (buses.length === 0) {
    return <p className="text-sm text-slate-400">Noch keine Busse in der Flotte.</p>;
  }

  return (
    <ul className="space-y-3">
      {buses.map((bus) => {
        const model = modelsById.get(bus.model_id);
        const condition = Number(bus.condition);
        const conditionColor =
          condition > 70 ? "text-emerald-400" : condition > 40 ? "text-amber-400" : "text-red-400";

        return (
          <li key={bus.id} className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">
                  {bus.name}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    {model?.name ?? "Unbekannt"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {model?.seats ?? "?"} Sitze · Zustand:{" "}
                  <span className={`font-semibold ${conditionColor}`}>{condition}%</span>
                </p>
              </div>
              {!bus.assigned_route_id && (
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                  Im Depot
                </span>
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
                    className="min-w-0 flex-1 rounded-lg bg-slate-900 px-2 py-1.5 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">— Keine Linie (Depot) —</option>
                    {routes
                      .filter((r) => r.active)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {routeLabel(r, citiesById)}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:text-slate-400"
                  >
                    {pending ? "…" : "Zuweisen"}
                  </button>
                </div>
              )}
            </ActionForm>
          </li>
        );
      })}
    </ul>
  );
}
