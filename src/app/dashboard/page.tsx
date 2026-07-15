import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";
import { DashboardView } from "@/components/DashboardView";
import { GameActionsProvider } from "@/components/GameActionsContext";
import { Onboarding } from "@/components/Onboarding";
import * as actions from "./actions";
import type {
  Bus,
  BusModel,
  BusUpgrade,
  City,
  Driver,
  GameEvent,
  Loan,
  PlayerStats,
  Route,
  Transaction,
  Upgrade,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const gameActions = {
  startCompany: actions.startCompany,
  buyBus: actions.buyBus,
  createRoute: actions.createRoute,
  updateRoutePrices: actions.updateRoutePrices,
  assignBus: actions.assignBus,
  setBusFuel: actions.setBusFuel,
  buyUpgrade: actions.buyUpgrade,
  serviceBus: actions.serviceBus,
  hireDriver: actions.hireDriver,
  fireDriver: actions.fireDriver,
  assignDriver: actions.assignDriver,
  takeLoan: actions.takeLoan,
  unlockRegion: actions.unlockRegion,
  buyWorkshop: actions.buyWorkshop,
  advanceDay: actions.advanceDay,
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statsData } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!statsData) {
    return (
      <GameActionsProvider actions={gameActions}>
        <Onboarding />
      </GameActionsProvider>
    );
  }
  const stats = statsData as PlayerStats;

  const [
    { data: buses },
    { data: routes },
    { data: models },
    { data: cities },
    { data: drivers },
    { data: upgrades },
    { data: busUpgrades },
    { data: loans },
    { data: events },
    { data: transactions },
  ] = await Promise.all([
    supabase.from("buses").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("routes").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("bus_models").select("*").order("price"),
    supabase.from("cities").select("*").order("name"),
    supabase.from("drivers").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("upgrades").select("*").order("price"),
    supabase.from("bus_upgrades").select("*").eq("user_id", user.id),
    supabase.from("loans").select("*").eq("user_id", user.id).gt("remaining", 0),
    supabase
      .from("game_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("day_end", stats.current_day),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(30),
  ]);

  return (
    <GameActionsProvider actions={gameActions}>
      <DashboardView
        data={{
          stats,
          buses: (buses ?? []) as Bus[],
          routes: (routes ?? []) as Route[],
          models: (models ?? []) as BusModel[],
          cities: (cities ?? []) as City[],
          drivers: (drivers ?? []) as Driver[],
          upgrades: (upgrades ?? []) as Upgrade[],
          busUpgrades: (busUpgrades ?? []) as BusUpgrade[],
          loans: (loans ?? []) as Loan[],
          events: (events ?? []) as GameEvent[],
          transactions: (transactions ?? []) as Transaction[],
        }}
        headerExtra={
          <form action={signout}>
            <button className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white">
              Abmelden
            </button>
          </form>
        }
      />
    </GameActionsProvider>
  );
}
