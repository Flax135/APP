"use client";

import { reputationDemandFactor } from "@/lib/game/constants";
import {
  baseDemandPerTrip,
  priceFactor,
  referencePrice,
} from "@/lib/game/economy";
import type { Bus, City, Route } from "@/lib/types";
import { RoutePriceForm } from "./RoutePriceForm";

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
  reputation,
}: {
  routes: Route[];
  buses: Bus[];
  cities: City[];
  reputation: number;
}) {
  const citiesById = new Map(cities.map((c) => [c.id, c]));
  const repFactor = reputationDemandFactor(reputation);

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

        const ecoPrice = Number(route.ticket_price);
        const refEco = referencePrice(route.distance_km);
        const factor = priceFactor(ecoPrice, refEco) * repFactor;
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

            <div className="mt-3">
              <RoutePriceForm route={route} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
