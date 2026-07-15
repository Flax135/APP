"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type FormAction = (formData: FormData) => Promise<ActionResult>;

/**
 * Alle Spiel-Aktionen als austauschbares Interface: Das echte Spiel reicht
 * Server Actions (Supabase) herein, der Demo-Modus client-seitige
 * Implementierungen auf localStorage-Basis.
 */
export type GameActions = {
  startCompany: FormAction;
  buyBus: FormAction;
  createRoute: FormAction;
  updateRoutePrices: FormAction;
  assignBus: FormAction;
  setBusFuel: FormAction;
  buyUpgrade: FormAction;
  serviceBus: FormAction;
  hireDriver: FormAction;
  fireDriver: FormAction;
  assignDriver: FormAction;
  takeLoan: FormAction;
  unlockRegion: FormAction;
  buyWorkshop: FormAction;
  advanceDay: () => Promise<ActionResult>;
};

const GameActionsContext = createContext<GameActions | null>(null);

export function GameActionsProvider({
  actions,
  children,
}: {
  actions: GameActions;
  children: ReactNode;
}) {
  return (
    <GameActionsContext.Provider value={actions}>
      {children}
    </GameActionsContext.Provider>
  );
}

export function useGameActions(): GameActions {
  const actions = useContext(GameActionsContext);
  if (!actions) {
    throw new Error("useGameActions muss innerhalb eines GameActionsProvider verwendet werden");
  }
  return actions;
}
