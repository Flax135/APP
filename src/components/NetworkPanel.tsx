"use client";

import { useState } from "react";
import type { Bus, City, RegionId, Route } from "@/lib/types";
import { NetworkMap } from "./NetworkMap";
import { NewRouteDialog } from "./NewRouteDialog";
import { RoutesPanel } from "./RoutesPanel";

type View = "map" | "list";

export function NetworkPanel({
  cities,
  availableCities,
  routes,
  buses,
  reputation,
  unlockedRegions,
}: {
  cities: City[];
  availableCities: City[];
  routes: Route[];
  buses: Bus[];
  reputation: number;
  unlockedRegions: RegionId[];
}) {
  const [view, setView] = useState<View>("map");

  const tabClass = (tab: View) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      view === tab
        ? "bg-slate-700 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Liniennetz</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-950 p-0.5 ring-1 ring-slate-800">
            <button onClick={() => setView("map")} className={tabClass("map")}>
              🗺️ Karte
            </button>
            <button onClick={() => setView("list")} className={tabClass("list")}>
              ☰ Liste
            </button>
          </div>
          <NewRouteDialog cities={availableCities} />
        </div>
      </div>

      {view === "map" ? (
        <NetworkMap
          cities={cities}
          routes={routes}
          buses={buses}
          unlockedRegions={unlockedRegions}
        />
      ) : (
        <RoutesPanel
          routes={routes}
          buses={buses}
          cities={cities}
          reputation={reputation}
        />
      )}
    </section>
  );
}
