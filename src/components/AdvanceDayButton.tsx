"use client";

import { useState, useTransition } from "react";
import { advanceDay } from "@/app/dashboard/actions";

export function AdvanceDayButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await advanceDay();
            if (!result.ok) setError(result.error);
          });
        }}
        disabled={pending}
        className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-slate-950 shadow-lg transition hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto sm:px-6"
      >
        {pending ? "Tag läuft…" : "▶ Nächster Tag"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
