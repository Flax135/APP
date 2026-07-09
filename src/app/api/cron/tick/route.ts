import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDay, type BusComfort } from "@/lib/game/tick";
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
  Upgrade,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron: lässt für ALLE Spieler einen Ingame-Tag vergehen.
 * Zeitplan in vercel.json; geschützt über CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [{ data: players }, { data: models }, { data: cities }, { data: upgrades }] =
    await Promise.all([
      supabase.from("player_stats").select("*"),
      supabase.from("bus_models").select("*"),
      supabase.from("cities").select("*"),
      supabase.from("upgrades").select("*"),
    ]);

  const modelsById = new Map(((models ?? []) as BusModel[]).map((m) => [m.id, m]));
  const citiesById = new Map(((cities ?? []) as City[]).map((c) => [c.id, c]));
  const upgradesById = new Map(((upgrades ?? []) as Upgrade[]).map((u) => [u.id, u]));

  let processed = 0;
  for (const player of (players ?? []) as PlayerStats[]) {
    const [
      { data: buses },
      { data: routes },
      { data: drivers },
      { data: busUpgrades },
      { data: loans },
      { data: events },
    ] = await Promise.all([
      supabase.from("buses").select("*").eq("user_id", player.user_id),
      supabase.from("routes").select("*").eq("user_id", player.user_id),
      supabase.from("drivers").select("*").eq("user_id", player.user_id),
      supabase.from("bus_upgrades").select("*").eq("user_id", player.user_id),
      supabase.from("loans").select("*").eq("user_id", player.user_id).gt("remaining", 0),
      supabase.from("game_events").select("*").eq("user_id", player.user_id),
    ]);

    const comfortByBusId = new Map<string, BusComfort>();
    for (const owned of (busUpgrades ?? []) as BusUpgrade[]) {
      const upgrade = upgradesById.get(owned.upgrade_id);
      if (!upgrade) continue;
      const entry = comfortByBusId.get(owned.bus_id) ?? {
        comfortScore: 0,
        upkeepPerDay: 0,
      };
      entry.comfortScore += upgrade.comfort_bonus;
      entry.upkeepPerDay += upgrade.upkeep_per_day;
      comfortByBusId.set(owned.bus_id, entry);
    }

    const result = processDay({
      currentDay: player.current_day,
      reputation: Number(player.reputation),
      buses: (buses ?? []) as Bus[],
      routes: (routes ?? []) as Route[],
      drivers: (drivers ?? []) as Driver[],
      loans: (loans ?? []) as Loan[],
      events: (events ?? []) as GameEvent[],
      modelsById,
      citiesById,
      comfortByBusId,
    });

    if (result.transactions.length > 0) {
      await supabase
        .from("transactions")
        .insert(result.transactions.map((t) => ({ ...t, user_id: player.user_id })));
    }
    for (const update of result.busUpdates) {
      await supabase.from("buses").update({ condition: update.condition }).eq("id", update.id);
    }
    for (const update of result.driverUpdates) {
      await supabase
        .from("drivers")
        .update({ satisfaction: update.satisfaction })
        .eq("id", update.id);
    }
    for (const update of result.loanUpdates) {
      await supabase.from("loans").update({ remaining: update.remaining }).eq("id", update.id);
    }
    if (result.newEvents.length > 0) {
      await supabase
        .from("game_events")
        .insert(result.newEvents.map((e) => ({ ...e, user_id: player.user_id })));
    }
    await supabase
      .from("player_stats")
      .update({
        cash: player.cash + result.cashDelta,
        current_day: result.newDay,
        reputation: result.newReputation,
        xp: player.xp + result.xpGained,
      })
      .eq("user_id", player.user_id);

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
