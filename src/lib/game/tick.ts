import type { Bus, BusModel, City, Route, TransactionType } from "@/lib/types";
import {
  CONDITION_WEAR_PER_DAY,
  DEPOT_FEE_PER_IDLE_BUS,
  DRIVER_SALARY_PER_DAY,
  MAINTENANCE_COST_PER_KM,
} from "./constants";
import { demandPerTrip, fuelCost, tripsPerDay } from "./economy";

export type TickTransaction = {
  day: number;
  type: TransactionType;
  amount: number;
  description: string;
};

export type BusUpdate = { id: string; condition: number };

export type TickResult = {
  newDay: number;
  cashDelta: number;
  transactions: TickTransaction[];
  busUpdates: BusUpdate[];
  /** Zusammenfassung für die UI */
  summary: {
    passengers: number;
    revenue: number;
    costs: number;
  };
};

/**
 * Simuliert einen Ingame-Tag. Pure Funktion – Persistenz übernimmt der Aufrufer.
 * Pro aktiver Route mit zugewiesenen Bussen: Fahrten, Fahrgäste (Nachfrage vs.
 * Sitzplätze), Einnahmen, Treibstoff, Fahrergehalt, Wartung. Nicht zugewiesene
 * Busse zahlen Depotgebühr.
 */
export function processDay(input: {
  currentDay: number;
  buses: Bus[];
  routes: Route[];
  modelsById: Map<string, BusModel>;
  citiesById: Map<string, City>;
}): TickResult {
  const { currentDay, buses, routes, modelsById, citiesById } = input;
  const day = currentDay; // Umsätze werden dem ablaufenden Tag zugerechnet
  const transactions: TickTransaction[] = [];
  const busUpdates: BusUpdate[] = [];
  let passengersTotal = 0;
  let revenueTotal = 0;
  let costsTotal = 0;

  const routesById = new Map(routes.map((r) => [r.id, r]));

  for (const bus of buses) {
    const model = modelsById.get(bus.model_id);
    if (!model) continue;

    const route = bus.assigned_route_id
      ? routesById.get(bus.assigned_route_id)
      : undefined;

    if (!route || !route.active) {
      transactions.push({
        day,
        type: "depot_fee",
        amount: -DEPOT_FEE_PER_IDLE_BUS,
        description: `Depotgebühr: ${bus.name}`,
      });
      costsTotal += DEPOT_FEE_PER_IDLE_BUS;
      continue;
    }

    const origin = citiesById.get(route.origin_city_id);
    const dest = citiesById.get(route.dest_city_id);
    if (!origin || !dest) continue;

    const trips = tripsPerDay(route.distance_km, model);
    const demand = demandPerTrip(
      origin,
      dest,
      route.distance_km,
      Number(route.ticket_price)
    );

    let passengers = 0;
    for (let t = 0; t < trips; t++) {
      // Leichte Streuung pro Fahrt (±15 %), damit Tage nicht identisch sind
      const noise = 0.85 + Math.random() * 0.3;
      passengers += Math.min(model.seats, Math.round(demand * noise));
    }

    const revenue = Math.round(passengers * Number(route.ticket_price));
    const kmDriven = trips * route.distance_km;
    const fuel = Math.round(fuelCost(kmDriven, model));
    const maintenance = Math.round(kmDriven * MAINTENANCE_COST_PER_KM);
    const routeLabel = `${origin.name} – ${dest.name}`;

    transactions.push(
      {
        day,
        type: "ticket_revenue",
        amount: revenue,
        description: `${passengers} Tickets, ${routeLabel} (${bus.name}, ${trips} Fahrten)`,
      },
      {
        day,
        type: "fuel",
        amount: -fuel,
        description: `Diesel, ${kmDriven} km (${bus.name})`,
      },
      {
        day,
        type: "driver_salary",
        amount: -DRIVER_SALARY_PER_DAY,
        description: `Fahrergehalt (${bus.name})`,
      },
      {
        day,
        type: "maintenance",
        amount: -maintenance,
        description: `Wartung/Verschleiß, ${kmDriven} km (${bus.name})`,
      }
    );

    passengersTotal += passengers;
    revenueTotal += revenue;
    costsTotal += fuel + DRIVER_SALARY_PER_DAY + maintenance;

    busUpdates.push({
      id: bus.id,
      condition: Math.max(
        0,
        Math.round((Number(bus.condition) - CONDITION_WEAR_PER_DAY) * 10) / 10
      ),
    });
  }

  const cashDelta = transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    newDay: currentDay + 1,
    cashDelta,
    transactions,
    busUpdates,
    summary: {
      passengers: passengersTotal,
      revenue: revenueTotal,
      costs: costsTotal,
    },
  };
}
