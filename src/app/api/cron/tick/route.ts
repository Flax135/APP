import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDay } from "@/lib/game/tick";
import type { Bus, BusModel, City, PlayerStats, Route } from "@/lib/types";

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

  const [{ data: players }, { data: models }, { data: cities }] = await Promise.all([
    supabase.from("player_stats").select("*"),
    supabase.from("bus_models").select("*"),
    supabase.from("cities").select("*"),
  ]);

  const modelsById = new Map(((models ?? []) as BusModel[]).map((m) => [m.id, m]));
  const citiesById = new Map(((cities ?? []) as City[]).map((c) => [c.id, c]));

  let processed = 0;
  for (const player of (players ?? []) as PlayerStats[]) {
    const [{ data: buses }, { data: routes }] = await Promise.all([
      supabase.from("buses").select("*").eq("user_id", player.user_id),
      supabase.from("routes").select("*").eq("user_id", player.user_id),
    ]);

    const result = processDay({
      currentDay: player.current_day,
      buses: (buses ?? []) as Bus[],
      routes: (routes ?? []) as Route[],
      modelsById,
      citiesById,
    });

    if (result.transactions.length > 0) {
      await supabase
        .from("transactions")
        .insert(result.transactions.map((t) => ({ ...t, user_id: player.user_id })));
    }
    for (const update of result.busUpdates) {
      await supabase.from("buses").update({ condition: update.condition }).eq("id", update.id);
    }
    await supabase
      .from("player_stats")
      .update({
        cash: player.cash + result.cashDelta,
        current_day: result.newDay,
      })
      .eq("user_id", player.user_id);

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
