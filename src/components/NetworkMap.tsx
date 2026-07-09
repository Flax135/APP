"use client";

import { useMemo, useState } from "react";
import { createRoute } from "@/app/dashboard/actions";
import { referencePrice, routeDistanceKm } from "@/lib/game/economy";
import { REGIONS } from "@/lib/game/meta";
import type { Bus, City, RegionId, Route } from "@/lib/types";
import { ActionForm } from "./ui";

// Ausschnitt DACH; einfache Plattkarte (Länge × cos(50°), Breite linear)
const MIN_LAT = 45.7;
const MAX_LAT = 54.7;
const MIN_LNG = 5.7;
const MAX_LNG = 16.8;
const KX = Math.cos((50.3 * Math.PI) / 180) * 100; // px pro Grad Länge
const KY = 100; // px pro Grad Breite
const W = (MAX_LNG - MIN_LNG) * KX;
const H = (MAX_LAT - MIN_LAT) * KY;

const px = (city: City) => ({
  x: (city.lng - MIN_LNG) * KX,
  y: (MAX_LAT - city.lat) * KY,
});

/** Punktgröße nach Einwohnerzahl */
const dotRadius = (population: number) => 3.5 + Math.sqrt(population) / 400;

/** Label nur für Metropolen – alles andere per Tooltip/Auswahl */
const LABEL_MIN_POPULATION = 600_000;

