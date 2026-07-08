"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_TICKET_PRICE,
  MIN_TICKET_PRICE,
  STARTER_BUS_CONDITION,
  STARTER_BUS_MODEL_ID,
  STARTING_CASH,
} from "@/lib/game/constants";
import { routeDistanceKm } from "@/lib/game/economy";
import { processDay } from "@/lib/game/tick";
import type { Bus, BusModel, City, PlayerStats, Route } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  return { supabase, user };
}

/** Firma gründen: Spielstand + Startkapital + gebrauchter Starter-Bus */
export async function startCompany(formData: FormData): Promise<ActionResult> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  if (companyName.length < 2 || companyName.length > 40) {
    return { ok: false, error: "Firmenname muss 2–40 Zeichen lang sein." };
  }

  const { supabase, user } = await requireUser();

  const { error: statsError } = await supabase.from("player_stats").insert({
    user_id: user.id,
    company_name: companyName,
    cash: STARTING_CASH,
    current_day: 1,
  });
  if (statsError) {
    return { ok: false, error: "Firma existiert bereits oder konnte nicht angelegt werden." };
  }

  await supabase.from("buses").insert({
    user_id: user.id,
    model_id: STARTER_BUS_MODEL_ID,
    name: "Bus 1",
    condition: STARTER_BUS_CONDITION,
    purchased_on_day: 1,
  });

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: 1,
    type: "starting_capital",
    amount: STARTING_CASH,
    description: "Startkapital",
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function buyBus(formData: FormData): Promise<ActionResult> {
  const modelId = String(formData.get("model_id") ?? "");
  const { supabase, user } = await requireUser();

  const [{ data: model }, { data: stats }, { count }] = await Promise.all([
    supabase.from("bus_models").select("*").eq("id", modelId).single(),
    supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
    supabase
      .from("buses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (!model || !stats) return { ok: false, error: "Modell oder Spielstand nicht gefunden." };
  const typedModel = model as BusModel;
  const typedStats = stats as PlayerStats;

  if (typedStats.cash < typedModel.price) {
    return { ok: false, error: "Nicht genug Geld für diesen Bus." };
  }

  const busName = `Bus ${(count ?? 0) + 1}`;

  const { error: busError } = await supabase.from("buses").insert({
    user_id: user.id,
    model_id: typedModel.id,
    name: busName,
    condition: typedModel.is_used ? STARTER_BUS_CONDITION : 100,
    purchased_on_day: typedStats.current_day,
  });
  if (busError) return { ok: false, error: "Kauf fehlgeschlagen." };

  await supabase
    .from("player_stats")
    .update({ cash: typedStats.cash - typedModel.price })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "bus_purchase",
    amount: -typedModel.price,
    description: `Kauf: ${typedModel.name} (${busName})`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createRoute(formData: FormData): Promise<ActionResult> {
  const originId = String(formData.get("origin_city_id") ?? "");
  const destId = String(formData.get("dest_city_id") ?? "");
  const price = Number(formData.get("ticket_price"));

  if (originId === destId) return { ok: false, error: "Start und Ziel müssen verschieden sein." };
  if (!Number.isFinite(price) || price < MIN_TICKET_PRICE || price > MAX_TICKET_PRICE) {
    return { ok: false, error: `Ticketpreis muss zwischen ${MIN_TICKET_PRICE} € und ${MAX_TICKET_PRICE} € liegen.` };
  }

  const { supabase, user } = await requireUser();

  const { data: cities } = await supabase
    .from("cities")
    .select("*")
    .in("id", [originId, destId]);
  const origin = (cities as City[] | null)?.find((c) => c.id === originId);
  const dest = (cities as City[] | null)?.find((c) => c.id === destId);
  if (!origin || !dest) return { ok: false, error: "Stadt nicht gefunden." };

  // Duplikate (beide Richtungen) verhindern
  const { data: existing } = await supabase
    .from("routes")
    .select("id, origin_city_id, dest_city_id")
    .eq("user_id", user.id);
  const duplicate = (existing ?? []).some(
    (r) =>
      (r.origin_city_id === originId && r.dest_city_id === destId) ||
      (r.origin_city_id === destId && r.dest_city_id === originId)
  );
  if (duplicate) return { ok: false, error: "Diese Verbindung existiert bereits." };

  const { error } = await supabase.from("routes").insert({
    user_id: user.id,
    origin_city_id: originId,
    dest_city_id: destId,
    distance_km: routeDistanceKm(origin, dest),
    ticket_price: Math.round(price * 100) / 100,
  });
  if (error) return { ok: false, error: "Route konnte nicht angelegt werden." };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateTicketPrice(formData: FormData): Promise<ActionResult> {
  const routeId = String(formData.get("route_id") ?? "");
  const price = Number(formData.get("ticket_price"));
  if (!Number.isFinite(price) || price < MIN_TICKET_PRICE || price > MAX_TICKET_PRICE) {
    return { ok: false, error: "Ungültiger Preis." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("routes")
    .update({ ticket_price: Math.round(price * 100) / 100 })
    .eq("id", routeId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Preis konnte nicht gespeichert werden." };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignBus(formData: FormData): Promise<ActionResult> {
  const busId = String(formData.get("bus_id") ?? "");
  const routeIdRaw = String(formData.get("route_id") ?? "");
  const routeId = routeIdRaw === "" ? null : routeIdRaw;

  const { supabase, user } = await requireUser();

  if (routeId) {
    const { data: route } = await supabase
      .from("routes")
      .select("id")
      .eq("id", routeId)
      .eq("user_id", user.id)
      .single();
    if (!route) return { ok: false, error: "Route nicht gefunden." };
  }

  const { error } = await supabase
    .from("buses")
    .update({ assigned_route_id: routeId })
    .eq("id", busId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Zuweisung fehlgeschlagen." };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Einen Ingame-Tag simulieren und persistieren */
export async function advanceDay(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const [{ data: stats }, { data: buses }, { data: routes }, { data: models }, { data: cities }] =
    await Promise.all([
      supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
      supabase.from("buses").select("*").eq("user_id", user.id),
      supabase.from("routes").select("*").eq("user_id", user.id),
      supabase.from("bus_models").select("*"),
      supabase.from("cities").select("*"),
    ]);

  if (!stats) return { ok: false, error: "Spielstand nicht gefunden." };
  const typedStats = stats as PlayerStats;

  const result = processDay({
    currentDay: typedStats.current_day,
    buses: (buses ?? []) as Bus[],
    routes: (routes ?? []) as Route[],
    modelsById: new Map(((models ?? []) as BusModel[]).map((m) => [m.id, m])),
    citiesById: new Map(((cities ?? []) as City[]).map((c) => [c.id, c])),
  });

  if (result.transactions.length > 0) {
    await supabase
      .from("transactions")
      .insert(result.transactions.map((t) => ({ ...t, user_id: user.id })));
  }
  for (const update of result.busUpdates) {
    await supabase
      .from("buses")
      .update({ condition: update.condition })
      .eq("id", update.id)
      .eq("user_id", user.id);
  }
  await supabase
    .from("player_stats")
    .update({
      cash: typedStats.cash + result.cashDelta,
      current_day: result.newDay,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  return { ok: true };
}
