"use client";

import { buyWorkshop, unlockRegion } from "@/app/dashboard/actions";
import {
  REGIONS,
  WORKSHOP_COST,
} from "@/lib/game/meta";
import type { RegionId } from "@/lib/types";
import { ActionForm, formatEuro } from "./ui";

export function ExpansionPanel({
  unlockedRegions,
  workshops,
  playerLevel,
}: {
  unlockedRegions: RegionId[];
  workshops: RegionId[];
  playerLevel: number;
}) {
  const regionIds = Object.keys(REGIONS) as RegionId[];

  return (
    <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <h2 className="mb-4 font-bold">Expansion</h2>

      <ul className="space-y-2">
        {regionIds.map((regionId) => {
          const info = REGIONS[regionId];
          const unlocked = unlockedRegions.includes(regionId);
          const hasWorkshop = workshops.includes(regionId);
          const levelLocked = playerLevel < info.minLevel;

          return (
            <li key={regionId} className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {info.flag} {info.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {unlocked
                      ? hasWorkshop
                        ? "Freigeschaltet · 🔧 eigene Werkstatt"
                        : "Freigeschaltet"
                      : `${formatEuro(info.unlockCost)} · ab Level ${info.minLevel}`}
                  </p>
                </div>

                {!unlocked ? (
                  <ActionForm action={unlockRegion}>
                    {(pending) => (
                      <>
                        <input type="hidden" name="region" value={regionId} />
                        <button
                          type="submit"
                          disabled={pending || levelLocked}
                          className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                        >
                          {pending
                            ? "…"
                            : levelLocked
                              ? `Ab Level ${info.minLevel}`
                              : "Freischalten"}
                        </button>
                      </>
                    )}
                  </ActionForm>
                ) : (
                  !hasWorkshop && (
                    <ActionForm action={buyWorkshop}>
                      {(pending) => (
                        <>
                          <input type="hidden" name="region" value={regionId} />
                          <button
                            type="submit"
                            disabled={pending}
                            className="shrink-0 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:text-slate-400"
                          >
                            {pending ? "…" : `🔧 Werkstatt (${formatEuro(WORKSHOP_COST)})`}
                          </button>
                        </>
                      )}
                    </ActionForm>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Eigene Werkstatt: Service 30 % günstiger und über Nacht (kein Ausfalltag)
        für Busse auf Linien mit Start oder Ziel in der Region.
      </p>
    </section>
  );
}
