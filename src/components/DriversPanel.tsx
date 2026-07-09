"use client";

import { useState } from "react";
import { assignDriver, fireDriver, hireDriver } from "@/app/dashboard/actions";
import {
  DRIVER_SALARIES,
  SEVERANCE_DAYS,
} from "@/lib/game/constants";
import type { Bus, Driver, DriverExperience } from "@/lib/types";
import { ActionForm, Modal, formatEuro } from "./ui";

const EXPERIENCE_LABELS: Record<DriverExperience, string> = {
  rookie: "Berufseinsteiger",
  experienced: "Erfahren",
  veteran: "Veteran",
};

const EXPERIENCE_HINTS: Record<DriverExperience, string> = {
  rookie: "Günstig, aber leicht erhöhtes Pannenrisiko.",
  experienced: "Solide Alltagsleistung.",
  veteran: "Schonende Fahrweise: deutlich weniger Pannen.",
};

const smallButtonClass =
  "rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:text-slate-400";

function HireDialog() {
  const [open, setOpen] = useState(false);
  const levels: DriverExperience[] = ["rookie", "experienced", "veteran"];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        + Fahrer einstellen
      </button>
      <Modal title="Fahrer einstellen" open={open} onClose={() => setOpen(false)}>
        <div className="space-y-2">
          {levels.map((level) => (
            <ActionForm
              key={level}
              action={hireDriver}
              onSuccess={() => setOpen(false)}
              className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700"
            >
              {(pending) => (
                <div className="flex items-center justify-between gap-3">
                  <input type="hidden" name="experience" value={level} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {EXPERIENCE_LABELS[level]}{" "}
                      <span className="font-normal text-slate-400">
                        {DRIVER_SALARIES[level]} €/Tag
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">{EXPERIENCE_HINTS[level]}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {pending ? "…" : "Einstellen"}
                  </button>
                </div>
              )}
            </ActionForm>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          EU-Lenkzeit: max. 9 h/Tag pro Fahrer. Bei Entlassung fällt eine Abfindung
          von {SEVERANCE_DAYS} Tagessätzen an.
        </p>
      </Modal>
    </>
  );
}

export function DriversPanel({ drivers, buses }: { drivers: Driver[]; buses: Bus[] }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Personal</h2>
        <HireDialog />
      </div>

      {drivers.length === 0 ? (
        <p className="text-sm text-slate-400">
          Keine Fahrer angestellt – ohne Fahrer fährt kein Bus!
        </p>
      ) : (
        <ul className="space-y-3">
          {drivers.map((driver) => {
            const satisfaction = Number(driver.satisfaction);
            const satColor =
              satisfaction >= 60
                ? "text-emerald-400"
                : satisfaction >= 40
                  ? "text-amber-400"
                  : "text-red-400";
            return (
              <li key={driver.id} className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{driver.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {EXPERIENCE_LABELS[driver.experience]} · {driver.daily_salary} €/Tag ·
                      Zufriedenheit:{" "}
                      <span className={`font-semibold ${satColor}`}>{satisfaction}%</span>
                    </p>
                  </div>
                  <ActionForm action={fireDriver}>
                    {(pending) => (
                      <>
                        <input type="hidden" name="driver_id" value={driver.id} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-red-950 hover:text-red-400"
                          title={`Entlassen (Abfindung ${formatEuro(driver.daily_salary * SEVERANCE_DAYS)})`}
                        >
                          {pending ? "…" : "Entlassen"}
                        </button>
                      </>
                    )}
                  </ActionForm>
                </div>

                <ActionForm action={assignDriver} className="mt-3">
                  {(pending) => (
                    <div className="flex items-center gap-2">
                      <input type="hidden" name="driver_id" value={driver.id} />
                      <select
                        name="bus_id"
                        defaultValue={driver.assigned_bus_id ?? ""}
                        disabled={pending}
                        className="min-w-0 flex-1 rounded-lg bg-slate-900 px-2 py-1.5 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">— Kein Bus —</option>
                        {buses.map((bus) => (
                          <option key={bus.id} value={bus.id}>
                            {bus.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" disabled={pending} className={smallButtonClass}>
                        {pending ? "…" : "Zuweisen"}
                      </button>
                    </div>
                  )}
                </ActionForm>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
