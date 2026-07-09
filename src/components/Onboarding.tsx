"use client";

import { startCompany } from "@/app/dashboard/actions";
import { formatEuro, ActionForm } from "./ui";
import {
  STARTING_CASH,
} from "@/lib/game/constants";

export function Onboarding() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 ring-1 ring-slate-800">
        <div className="text-center">
          <div className="text-4xl">🚌</div>
          <h1 className="mt-2 text-2xl font-bold text-white">Gründe dein Busunternehmen</h1>
          <p className="mt-2 text-sm text-slate-400">
            Du startest mit {formatEuro(STARTING_CASH)} Kapital, einem gebrauchten
            Setra S 315 und einem angestellten Fahrer. Eröffne Linien, setze Preise
            und bring dein Unternehmen in die schwarzen Zahlen.
          </p>
        </div>

        <ActionForm action={startCompany} className="mt-6">
          {(pending) => (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="company_name"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Firmenname
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  required
                  minLength={2}
                  maxLength={40}
                  placeholder="z.B. Adler Reisen"
                  className="w-full rounded-lg bg-slate-800 px-3 py-2 text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400"
              >
                {pending ? "Wird gegründet…" : "Unternehmen gründen"}
              </button>
            </div>
          )}
        </ActionForm>
      </div>
    </main>
  );
}
