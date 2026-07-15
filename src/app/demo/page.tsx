"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardView } from "@/components/DashboardView";
import {
  GameActionsProvider,
  type ActionResult,
  type GameActions,
} from "@/components/GameActionsContext";
import { Onboarding } from "@/components/Onboarding";
import {
  createCompany,
  demoAdvanceDay,
  demoAssignBus,
  demoAssignDriver,
  demoBuyBus,
  demoBuyUpgrade,
  demoBuyWorkshop,
  demoCreateRoute,
  demoFireDriver,
  demoHireDriver,
  demoServiceBus,
  demoSetBusFuel,
  demoTakeLoan,
  demoUnlockRegion,
  demoUpdateRoutePrices,
  type DemoState,
} from "@/lib/demo/engine";
import { SEED_BUS_MODELS, SEED_CITIES, SEED_UPGRADES } from "@/lib/demo/seed";

const STORAGE_KEY = "bustycoon-demo-v1";

function loadState(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}

export default function DemoPage() {
  const [state, setState] = useState<DemoState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef<DemoState | null>(null);
  stateRef.current = state;

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Speicher voll o.ä. – Demo läuft dann eben ohne Persistenz weiter
    }
  }, [state, loaded]);

  const actions = useMemo<GameActions>(() => {
    const run = (
      mutate: (s: DemoState) => { state: DemoState } | { error: string }
    ): Promise<ActionResult> => {
      const current = stateRef.current;
      if (!current) return Promise.resolve({ ok: false, error: "Kein Spielstand." });
      const result = mutate(current);
      if ("error" in result) return Promise.resolve({ ok: false, error: result.error });
      setState(result.state);
      return Promise.resolve({ ok: true });
    };
    const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");
    const num = (fd: FormData, key: string) => Number(fd.get(key));

    return {
      startCompany: (fd) => {
        const result = createCompany(str(fd, "company_name"));
        if ("error" in result) return Promise.resolve({ ok: false, error: result.error });
        setState(result);
        return Promise.resolve({ ok: true });
      },
      buyBus: (fd) => run((s) => demoBuyBus(s, str(fd, "model_id"))),
      createRoute: (fd) =>
        run((s) =>
          demoCreateRoute(s, str(fd, "origin_city_id"), str(fd, "dest_city_id"), num(fd, "ticket_price"))
        ),
      updateRoutePrices: (fd) =>
        run((s) =>
          demoUpdateRoutePrices(s, str(fd, "route_id"), {
            ticket_price: num(fd, "ticket_price"),
            price_comfort: num(fd, "price_comfort"),
            price_premium: num(fd, "price_premium"),
          })
        ),
      assignBus: (fd) =>
        run((s) => demoAssignBus(s, str(fd, "bus_id"), str(fd, "route_id") || null)),
      setBusFuel: (fd) => run((s) => demoSetBusFuel(s, str(fd, "bus_id"), str(fd, "fuel_type"))),
      buyUpgrade: (fd) => run((s) => demoBuyUpgrade(s, str(fd, "bus_id"), str(fd, "upgrade_id"))),
      serviceBus: (fd) => run((s) => demoServiceBus(s, str(fd, "bus_id"))),
      hireDriver: (fd) => run((s) => demoHireDriver(s, str(fd, "experience"))),
      fireDriver: (fd) => run((s) => demoFireDriver(s, str(fd, "driver_id"))),
      assignDriver: (fd) =>
        run((s) => demoAssignDriver(s, str(fd, "driver_id"), str(fd, "bus_id") || null)),
      takeLoan: (fd) => run((s) => demoTakeLoan(s, str(fd, "offer_id"))),
      unlockRegion: (fd) => run((s) => demoUnlockRegion(s, str(fd, "region"))),
      buyWorkshop: (fd) => run((s) => demoBuyWorkshop(s, str(fd, "region"))),
      advanceDay: () => run(demoAdvanceDay),
    };
  }, []);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Lade Demo…
      </main>
    );
  }

  if (!state) {
    return (
      <GameActionsProvider actions={actions}>
        <Onboarding />
      </GameActionsProvider>
    );
  }

  return (
    <GameActionsProvider actions={actions}>
      <DashboardView
        data={{
          stats: state.stats,
          buses: state.buses,
          routes: state.routes,
          models: SEED_BUS_MODELS,
          cities: SEED_CITIES,
          drivers: state.drivers,
          upgrades: SEED_UPGRADES,
          busUpgrades: state.busUpgrades,
          loans: state.loans.filter((l) => l.remaining > 0),
          events: state.events,
          transactions: state.transactions.slice(0, 30),
        }}
        headerExtra={
          <button
            onClick={() => {
              if (confirm("Demo-Spielstand wirklich löschen?")) setState(null);
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Zurücksetzen
          </button>
        }
        notice={
          <p className="rounded-xl bg-cyan-950 p-3 text-sm text-cyan-300 ring-1 ring-cyan-900">
            🎮 <span className="font-semibold">Demo-Modus:</span> Der Spielstand
            wird nur in diesem Browser gespeichert (kein Konto nötig). Für das
            volle Spiel mit Cloud-Speicherstand:{" "}
            <Link href="/login" className="underline hover:text-white">
              Registrieren
            </Link>
            .
          </p>
        }
      />
    </GameActionsProvider>
  );
}