export function NetworkMap({
  cities,
  routes,
  buses,
  unlockedRegions,
}: {
  cities: City[];
  routes: Route[];
  buses: Bus[];
  unlockedRegions: RegionId[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);

  const citiesById = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities]);
  const busCountByRoute = useMemo(() => {
    const map = new Map<string, number>();
    for (const bus of buses) {
      if (bus.assigned_route_id) {
        map.set(bus.assigned_route_id, (map.get(bus.assigned_route_id) ?? 0) + 1);
      }
    }
    return map;
  }, [buses]);

  const handleCityClick = (city: City) => {
    setHint(null);
    if (!unlockedRegions.includes(city.region)) {
      setHint(
        `${city.name} liegt in ${REGIONS[city.region].name} – Region zuerst im Expansions-Panel freischalten.`
      );
      return;
    }
    setSelected((prev) => {
      if (prev.includes(city.id)) return prev.filter((id) => id !== city.id);
      if (prev.length >= 2) return [city.id];
      return [...prev, city.id];
    });
  };

  const selectedCities = selected
    .map((id) => citiesById.get(id))
    .filter((c): c is City => Boolean(c));

  const pair = selectedCities.length === 2 ? selectedCities : null;
  const pairInfo = useMemo(() => {
    if (!pair) return null;
    const distance = routeDistanceKm(pair[0], pair[1]);
    const existing = routes.find(
      (r) =>
        (r.origin_city_id === pair[0].id && r.dest_city_id === pair[1].id) ||
        (r.origin_city_id === pair[1].id && r.dest_city_id === pair[0].id)
    );
    return {
      distance,
      suggested: Math.round(referencePrice(distance) * 100) / 100,
      existing,
    };
  }, [pair, routes]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full rounded-xl bg-slate-950 ring-1 ring-slate-800"
        role="img"
        aria-label="Liniennetz-Karte"
      >
        {/* Bestehende Linien */}
        {routes.map((route) => {
          const a = citiesById.get(route.origin_city_id);
          const b = citiesById.get(route.dest_city_id);
          if (!a || !b) return null;
          const pa = px(a);
          const pb = px(b);
          const busCount = busCountByRoute.get(route.id) ?? 0;
          return (
            <line
              key={route.id}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={busCount > 0 ? "#f59e0b" : "#64748b"}
              strokeWidth={busCount > 0 ? 2 + Math.min(3, busCount) : 2}
              strokeDasharray={busCount > 0 ? undefined : "6 5"}
              strokeLinecap="round"
              opacity={0.85}
            >
              <title>
                {a.name} – {b.name}: {route.distance_km} km,{" "}
                {busCount > 0 ? `${busCount} Bus(se)` : "kein Bus zugewiesen"}
              </title>
            </line>
          );
        })}

        {/* Vorschau der ausgewählten Verbindung */}
        {pair && !pairInfo?.existing && (
          <line
            x1={px(pair[0]).x}
            y1={px(pair[0]).y}
            x2={px(pair[1]).x}
            y2={px(pair[1]).y}
            stroke="#22d3ee"
            strokeWidth={2.5}
            strokeDasharray="4 5"
            strokeLinecap="round"
          />
        )}

        {/* Städte */}
        {cities.map((city) => {
          const { x, y } = px(city);
          const unlocked = unlockedRegions.includes(city.region);
          const isSelected = selected.includes(city.id);
          const r = dotRadius(city.population);
          return (
            <g
              key={city.id}
              onClick={() => handleCityClick(city)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={r + 6}
                fill="transparent"
              />
              <circle
                cx={x}
                cy={y}
                r={isSelected ? r + 2 : r}
                fill={isSelected ? "#fbbf24" : unlocked ? "#e2e8f0" : "#475569"}
                stroke={isSelected ? "#f59e0b" : "#0f172a"}
                strokeWidth={1.5}
                opacity={unlocked ? 1 : 0.55}
              />
              <title>
                {city.name} · {(city.population / 1000).toFixed(0)}k EW ·{" "}
                {REGIONS[city.region].name}
                {unlocked ? "" : " (gesperrt)"}
              </title>
              {(city.population >= LABEL_MIN_POPULATION || isSelected) && (
                <text
                  x={x}
                  y={y - r - 5}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={isSelected ? 700 : 500}
                  fill={isSelected ? "#fbbf24" : "#94a3b8"}
                >
                  {city.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-xs text-slate-500">
        Zwei Städte antippen, um eine Linie zu eröffnen. ─ Linie mit Bus ·
        ┄ Linie ohne Bus · gedimmte Städte: Region gesperrt.
      </p>

      {hint && (
        <p className="mt-2 rounded-lg bg-amber-950 p-2 text-sm text-amber-300 ring-1 ring-amber-900">
          {hint}
        </p>
      )}

      {selectedCities.length === 1 && (
        <p className="mt-2 text-sm text-slate-400">
          <span className="font-semibold text-white">{selectedCities[0].name}</span>{" "}
          ausgewählt – jetzt die Zielstadt antippen.
        </p>
      )}

      {pair && pairInfo && (
        <div className="mt-3 rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
          <p className="font-semibold text-white">
            {pair[0].name} – {pair[1].name}{" "}
            <span className="text-sm font-normal text-slate-400">
              {pairInfo.distance} km
            </span>
          </p>

          {pairInfo.existing ? (
            <p className="mt-2 text-sm text-slate-400">
              Diese Linie existiert bereits – Preise kannst du in der
              Listenansicht anpassen.
            </p>
          ) : (
            <ActionForm
              action={createRoute}
              onSuccess={() => setSelected([])}
              className="mt-3"
            >
              {(pending) => (
                <div className="flex items-end gap-2">
                  <input type="hidden" name="origin_city_id" value={pair[0].id} />
                  <input type="hidden" name="dest_city_id" value={pair[1].id} />
                  <label className="min-w-0 flex-1">
                    <span className="mb-0.5 block text-xs text-slate-400">
                      Economy-Preis (Markt {pairInfo.suggested.toFixed(2)} €)
                    </span>
                    <input
                      name="ticket_price"
                      type="number"
                      step="0.5"
                      min="1"
                      max="500"
                      required
                      defaultValue={pairInfo.suggested}
                      className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="shrink-0 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {pending ? "…" : "Linie eröffnen"}
                  </button>
                </div>
              )}
            </ActionForm>
          )}
        </div>
      )}
    </div>
  );
}
