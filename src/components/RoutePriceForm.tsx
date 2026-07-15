"use client";

import { CLASS_PRICE_MULTIPLIER } from "@/lib/game/constants";
import { referencePrice } from "@/lib/game/economy";
import type { Route } from "@/lib/types";
import { useGameActions } from "./GameActionsContext";
import { ActionForm } from "./ui";

function PriceInput({
  name,
  label,
  defaultValue,
  refPrice,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue: number;
  refPrice: number;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-xs text-slate-400">
        {label} <span className="text-slate-500">(Markt {refPrice.toFixed(2)} €)</span>
      </span>
      <div className="relative">
        <input
          name={name}
          type="number"
          step="0.01"
          min="1"
          max="500"
          defaultValue={defaultValue}
          disabled={disabled}
          className="w-full rounded-lg bg-slate-900 px-2 py-1.5 pr-7 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          €
        </span>
      </div>
    </label>
  );
}

/** Preis-Editor für alle drei Sitzklassen einer Route */
export function RoutePriceForm({ route }: { route: Route }) {
  const { updateRoutePrices } = useGameActions();
  const refEco = referencePrice(route.distance_km);

  return (
    <ActionForm action={updateRoutePrices}>
      {(pending) => (
        <>
          <input type="hidden" name="route_id" value={route.id} />
          <div className="grid grid-cols-3 gap-2">
            <PriceInput
              name="ticket_price"
              label="Economy"
              defaultValue={Number(route.ticket_price)}
              refPrice={refEco}
              disabled={pending}
            />
            <PriceInput
              name="price_comfort"
              label="Comfort"
              defaultValue={Number(route.price_comfort)}
              refPrice={refEco * CLASS_PRICE_MULTIPLIER.comfort}
              disabled={pending}
            />
            <PriceInput
              name="price_premium"
              label="Premium"
              defaultValue={Number(route.price_premium)}
              refPrice={refEco * CLASS_PRICE_MULTIPLIER.premium}
              disabled={pending}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:text-slate-400"
          >
            {pending ? "…" : "Preise setzen"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
