"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CLASS_PRICE_MULTIPLIER,
  DRIVER_SALARIES,
  MAX_TICKET_PRICE,
  MIN_TICKET_PRICE,
  SEVERANCE_DAYS,
  STARTER_BUS_CONDITION,
  STARTER_BUS_MODEL_ID,
  STARTING_CASH,
} from "@/lib/game/constants";
import { routeDistanceKm, serviceCost } from "@/lib/game/economy";
import {
  MAX_ACTIVE_LOANS,
  REGIONS,
  WORKSHOP_COST,
  WORKSHOP_SERVICE_DISCOUNT,
  creditScore,
  levelForXp,
  loanOffers,
  totalDebt,
} from "@/lib/game/meta";
import { processDay, type BusComfort } from "@/lib/game/tick";
import type {
  Bus,
  BusModel,
  BusUpgrade,
  City,
  Driver,
  DriverExperience,
  GameEvent,
  Loan,
  PlayerStats,
  RegionId,
  Route,
  Upgrade,
} from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

const DRIVER_NAMES = [
  "Klaus Bergmann", "Sabine Krüger", "Murat Yilmaz", "Petra Lindner",
  "Jörg Steinbach", "Anna Kowalski", "Hans Ottmann", "Fatma Demir",
  "Rainer Vogt", "Melanie Busch", "Tomasz Nowak", "Ingrid Sommer",
  "Dieter Falk", "Elena Petrova", "Stefan Brandt", "Gül Aydin",
  "Werner Haas", "Katrin Ebert", "Milan Kovac", "Birgit Lorenz",
];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  return { supabase, user };
}

