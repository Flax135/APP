"use client";

import { updateTicketPrice } from "@/app/dashboard/actions";
import {
  baseDemandPerTrip,
  priceFactor,
  referencePrice,
} from "@/lib/game/economy";
import type { Bus, City, Route } from "@/lib/types";
import { ActionForm } from "./ui";

/** Nachfrage-Ampel relativ zum Marktpreis */
function demandIndicator(factor: number): { label: string; className: string } {
  if (factor >= 1.3) return { label: "Sehr hoch", className: "bg-emerald-900 text-emerald-300" };
  if (factor >= 0.9) return { label: "Gesund", className: "bg-emerald-950 text-emerald-400" };
  if (factor >= 0.6) return { label: "Gedämpft", className: "bg-amber-950 text-amber-400" };
  return { label: "Schwach", className: "bg-red-950 text-red-400" };
}

export function RoutesPanel({
  routes,
  buses,
  cities,
}: {
  routes: Route[];
  buses: Bus[];
  cities: City[];
}) {
  const citiesById = new Map(cities.map((c) => [c.id, c]));

  if (routes.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Noch keine Linien. Eröffne deine erste Verbindung und weise ihr einen Bus zu.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {routes.map((route) => {
        const origin = citiesById.get(route.origin_city_id);
        const dest = citiesById.get(route.dest_city_id);
        if (!origin || !dest) return null;

        const price = Number(route.ticket_price);
        const refPrice = referencePrice(route.distance_km);
        const factor = priceFactor(price, refPrice);
        const demand = Math.round(
          baseDemandPerTrip(origin, dest, route.distance_km) * factor
        );
        const indicator = demandIndicator(factor);
        const assignedCount = buses.filter(
          (b) => b.assigned_route_id === route.id
        ).length;

        return (
          <li key={route.id} className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">
                  {origin.name} – {dest.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {route.distance_km} km · ~{demand} Fahrgäste/Fahrt ·{" "}
                  {assignedCount === 0 ? (
                    <span className="text-red-400">kein Bus zugewiesen</span>
                  ) : (
                    `${assignedCount} Bus${assignedCount > 1 ? "se" : ""}`
                  )}
                </p>
              </div>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${indicator.className}`}>
                {indicator.label}
              </span>
            </div>

            <ActionForm action={updateTicketPrice} className="mt-3">
              {(pending) => (
                <div className="flex items-center gap-2">
                  <input type="hidden" name="route_id" value={route.id} />
                  <div className="relative min-w-0 flex-1">
                    <input
                      name="ticket_price"
                      type="number"
                      step="0.5"
                      min="1"
                      max="500"
                      defaultValue={price}
                      disabled={pending}
                      className="w-full rounded-lg bg-slate-900 px-2 py-1.5 pr-8 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      €
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:text-slate-400"
                  >
                    {pending ? "…" : "Preis setzen"}
                  </button>
                </div>
              )}
            </ActionForm>
            <p className="mt-1.5 text-xs text-slate-500">
              Marktpreis: {refPrice.toFixed(2)} €
            </p>
          </li>
        );
      })}
    </ul>
  );
}
