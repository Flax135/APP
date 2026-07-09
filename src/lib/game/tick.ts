import type {
  Bus,
  BusModel,
  City,
  Driver,
  GameEvent,
  Loan,
  Route,
  TransactionType,
} from "@/lib/types";
import { eventModifiers, maybeSpawnEvent, type NewGameEvent } from "./meta";
import {
  BREAKDOWN_CONDITION_LOSS,
  CLASS_COMFORT_PENALTY,
  CLASS_COMFORT_REQUIREMENT,
  CLASS_PRICE_MULTIPLIER,
  CONDITION_WEAR_BASE,
  CONDITION_WEAR_PER_KM,
  DEPOT_FEE_PER_IDLE_BUS,
  DRIVER_OVERWORK_HOURS,
  MAINTENANCE_COST_PER_KM,
  REPUTATION_SMOOTHING,
  SEAT_SPLIT,
  reputationDemandFactor,
} from "./constants";
import {
  baseDemandPerTrip,
  breakdownProbability,
  energyCost,
  energyLabel,
  legHours,
  priceFactor,
  referencePrice,
  repairCost,
  tripsPerDay,
} from "./economy";

export type TickTransaction = {
  day: number;
  type: TransactionType;
  amount: number;
  description: string;
};

export type BusUpdate = { id: string; condition: number };
export type DriverUpdate = { id: string; satisfaction: number };
export type LoanUpdate = { id: string; remaining: number };

export type BusComfort = { comfortScore: number; upkeepPerDay: number };