/** Firma gründen: Spielstand + Startkapital + gebrauchter Starter-Bus + 1 Fahrer */
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

  const { data: starterBus } = await supabase
    .from("buses")
    .insert({
      user_id: user.id,
      model_id: STARTER_BUS_MODEL_ID,
      name: "Bus 1",
      condition: STARTER_BUS_CONDITION,
      purchased_on_day: 1,
    })
    .select("id")
    .single();

  await supabase.from("drivers").insert({
    user_id: user.id,
    name: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
    experience: "experienced",
    daily_salary: DRIVER_SALARIES.experienced,
    assigned_bus_id: starterBus?.id ?? null,
    hired_on_day: 1,
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

  const level = levelForXp(typedStats.xp);
  if (level < typedModel.required_level) {
    return {
      ok: false,
      error: `${typedModel.name} wird erst ab Level ${typedModel.required_level} freigeschaltet.`,
    };
  }
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

  const [{ data: cities }, { data: stats }] = await Promise.all([
    supabase.from("cities").select("*").in("id", [originId, destId]),
    supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
  ]);
  const origin = (cities as City[] | null)?.find((c) => c.id === originId);
  const dest = (cities as City[] | null)?.find((c) => c.id === destId);
  if (!origin || !dest || !stats) return { ok: false, error: "Stadt nicht gefunden." };

  const unlocked = (stats as PlayerStats).unlocked_regions;
  for (const city of [origin, dest]) {
    if (!unlocked.includes(city.region)) {
      return {
        ok: false,
        error: `${city.name} liegt in ${REGIONS[city.region].name} – Region zuerst freischalten.`,
      };
    }
  }

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

  const rounded = Math.round(price * 100) / 100;
  const { error } = await supabase.from("routes").insert({
    user_id: user.id,
    origin_city_id: originId,
    dest_city_id: destId,
    distance_km: routeDistanceKm(origin, dest),
    ticket_price: rounded,
    price_comfort: Math.round(rounded * CLASS_PRICE_MULTIPLIER.comfort * 100) / 100,
    price_premium: Math.round(rounded * CLASS_PRICE_MULTIPLIER.premium * 100) / 100,
  });
  if (error) return { ok: false, error: "Route konnte nicht angelegt werden." };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Preise aller drei Sitzklassen einer Route setzen */
export async function updateRoutePrices(formData: FormData): Promise<ActionResult> {
  const routeId = String(formData.get("route_id") ?? "");
  const prices = {
    ticket_price: Number(formData.get("ticket_price")),
    price_comfort: Number(formData.get("price_comfort")),
    price_premium: Number(formData.get("price_premium")),
  };
  for (const value of Object.values(prices)) {
    if (!Number.isFinite(value) || value < MIN_TICKET_PRICE || value > MAX_TICKET_PRICE) {
      return { ok: false, error: "Ungültiger Preis." };
    }
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("routes")
    .update({
      ticket_price: Math.round(prices.ticket_price * 100) / 100,
      price_comfort: Math.round(prices.price_comfort * 100) / 100,
      price_premium: Math.round(prices.price_premium * 100) / 100,
    })
    .eq("id", routeId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Preise konnten nicht gespeichert werden." };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignBus(formData: FormData): Promise<ActionResult> {
  const busId = String(formData.get("bus_id") ?? "");
  const routeIdRaw = String(formData.get("route_id") ?? "");
  const routeId = routeIdRaw === "" ? null : routeIdRaw;

  const { supabase, user } = await requireUser();

  if (routeId) {
    const [{ data: route }, { data: bus }] = await Promise.all([
      supabase
        .from("routes")
        .select("*")
        .eq("id", routeId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("buses")
        .select("*, bus_models(*)")
        .eq("id", busId)
        .eq("user_id", user.id)
        .single(),
    ]);
    if (!route) return { ok: false, error: "Route nicht gefunden." };
    if (!bus) return { ok: false, error: "Bus nicht gefunden." };

    const model = (bus as Bus & { bus_models: BusModel }).bus_models;
    const typedRoute = route as Route;
    if (
      model.powertrain === "electric" &&
      model.range_km !== null &&
      typedRoute.distance_km > model.range_km
    ) {
      return {
        ok: false,
        error: `Reichweite zu gering: ${model.name} schafft ${model.range_km} km, die Strecke ist ${typedRoute.distance_km} km lang.`,
      };
    }
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

/** Treibstoff wählen (nur Verbrenner): Diesel oder HVO */
export async function setBusFuel(formData: FormData): Promise<ActionResult> {
  const busId = String(formData.get("bus_id") ?? "");
  const fuelType = String(formData.get("fuel_type") ?? "");
  if (fuelType !== "diesel" && fuelType !== "hvo") {
    return { ok: false, error: "Ungültiger Treibstoff." };
  }

  const { supabase, user } = await requireUser();
  const { data: bus } = await supabase
    .from("buses")
    .select("*, bus_models(powertrain)")
    .eq("id", busId)
    .eq("user_id", user.id)
    .single();
  if (!bus) return { ok: false, error: "Bus nicht gefunden." };
  if ((bus as { bus_models: { powertrain: string } }).bus_models.powertrain === "electric") {
    return { ok: false, error: "Elektrobusse tanken keinen Kraftstoff." };
  }

  const { error } = await supabase
    .from("buses")
    .update({ fuel_type: fuelType })
    .eq("id", busId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Treibstoff konnte nicht gesetzt werden." };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Upgrade für einen Bus kaufen */
export async function buyUpgrade(formData: FormData): Promise<ActionResult> {
  const busId = String(formData.get("bus_id") ?? "");
  const upgradeId = String(formData.get("upgrade_id") ?? "");

  const { supabase, user } = await requireUser();

  const [{ data: upgrade }, { data: stats }, { data: bus }, { data: owned }] =
    await Promise.all([
      supabase.from("upgrades").select("*").eq("id", upgradeId).single(),
      supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
      supabase.from("buses").select("id, name").eq("id", busId).eq("user_id", user.id).single(),
      supabase
        .from("bus_upgrades")
        .select("upgrade_id")
        .eq("bus_id", busId)
        .eq("upgrade_id", upgradeId)
        .maybeSingle(),
    ]);

  if (!upgrade || !stats || !bus) return { ok: false, error: "Daten nicht gefunden." };
  if (owned) return { ok: false, error: "Dieses Upgrade ist bereits eingebaut." };

  const typedUpgrade = upgrade as Upgrade;
  const typedStats = stats as PlayerStats;
  if (typedStats.cash < typedUpgrade.price) {
    return { ok: false, error: "Nicht genug Geld für dieses Upgrade." };
  }

  const { error } = await supabase.from("bus_upgrades").insert({
    bus_id: busId,
    upgrade_id: upgradeId,
    user_id: user.id,
  });
  if (error) return { ok: false, error: "Einbau fehlgeschlagen." };

  await supabase
    .from("player_stats")
    .update({ cash: typedStats.cash - typedUpgrade.price })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "upgrade_purchase",
    amount: -typedUpgrade.price,
    description: `Upgrade: ${typedUpgrade.name} (${(bus as { name: string }).name})`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Werkstatt-Service: Zustand auf 100 %. In einer Fremdwerkstatt fällt der Bus
 * einen Tag aus; mit eigener Werkstatt in der Region über Nacht und 30 % günstiger.
 */
export async function serviceBus(formData: FormData): Promise<ActionResult> {
  const busId = String(formData.get("bus_id") ?? "");
  const { supabase, user } = await requireUser();

  const [{ data: bus }, { data: stats }] = await Promise.all([
    supabase
      .from("buses")
      .select("*, bus_models(*)")
      .eq("id", busId)
      .eq("user_id", user.id)
      .single(),
    supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
  ]);
  if (!bus || !stats) return { ok: false, error: "Bus oder Spielstand nicht gefunden." };

  const typedBus = bus as Bus & { bus_models: BusModel };
  const typedStats = stats as PlayerStats;

  if (Number(typedBus.condition) >= 99.5) {
    return { ok: false, error: "Der Bus ist bereits in Top-Zustand." };
  }
  if (
    typedBus.in_maintenance_until_day !== null &&
    typedStats.current_day < typedBus.in_maintenance_until_day
  ) {
    return { ok: false, error: "Der Bus steht bereits in der Werkstatt." };
  }

  // Deckt eine eigene Werkstatt den Bus ab?
  let ownWorkshop = false;
  if (typedBus.assigned_route_id) {
    const { data: route } = await supabase
      .from("routes")
      .select("origin_city_id, dest_city_id")
      .eq("id", typedBus.assigned_route_id)
      .single();
    if (route) {
      const { data: routeCities } = await supabase
        .from("cities")
        .select("region")
        .in("id", [route.origin_city_id, route.dest_city_id]);
      ownWorkshop = ((routeCities ?? []) as { region: RegionId }[]).some((c) =>
        typedStats.workshops.includes(c.region)
      );
    }
  } else {
    ownWorkshop = typedStats.workshops.length > 0;
  }

  const baseCost = serviceCost(Number(typedBus.condition), typedBus.bus_models);
  const cost = ownWorkshop
    ? Math.round(baseCost * (1 - WORKSHOP_SERVICE_DISCOUNT))
    : baseCost;
  if (typedStats.cash < cost) {
    return { ok: false, error: `Nicht genug Geld: Der Service kostet ${cost} €.` };
  }

  await supabase
    .from("buses")
    .update({
      condition: 100,
      in_maintenance_until_day: ownWorkshop ? null : typedStats.current_day + 1,
    })
    .eq("id", busId)
    .eq("user_id", user.id);

  await supabase
    .from("player_stats")
    .update({ cash: typedStats.cash - cost })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "maintenance_service",
    amount: -cost,
    description: ownWorkshop
      ? `Service in eigener Werkstatt: ${typedBus.name} (über Nacht)`
      : `Werkstatt-Service: ${typedBus.name} (1 Tag Ausfall)`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Kredit aufnehmen (Konditionen abhängig von der Bonität) */
export async function takeLoan(formData: FormData): Promise<ActionResult> {
  const offerId = String(formData.get("offer_id") ?? "");
  const { supabase, user } = await requireUser();

  const [{ data: stats }, { data: loans }] = await Promise.all([
    supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
    supabase.from("loans").select("*").eq("user_id", user.id),
  ]);
  if (!stats) return { ok: false, error: "Spielstand nicht gefunden." };

  const typedStats = stats as PlayerStats;
  const activeLoans = ((loans ?? []) as Loan[]).filter((l) => l.remaining > 0);
  if (activeLoans.length >= MAX_ACTIVE_LOANS) {
    return { ok: false, error: `Maximal ${MAX_ACTIVE_LOANS} Kredite gleichzeitig.` };
  }

  const score = creditScore({
    cash: typedStats.cash,
    reputation: Number(typedStats.reputation),
    totalDebt: totalDebt(activeLoans),
  });
  const offer = loanOffers(score).find((o) => o.id === offerId);
  if (!offer) return { ok: false, error: "Kreditangebot nicht gefunden." };

  if (levelForXp(typedStats.xp) < offer.minLevel) {
    return { ok: false, error: `Dieser Kredit erfordert Level ${offer.minLevel}.` };
  }

  const { error } = await supabase.from("loans").insert({
    user_id: user.id,
    principal: offer.principal,
    remaining: Math.round(offer.principal * (1 + offer.interestTotalPct / 100)),
    daily_payment: offer.dailyPayment,
    interest_total_pct: offer.interestTotalPct,
    term_days: offer.termDays,
    taken_on_day: typedStats.current_day,
  });
  if (error) return { ok: false, error: "Kredit konnte nicht aufgenommen werden." };

  await supabase
    .from("player_stats")
    .update({ cash: typedStats.cash + offer.principal })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "loan_payout",
    amount: offer.principal,
    description: `${offer.label}: Auszahlung (${offer.interestTotalPct} % Zins, ${offer.termDays} Tage)`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Region freischalten (Level + Einmalzahlung) */
export async function unlockRegion(formData: FormData): Promise<ActionResult> {
  const region = String(formData.get("region") ?? "") as RegionId;
  if (!REGIONS[region]) return { ok: false, error: "Unbekannte Region." };

  const { supabase, user } = await requireUser();
  const { data: stats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!stats) return { ok: false, error: "Spielstand nicht gefunden." };

  const typedStats = stats as PlayerStats;
  const info = REGIONS[region];

  if (typedStats.unlocked_regions.includes(region)) {
    return { ok: false, error: "Region ist bereits freigeschaltet." };
  }
  if (levelForXp(typedStats.xp) < info.minLevel) {
    return { ok: false, error: `${info.name} erfordert Level ${info.minLevel}.` };
  }
  if (typedStats.cash < info.unlockCost) {
    return { ok: false, error: `Nicht genug Geld: Die Expansion kostet ${info.unlockCost.toLocaleString("de-DE")} €.` };
  }

  await supabase
    .from("player_stats")
    .update({
      cash: typedStats.cash - info.unlockCost,
      unlocked_regions: [...typedStats.unlocked_regions, region],
    })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "region_unlock",
    amount: -info.unlockCost,
    description: `Expansion: ${info.name} freigeschaltet`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Eigene Werkstatt in einer freigeschalteten Region bauen */
export async function buyWorkshop(formData: FormData): Promise<ActionResult> {
  const region = String(formData.get("region") ?? "") as RegionId;
  if (!REGIONS[region]) return { ok: false, error: "Unbekannte Region." };

  const { supabase, user } = await requireUser();
  const { data: stats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!stats) return { ok: false, error: "Spielstand nicht gefunden." };

  const typedStats = stats as PlayerStats;
  if (!typedStats.unlocked_regions.includes(region)) {
    return { ok: false, error: "Region zuerst freischalten." };
  }
  if (typedStats.workshops.includes(region)) {
    return { ok: false, error: "Hier steht bereits eine Werkstatt." };
  }
  if (typedStats.cash < WORKSHOP_COST) {
    return { ok: false, error: `Nicht genug Geld: Die Werkstatt kostet ${WORKSHOP_COST.toLocaleString("de-DE")} €.` };
  }

  await supabase
    .from("player_stats")
    .update({
      cash: typedStats.cash - WORKSHOP_COST,
      workshops: [...typedStats.workshops, region],
    })
    .eq("user_id", user.id);

  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "workshop_purchase",
    amount: -WORKSHOP_COST,
    description: `Werkstatt gebaut: ${REGIONS[region].name}`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fahrer einstellen (Gehalt nach Erfahrungsstufe) */
export async function hireDriver(formData: FormData): Promise<ActionResult> {
  const experience = String(formData.get("experience") ?? "") as DriverExperience;
  if (!["rookie", "experienced", "veteran"].includes(experience)) {
    return { ok: false, error: "Ungültige Erfahrungsstufe." };
  }

  const { supabase, user } = await requireUser();
  const { data: stats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!stats) return { ok: false, error: "Spielstand nicht gefunden." };

  const { error } = await supabase.from("drivers").insert({
    user_id: user.id,
    name: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
    experience,
    daily_salary: DRIVER_SALARIES[experience],
    hired_on_day: (stats as PlayerStats).current_day,
  });
  if (error) return { ok: false, error: "Einstellung fehlgeschlagen." };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fahrer entlassen (Abfindung: 5 Tagessätze) */
export async function fireDriver(formData: FormData): Promise<ActionResult> {
  const driverId = String(formData.get("driver_id") ?? "");
  const { supabase, user } = await requireUser();

  const [{ data: driver }, { data: stats }] = await Promise.all([
    supabase.from("drivers").select("*").eq("id", driverId).eq("user_id", user.id).single(),
    supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
  ]);
  if (!driver || !stats) return { ok: false, error: "Fahrer nicht gefunden." };

  const typedDriver = driver as Driver;
  const typedStats = stats as PlayerStats;
  const severance = typedDriver.daily_salary * SEVERANCE_DAYS;

  await supabase.from("drivers").delete().eq("id", driverId).eq("user_id", user.id);
  await supabase
    .from("player_stats")
    .update({ cash: typedStats.cash - severance })
    .eq("user_id", user.id);
  await supabase.from("transactions").insert({
    user_id: user.id,
    day: typedStats.current_day,
    type: "severance",
    amount: -severance,
    description: `Abfindung: ${typedDriver.name}`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Fahrer einem Bus zuweisen (ein Fahrer pro Bus) */
export async function assignDriver(formData: FormData): Promise<ActionResult> {
  const driverId = String(formData.get("driver_id") ?? "");
  const busIdRaw = String(formData.get("bus_id") ?? "");
  const busId = busIdRaw === "" ? null : busIdRaw;

  const { supabase, user } = await requireUser();

  if (busId) {
    const [{ data: bus }, { data: occupied }] = await Promise.all([
      supabase.from("buses").select("id").eq("id", busId).eq("user_id", user.id).single(),
      supabase
        .from("drivers")
        .select("id, name")
        .eq("assigned_bus_id", busId)
        .eq("user_id", user.id)
        .neq("id", driverId)
        .maybeSingle(),
    ]);
    if (!bus) return { ok: false, error: "Bus nicht gefunden." };
    if (occupied) {
      return {
        ok: false,
        error: `${(occupied as { name: string }).name} fährt diesen Bus bereits. Erst umsetzen.`,
      };
    }
  }

  const { error } = await supabase
    .from("drivers")
    .update({ assigned_bus_id: busId })
    .eq("id", driverId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Zuweisung fehlgeschlagen." };

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Einen Ingame-Tag simulieren und persistieren */
export async function advanceDay(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const [
    { data: stats },
    { data: buses },
    { data: routes },
    { data: drivers },
    { data: loans },
    { data: events },
    { data: models },
    { data: cities },
    { data: upgrades },
    { data: busUpgrades },
  ] = await Promise.all([
    supabase.from("player_stats").select("*").eq("user_id", user.id).single(),
    supabase.from("buses").select("*").eq("user_id", user.id),
    supabase.from("routes").select("*").eq("user_id", user.id),
    supabase.from("drivers").select("*").eq("user_id", user.id),
    supabase.from("loans").select("*").eq("user_id", user.id).gt("remaining", 0),
    supabase.from("game_events").select("*").eq("user_id", user.id),
    supabase.from("bus_models").select("*"),
    supabase.from("cities").select("*"),
    supabase.from("upgrades").select("*"),
    supabase.from("bus_upgrades").select("*").eq("user_id", user.id),
  ]);

  if (!stats) return { ok: false, error: "Spielstand nicht gefunden." };
  const typedStats = stats as PlayerStats;

  const result = processDay({
    currentDay: typedStats.current_day,
    reputation: Number(typedStats.reputation),
    buses: (buses ?? []) as Bus[],
    routes: (routes ?? []) as Route[],
    drivers: (drivers ?? []) as Driver[],
    loans: (loans ?? []) as Loan[],
    events: (events ?? []) as GameEvent[],
    modelsById: new Map(((models ?? []) as BusModel[]).map((m) => [m.id, m])),
    citiesById: new Map(((cities ?? []) as City[]).map((c) => [c.id, c])),
    comfortByBusId: buildComfortMap(
      (upgrades ?? []) as Upgrade[],
      (busUpgrades ?? []) as BusUpgrade[]
    ),
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
  for (const update of result.driverUpdates) {
    await supabase
      .from("drivers")
      .update({ satisfaction: update.satisfaction })
      .eq("id", update.id)
      .eq("user_id", user.id);
  }
  for (const update of result.loanUpdates) {
    await supabase
      .from("loans")
      .update({ remaining: update.remaining })
      .eq("id", update.id)
      .eq("user_id", user.id);
  }
  if (result.newEvents.length > 0) {
    await supabase
      .from("game_events")
      .insert(result.newEvents.map((e) => ({ ...e, user_id: user.id })));
  }
  await supabase
    .from("player_stats")
    .update({
      cash: typedStats.cash + result.cashDelta,
      current_day: result.newDay,
      reputation: result.newReputation,
      xp: typedStats.xp + result.xpGained,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Komfort-Score und Upgrade-Unterhalt pro Bus aggregieren */
function buildComfortMap(
  upgrades: Upgrade[],
  busUpgrades: BusUpgrade[]
): Map<string, BusComfort> {
  const upgradesById = new Map(upgrades.map((u) => [u.id, u]));
  const map = new Map<string, BusComfort>();
  for (const owned of busUpgrades) {
    const upgrade = upgradesById.get(owned.upgrade_id);
    if (!upgrade) continue;
    const entry = map.get(owned.bus_id) ?? { comfortScore: 0, upkeepPerDay: 0 };
    entry.comfortScore += upgrade.comfort_bonus;
    entry.upkeepPerDay += upgrade.upkeep_per_day;
    map.set(owned.bus_id, entry);
  }
  return map;
}
