"use client";

import { useState } from "react";
import type { BusModel } from "@/lib/types";
import { useGameActions } from "./GameActionsContext";
import { ActionForm, Modal, formatEuro } from "./ui";

export function BuyBusDialog({
  models,
  cash,
  playerLevel,
}: {
  models: BusModel[];
  cash: number;
  playerLevel: number;
}) {
  const { buyBus } = useGameActions();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        + Bus kaufen
      </button>

      <Modal title="Bus kaufen" open={open} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {models.map((model) => {
            const affordable = cash >= model.price;
            const levelLocked = playerLevel < model.required_level;
            return (
              <ActionForm
                key={model.id}
                action={buyBus}
                onSuccess={() => setOpen(false)}
                className={`rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700 ${
                  levelLocked ? "opacity-60" : ""
                }`}
              >
                {(pending) => (
                  <>
                    <input type="hidden" name="model_id" value={model.id} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {model.name}
                          {model.is_used && (
                            <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                              Gebraucht
                            </span>
                          )}
                          {model.powertrain === "electric" && (
                            <span className="ml-2 rounded bg-emerald-950 px-1.5 py-0.5 text-xs text-emerald-400">
                              ⚡ Elektro
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{model.description}</p>
                        <p className="mt-2 text-xs text-slate-300">
                          {model.seats} Sitze ·{" "}
                          {model.powertrain === "electric"
                            ? `${model.consumption} kWh/100km · ${model.range_km} km Reichweite`
                            : `${model.consumption} l/100km`}{" "}
                          · {model.speed_kmh} km/h
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-400">{formatEuro(model.price)}</p>
                        <button
                          type="submit"
                          disabled={!affordable || levelLocked || pending}
                          className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {pending
                            ? "Kaufe…"
                            : levelLocked
                              ? `🔒 Level ${model.required_level}`
                              : affordable
                                ? "Kaufen"
                                : "Zu teuer"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </ActionForm>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