export type TickResult = {
  newDay: number;
  cashDelta: number;
  newReputation: number;
  xpGained: number;
  transactions: TickTransaction[];
  busUpdates: BusUpdate[];
  driverUpdates: DriverUpdate[];
  loanUpdates: LoanUpdate[];
  newEvents: NewGameEvent[];
  summary: {
    passengers: number;
    revenue: number;
    costs: number;
    breakdowns: number;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Simuliert einen Ingame-Tag. Pure Funktion – Persistenz übernimmt der Aufrufer.
 *
 * Pro einsatzbereitem Bus (Route + Fahrer, nicht in der Werkstatt, Reichweite
 * ausreichend): Fahrten (begrenzt durch Einsatzzeit UND EU-Lenkzeit), Fahrgäste
 * in drei Sitzklassen, Einnahmen, Energie, Fahrergehalt, Wartung, Upgrade-
 * Unterhalt, Pannenrisiko. Danach: Fahrerzufriedenheit und Reputation.
 */
export function processDay(input: {
  currentDay: number;
  reputation: number;
  buses: Bus[];
  routes: Route[];
  drivers: Driver[];
  loans: Loan[];
  events: GameEvent[];
  modelsById: Map<string, BusModel>;
  citiesById: Map<string, City>;
  comfortByBusId: Map<string, BusComfort>;
}): TickResult {
  const {
    currentDay,
    reputation,
    buses,
    routes,
    drivers,
    loans,
    events,
    modelsById,
    citiesById,
    comfortByBusId,
  } = input;
  const day = currentDay; // Umsätze werden dem ablaufenden Tag zugerechnet
  const transactions: TickTransaction[] = [];
  const busUpdates: BusUpdate[] = [];
  const driverUpdates: DriverUpdate[] = [];
  const satisfactionScores: number[] = []; // Tagesnoten (1-5) je Einsatz-Bus
  let passengersTotal = 0;
  let revenueTotal = 0;
  let breakdownsTotal = 0;

  const routesById = new Map(routes.map((r) => [r.id, r]));
  const driverByBusId = new Map(
    drivers.filter((d) => d.assigned_bus_id).map((d) => [d.assigned_bus_id!, d])
  );
  const modifiers = eventModifiers(events, day);
  const repFactor = reputationDemandFactor(reputation) * modifiers.demandFactor;

  const depotFee = (bus: Bus, reason: string) => {
    transactions.push({
      day,
      type: "depot_fee",
      amount: -DEPOT_FEE_PER_IDLE_BUS,
      description: `Depotgebühr: ${bus.name} (${reason})`,
    });
  };

  for (const bus of buses) {
    const model = modelsById.get(bus.model_id);
    if (!model) continue;

    // In der Werkstatt: weder Kosten noch Umsatz (Service ist vorausbezahlt)
    if (
      bus.in_maintenance_until_day !== null &&
      currentDay < bus.in_maintenance_until_day
    ) {
      continue;
    }

    const route = bus.assigned_route_id
      ? routesById.get(bus.assigned_route_id)
      : undefined;
    if (!route || !route.active) {
      depotFee(bus, "keine Linie");
      continue;
    }

    const driver = driverByBusId.get(bus.id);
    if (!driver) {
      depotFee(bus, "kein Fahrer");
      continue;
    }

    const origin = citiesById.get(route.origin_city_id);
    const dest = citiesById.get(route.dest_city_id);
    if (!origin || !dest) continue;

    if (
      model.powertrain === "electric" &&
      model.range_km !== null &&
      route.distance_km > model.range_km
    ) {
      depotFee(bus, "Reichweite zu gering");
      continue;
    }

    let trips = tripsPerDay(route.distance_km, model);
    if (trips === 0) {
      depotFee(bus, "Strecke überschreitet Lenkzeit");
      continue;
    }

    // ---------- Panne? ----------
    const condition = Number(bus.condition);
    const breakdown =
      Math.random() <
      breakdownProbability(condition, model, driver.experience) *
        modifiers.breakdownFactor;
    if (breakdown) {
      breakdownsTotal++;
      trips = Math.max(1, Math.ceil(trips / 2)); // halber Tag fällt aus
      transactions.push({
        day,
        type: "repair",
        amount: -repairCost(model),
        description: `Panne: ${bus.name} auf ${origin.name} – ${dest.name}, Reparatur`,
      });
    }

    // ---------- Fahrgäste in drei Sitzklassen ----------
    const comfort = comfortByBusId.get(bus.id) ?? {
      comfortScore: 0,
      upkeepPerDay: 0,
    };
    const baseDemand = baseDemandPerTrip(origin, dest, route.distance_km);
    const refEco = referencePrice(route.distance_km);

    const seatsEco = Math.floor(model.seats * SEAT_SPLIT.economy);
    const seatsComfort = Math.floor(model.seats * SEAT_SPLIT.comfort);
    const seatsPremium = model.seats - seatsEco - seatsComfort;

    const classes = [
      {
        label: "Eco",
        seats: seatsEco,
        price: Number(route.ticket_price),
        ref: refEco,
        share: SEAT_SPLIT.economy,
        gate: 1,
      },
      {
        label: "Comfort",
        seats: seatsComfort,
        price: Number(route.price_comfort),
        ref: refEco * CLASS_PRICE_MULTIPLIER.comfort,
        share: SEAT_SPLIT.comfort,
        gate:
          comfort.comfortScore >= CLASS_COMFORT_REQUIREMENT.comfort
            ? 1
            : CLASS_COMFORT_PENALTY.comfort,
      },
      {
        label: "Premium",
        seats: seatsPremium,
        price: Number(route.price_premium),
        ref: refEco * CLASS_PRICE_MULTIPLIER.premium,
        share: SEAT_SPLIT.premium,
        gate:
          comfort.comfortScore >= CLASS_COMFORT_REQUIREMENT.premium
            ? 1
            : CLASS_COMFORT_PENALTY.premium,
      },
    ];

    let passengers = 0;
    let revenue = 0;
    const classCounts: string[] = [];
    for (const cls of classes) {
      let clsPassengers = 0;
      for (let t = 0; t < trips; t++) {
        // Leichte Streuung pro Fahrt (±15 %), damit Tage nicht identisch sind
        const noise = 0.85 + Math.random() * 0.3;
        const demand = Math.round(
          baseDemand *
            cls.share *
            priceFactor(cls.price, cls.ref) *
            repFactor *
            cls.gate *
            noise
        );
        clsPassengers += Math.min(cls.seats, demand);
      }
      passengers += clsPassengers;
      revenue += Math.round(clsPassengers * cls.price);
      classCounts.push(`${clsPassengers} ${cls.label}`);
    }

    const kmDriven = trips * route.distance_km;
    const energy = Math.round(
      energyCost(kmDriven, model, bus.fuel_type) * modifiers.energyFactor
    );
    const maintenance = Math.round(kmDriven * MAINTENANCE_COST_PER_KM);
    const routeLabel = `${origin.name} – ${dest.name}`;

    transactions.push(
      {
        day,
        type: "ticket_revenue",
        amount: revenue,
        description: `${passengers} Tickets (${classCounts.join(", ")}), ${routeLabel} (${bus.name}, ${trips} Fahrten${breakdown ? ", Panne!" : ""})`,
      },
      {
        day,
        type: "fuel",
        amount: -energy,
        description: `${energyLabel(model, bus.fuel_type)}, ${kmDriven} km (${bus.name})`,
      },
      {
        day,
        type: "driver_salary",
        amount: -driver.daily_salary,
        description: `Gehalt: ${driver.name} (${bus.name})`,
      },
      {
        day,
        type: "maintenance",
        amount: -maintenance,
        description: `Verschleiß, ${kmDriven} km (${bus.name})`,
      }
    );
    if (comfort.upkeepPerDay > 0) {
      transactions.push({
        day,
        type: "maintenance",
        amount: -comfort.upkeepPerDay,
        description: `Upgrade-Unterhalt (${bus.name})`,
      });
    }

    passengersTotal += passengers;
    revenueTotal += revenue;

    // ---------- Zustand ----------
    const wear = CONDITION_WEAR_BASE + kmDriven * CONDITION_WEAR_PER_KM;
    const newCondition = clamp(
      Math.round((condition - wear - (breakdown ? BREAKDOWN_CONDITION_LOSS : 0)) * 10) / 10,
      0,
      100
    );
    busUpdates.push({ id: bus.id, condition: newCondition });

    // ---------- Fahrerzufriedenheit (EU-Lenkzeit als Wohlfühlgrenze) ----------
    const drivingHours = trips * legHours(route.distance_km, model);
    const satisfactionDelta = drivingHours > DRIVER_OVERWORK_HOURS ? -3 : 1;
    driverUpdates.push({
      id: driver.id,
      satisfaction: clamp(
        Math.round((Number(driver.satisfaction) + satisfactionDelta) * 10) / 10,
        0,
        100
      ),
    });

    // ---------- Tagesnote für die Reputation ----------
    const fairness = clamp(
      (priceFactor(Number(route.ticket_price), refEco) - 1) * 0.5,
      -1.0,
      0.4
    );
    const fuelBonus =
      model.powertrain === "electric" ? 0.35 : bus.fuel_type === "hvo" ? 0.2 : 0;
    const score = clamp(
      3 +
        comfort.comfortScore * 0.12 +
        fairness +
        fuelBonus +
        (breakdown ? -1.2 : 0) +
        (Number(driver.satisfaction) < 40 ? -0.4 : 0),
      1,
      5
    );
    satisfactionScores.push(score);
  }

  // ---------- Kreditraten (fixe Verbindlichkeit, unabhängig vom Betrieb) ----------
  const loanUpdates: LoanUpdate[] = [];
  for (const loan of loans) {
    if (loan.remaining <= 0) continue;
    const payment = Math.min(loan.daily_payment, loan.remaining);
    transactions.push({
      day,
      type: "loan_payment",
      amount: -payment,
      description: `Kreditrate (Rest ${(loan.remaining - payment).toLocaleString("de-DE")} €)`,
    });
    loanUpdates.push({ id: loan.id, remaining: loan.remaining - payment });
  }

  // ---------- Neues Zufallsereignis? (gilt ab morgen) ----------
  const newEvents: NewGameEvent[] = [];
  const hasOngoingEvent = events.some((e) => e.day_end >= currentDay + 1);
  if (!hasOngoingEvent) {
    const spawned = maybeSpawnEvent(currentDay);
    if (spawned) newEvents.push(spawned);
  }

  // ---------- Reputation: träge Richtung Tagesdurchschnitt ----------
  let newReputation = reputation;
  if (satisfactionScores.length > 0) {
    const avg =
      satisfactionScores.reduce((sum, s) => sum + s, 0) / satisfactionScores.length;
    newReputation =
      Math.round(
        clamp(reputation + (avg - reputation) * REPUTATION_SMOOTHING, 1, 5) * 10
      ) / 10;
  }

  const cashDelta = transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    newDay: currentDay + 1,
    cashDelta,
    newReputation,
    xpGained: passengersTotal, // 1 XP pro befördertem Fahrgast
    transactions,
    busUpdates,
    driverUpdates,
    loanUpdates,
    newEvents,
    summary: {
      passengers: passengersTotal,
      revenue: revenueTotal,
      costs: revenueTotal - cashDelta,
      breakdowns: breakdownsTotal,
    },
  };
}
