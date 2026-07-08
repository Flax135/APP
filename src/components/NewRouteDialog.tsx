"use client";

import { useMemo, useState } from "react";
import { createRoute } from "@/app/dashboard/actions";
import { referencePrice, routeDistanceKm } from "@/lib/game/economy";
import type { City } from "@/lib/types";
import { ActionForm, Modal } from "./ui";

export function NewRouteDialog({ cities }: { cities: City[] }) {
  const [open, setOpen] = useState(false);
  const [originId, setOriginId] = useState(cities[0]?.id ?? "");
  const [destId, setDestId] = useState(cities[1]?.id ?? "");
  const [price, setPrice] = useState("");

  const preview = useMemo(() => {
    const origin = cities.find((c) => c.id === originId);
    const dest = cities.find((c) => c.id === destId);
    if (!origin || !dest || origin.id === dest.id) return null;
    const distance = routeDistanceKm(origin, dest);
    return {
      distance,
      suggested: Math.round(referencePrice(distance) * 100) / 100,
    };
  }, [cities, originId, destId]);

  const selectClass =
    "w-full rounded-lg bg-slate-800 px-3 py-2 text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        + Neue Linie
      </button>

      <Modal title="Neue Linie eröffnen" open={open} onClose={() => setOpen(false)}>
        <ActionForm action={createRoute} onSuccess={() => setOpen(false)}>
          {(pending) => (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Von</label>
                <select
                  name="origin_city_id"
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className={selectClass}
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Nach</label>
                <select
                  name="dest_city_id"
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  className={selectClass}
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {preview && (
                <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-300 ring-1 ring-slate-700">
                  <p>
                    Distanz: <span className="font-semibold text-white">{preview.distance} km</span>
                  </p>
                  <p className="mt-1">
                    Marktüblicher Preis:{" "}
                    <span className="font-semibold text-amber-400">
                      {preview.suggested.toFixed(2)} €
                    </span>{" "}
                    <button
                      type="button"
                      onClick={() => setPrice(String(preview.suggested))}
                      className="ml-1 text-xs underline hover:text-white"
                    >
                      übernehmen
                    </button>
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Ticketpreis (€)
                </label>
                <input
                  name="ticket_price"
                  type="number"
                  step="0.5"
                  min="1"
                  max="500"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={preview ? String(preview.suggested) : "z.B. 19.90"}
                  className={selectClass}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Über dem Marktpreis sinkt die Nachfrage, darunter steigt sie.
                </p>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400"
              >
                {pending ? "Wird angelegt…" : "Linie eröffnen"}
              </button>
            </div>
          )}
        </ActionForm>
      </Modal>
    </>
  );
}
