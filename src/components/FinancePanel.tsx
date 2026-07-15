"use client";

import { MAX_ACTIVE_LOANS, type LoanOffer } from "@/lib/game/meta";
import type { Loan } from "@/lib/types";
import { useGameActions } from "./GameActionsContext";
import { ActionForm, formatEuro } from "./ui";

export function FinancePanel({
  loans,
  offers,
  score,
  playerLevel,
}: {
  loans: Loan[];
  offers: LoanOffer[];
  score: number;
  playerLevel: number;
}) {
  const { takeLoan } = useGameActions();
  const activeLoans = loans.filter((l) => l.remaining > 0);
  const scoreColor =
    score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const canBorrow = activeLoans.length < MAX_ACTIVE_LOANS;

  return (
    <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Finanzierung</h2>
        <span className="text-sm text-slate-400">
          Bonität: <span className={`font-bold ${scoreColor}`}>{score}/100</span>
        </span>
      </div>

      {activeLoans.length > 0 && (
        <ul className="mb-4 space-y-2">
          {activeLoans.map((loan) => {
            const total = Math.round(loan.principal * (1 + Number(loan.interest_total_pct) / 100));
            const progress = Math.round(((total - loan.remaining) / total) * 100);
            return (
              <li key={loan.id} className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">
                    {formatEuro(loan.principal)} Kredit
                  </span>
                  <span className="text-slate-400">
                    Rate {formatEuro(loan.daily_payment)}/Tag
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Restschuld {formatEuro(loan.remaining)} ({Number(loan.interest_total_pct)} % Zins)
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {canBorrow ? (
        <div className="space-y-2">
          {offers.map((offer) => {
            const levelLocked = playerLevel < offer.minLevel;
            return (
              <ActionForm
                key={offer.id}
                action={takeLoan}
                className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700"
              >
                {(pending) => (
                  <div className="flex items-center justify-between gap-3">
                    <input type="hidden" name="offer_id" value={offer.id} />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {offer.label}{" "}
                        <span className="font-normal text-amber-400">
                          {formatEuro(offer.principal)}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {offer.interestTotalPct} % Zins · {offer.termDays} Tage · Rate{" "}
                        {formatEuro(offer.dailyPayment)}/Tag
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={pending || levelLocked}
                      className="shrink-0 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-500"
                    >
                      {pending ? "…" : levelLocked ? `Ab Level ${offer.minLevel}` : "Aufnehmen"}
                    </button>
                  </div>
                )}
              </ActionForm>
            );
          })}
          <p className="text-xs text-slate-500">
            Bessere Reputation und mehr Liquidität senken den Zins. Raten werden
            täglich fällig – auch wenn kein Bus fährt.
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Kreditlimit erreicht ({MAX_ACTIVE_LOANS} gleichzeitig). Erst tilgen, dann neu aufnehmen.
        </p>
      )}
    </section>
  );
}
