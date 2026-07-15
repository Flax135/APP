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
import { randomDriverName } from "@/lib/game/names";
import { processDay, type BusComfort } from "@/lib/game/tick";
import type {
  Bus,
  BusUpgrade,
  Driver,
  DriverExperience,
  GameEvent,
  Loan,
  PlayerStats,
  RegionId,
  Route,
  Transaction,
} from "@/lib/types";
import { SEED_BUS_MODELS, SEED_CITIES, SEED_UPGRADES } from "./seed";

export type DemoState = {
  stats: PlayerStats;
  buses: Bus[];
  routes: Route[];
  drivers: Driver[];
  loans: Loan[];
  events: GameEvent[];
  busUpgrades: BusUpgrade[];
  transactions: Transaction[]; // neueste zuerst
  nextTxId: number;
};

type Result = { state: DemoState } | { error: string };

const USER = "demo";
const MAX_STORED_TRANSACTIONS = 200;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const modelsById = new Map(SEED_BUS_MODELS.map((m) => [m.id, m]));
const citiesById = new Map(SEED_CITIES.map((c) => [c.id, c]));
const upgradesById = new Map(SEED_UPGRADES.map((u) => [u.id, u]));

function addTx(
  state: DemoState,
  tx: Omit<Transaction, "id" | "user_id">
): DemoState {
  const transactions = [
    { ...tx, id: state.nextTxId, user_id: USER },
    ...state.transactions,
  ].slice(0, MAX_STORED_TRANSACTIONS);
  return { ...state, transactions, nextTxId: state.nextTxId + 1 };
}

export function createCompany(companyName: string): DemoState | { error: string } {
  const name = companyName.trim();
  if (name.length < 2 || name.length > 40) {
    return { error: "Firmenname muss 2–40 Zeichen lang sein." };
  }
  const busId = uid();
  let state: DemoState = {
    stats: {
      user_id: USER,
      company_name: name,
      cash: STARTING_CASH,
      current_day: 1,
      reputation: 3.0,
      xp: 0,
      unlocked_regions: ["de"],
      workshops: [],
    },
    buses: [
      {
        id: busId,
        user_id: USER,
        model_id: STARTER_BUS_MODEL_ID,
        name: "Bus 1",
        condition: STARTER_BUS_CONDITION,
        purchased_on_day: 1,
        assigned_route_id: null,
        fuel_type: "diesel",
        in_maintenance_until_day: null,
      },
    ],
    routes: [],
    drivers: [
      {
        id: uid(),
        user_id: USER,
        name: randomDriverName(),
        experience: "experienced",
        daily_salary: DRIVER_SALARIES.experienced,
        satisfaction: 80,
        assigned_bus_id: busId,
        hired_on_day: 1,
      },
    ],
    loans: [],
    events: [],
    busUpgrades: [],
    transactions: [],
    nextTxId: 1,
  };
  state = addTx(state, {
    day: 1,
    type: "starting_capital",
    amount: STARTING_CASH,
    description: "Startkapital",
  });
  return state;
}

export function demoBuyBus(state: DemoState, modelId: string): Result {
  const model = modelsById.get(modelId);
  if (!model) return { error: "Modell nicht gefunden." };
  if (levelForXp(state.stats.xp) < model.required_level) {
    return { error: `${model.name} wird erst ab Level ${model.required_level} freigeschaltet.` };
  }
  if (state.stats.cash < model.price) return { error: "Nicht genug Geld für diesen Bus." };

  const busName = `Bus ${state.buses.length + 1}`;
  let next: DemoState = {
    ...state,
    stats: { ...state.stats, cash: state.stats.cash - model.price },
    buses: [
      ...state.buses,
      {
        id: uid(),
        user_id: USER,
        model_id: model.id,
        name: busName,
        condition: model.is_used ? STARTER_BUS_CONDITION : 100,
        purchased_on_day: state.stats.current_day,
        assigned_route_id: null,
        fuel_type: "diesel",
        in_maintenance_until_day: null,
      },
    ],
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "bus_purchase",
    amount: -model.price,
    description: `Kauf: ${model.name} (${busName})`,
  });
  return { state: next };
}

export function demoCreateRoute(
  state: DemoState,
  originId: string,
  destId: string,
  price: number
): Result {
  if (originId === destId) return { error: "Start und Ziel müssen verschieden sein." };
  if (!Number.isFinite(price) || price < MIN_TICKET_PRICE || price > MAX_TICKET_PRICE) {
    return { error: `Ticketpreis muss zwischen ${MIN_TICKET_PRICE} € und ${MAX_TICKET_PRICE} € liegen.` };
  }
  const origin = citiesById.get(originId);
  const dest = citiesById.get(destId);
  if (!origin || !dest) return { error: "Stadt nicht gefunden." };
  for (const city of [origin, dest]) {
    if (!state.stats.unlocked_regions.includes(city.region)) {
      return { error: `${city.name} liegt in ${REGIONS[city.region].name} – Region zuerst freischalten.` };
    }
  }
  const duplicate = state.routes.some(
    (r) =>
      (r.origin_city_id === originId && r.dest_city_id === destId) ||
      (r.origin_city_id === destId && r.dest_city_id === originId)
  );
  if (duplicate) return { error: "Diese Verbindung existiert bereits." };

  const rounded = Math.round(price * 100) / 100;
  return {
    state: {
      ...state,
      routes: [
        ...state.routes,
        {
          id: uid(),
          user_id: USER,
          origin_city_id: originId,
          dest_city_id: destId,
          distance_km: routeDistanceKm(origin, dest),
          ticket_price: rounded,
          price_comfort: Math.round(rounded * CLASS_PRICE_MULTIPLIER.comfort * 100) / 100,
          price_premium: Math.round(rounded * CLASS_PRICE_MULTIPLIER.premium * 100) / 100,
          active: true,
        },
      ],
    },
  };
}

export function demoUpdateRoutePrices(
  state: DemoState,
  routeId: string,
  prices: { ticket_price: number; price_comfort: number; price_premium: number }
): Result {
  for (const value of Object.values(prices)) {
    if (!Number.isFinite(value) || value < MIN_TICKET_PRICE || value > MAX_TICKET_PRICE) {
      return { error: "Ungültiger Preis." };
    }
  }
  const routes = state.routes.map((r) =>
    r.id === routeId
      ? {
          ...r,
          ticket_price: Math.round(prices.ticket_price * 100) / 100,
          price_comfort: Math.round(prices.price_comfort * 100) / 100,
          price_premium: Math.round(prices.price_premium * 100) / 100,
        }
      : r
  );
  return { state: { ...state, routes } };
}

export function demoAssignBus(state: DemoState, busId: string, routeId: string | null): Result {
  const bus = state.buses.find((b) => b.id === busId);
  if (!bus) return { error: "Bus nicht gefunden." };
  if (routeId) {
    const route = state.routes.find((r) => r.id === routeId);
    if (!route) return { error: "Route nicht gefunden." };
    const model = modelsById.get(bus.model_id);
    if (
      model?.powertrain === "electric" &&
      model.range_km !== null &&
      route.distance_km > model.range_km
    ) {
      return {
        error: `Reichweite zu gering: ${model.name} schafft ${model.range_km} km, die Strecke ist ${route.distance_km} km lang.`,
      };
    }
  }
  return {
    state: {
      ...state,
      buses: state.buses.map((b) =>
        b.id === busId ? { ...b, assigned_route_id: routeId } : b
      ),
    },
  };
}

export function demoSetBusFuel(state: DemoState, busId: string, fuelType: string): Result {
  if (fuelType !== "diesel" && fuelType !== "hvo") return { error: "Ungültiger Treibstoff." };
  const bus = state.buses.find((b) => b.id === busId);
  if (!bus) return { error: "Bus nicht gefunden." };
  if (modelsById.get(bus.model_id)?.powertrain === "electric") {
    return { error: "Elektrobusse tanken keinen Kraftstoff." };
  }
  return {
    state: {
      ...state,
      buses: state.buses.map((b) => (b.id === busId ? { ...b, fuel_type: fuelType } : b)),
    },
  };
}

export function demoBuyUpgrade(state: DemoState, busId: string, upgradeId: string): Result {
  const upgrade = upgradesById.get(upgradeId);
  const bus = state.buses.find((b) => b.id === busId);
  if (!upgrade || !bus) return { error: "Daten nicht gefunden." };
  if (state.busUpgrades.some((u) => u.bus_id === busId && u.upgrade_id === upgradeId)) {
    return { error: "Dieses Upgrade ist bereits eingebaut." };
  }
  if (state.stats.cash < upgrade.price) return { error: "Nicht genug Geld für dieses Upgrade." };

  let next: DemoState = {
    ...state,
    stats: { ...state.stats, cash: state.stats.cash - upgrade.price },
    busUpgrades: [...state.busUpgrades, { bus_id: busId, upgrade_id: upgradeId, user_id: USER }],
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "upgrade_purchase",
    amount: -upgrade.price,
    description: `Upgrade: ${upgrade.name} (${bus.name})`,
  });
  return { state: next };
}

export function demoServiceBus(state: DemoState, busId: string): Result {
  const bus = state.buses.find((b) => b.id === busId);
  const model = bus ? modelsById.get(bus.model_id) : undefined;
  if (!bus || !model) return { error: "Bus nicht gefunden." };
  if (Number(bus.condition) >= 99.5) return { error: "Der Bus ist bereits in Top-Zustand." };
  if (
    bus.in_maintenance_until_day !== null &&
    state.stats.current_day < bus.in_maintenance_until_day
  ) {
    return { error: "Der Bus steht bereits in der Werkstatt." };
  }

  let ownWorkshop = false;
  if (bus.assigned_route_id) {
    const route = state.routes.find((r) => r.id === bus.assigned_route_id);
    if (route) {
      ownWorkshop = [route.origin_city_id, route.dest_city_id].some((cityId) => {
        const region = citiesById.get(cityId)?.region;
        return region !== undefined && state.stats.workshops.includes(region);
      });
    }
  } else {
    ownWorkshop = state.stats.workshops.length > 0;
  }

  const baseCost = serviceCost(Number(bus.condition), model);
  const cost = ownWorkshop ? Math.round(baseCost * (1 - WORKSHOP_SERVICE_DISCOUNT)) : baseCost;
  if (state.stats.cash < cost) return { error: `Nicht genug Geld: Der Service kostet ${cost} €.` };

  let next: DemoState = {
    ...state,
    stats: { ...state.stats, cash: state.stats.cash - cost },
    buses: state.buses.map((b) =>
      b.id === busId
        ? {
            ...b,
            condition: 100,
            in_maintenance_until_day: ownWorkshop ? null : state.stats.current_day + 1,
          }
        : b
    ),
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "maintenance_service",
    amount: -cost,
    description: ownWorkshop
      ? `Service in eigener Werkstatt: ${bus.name} (über Nacht)`
      : `Werkstatt-Service: ${bus.name} (1 Tag Ausfall)`,
  });
  return { state: next };
}

export function demoHireDriver(state: DemoState, experience: string): Result {
  if (!["rookie", "experienced", "veteran"].includes(experience)) {
    return { error: "Ungültige Erfahrungsstufe." };
  }
  const exp = experience as DriverExperience;
  return {
    state: {
      ...state,
      drivers: [
        ...state.drivers,
        {
          id: uid(),
          user_id: USER,
          name: randomDriverName(),
          experience: exp,
          daily_salary: DRIVER_SALARIES[exp],
          satisfaction: 80,
          assigned_bus_id: null,
          hired_on_day: state.stats.current_day,
        },
      ],
    },
  };
}

export function demoFireDriver(state: DemoState, driverId: string): Result {
  const driver = state.drivers.find((d) => d.id === driverId);
  if (!driver) return { error: "Fahrer nicht gefunden." };
  const severance = driver.daily_salary * SEVERANCE_DAYS;
  let next: DemoState = {
    ...state,
    stats: { ...state.stats, cash: state.stats.cash - severance },
    drivers: state.drivers.filter((d) => d.id !== driverId),
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "severance",
    amount: -severance,
    description: `Abfindung: ${driver.name}`,
  });
  return { state: next };
}

export function demoAssignDriver(
  state: DemoState,
  driverId: string,
  busId: string | null
): Result {
  if (busId) {
    if (!state.buses.some((b) => b.id === busId)) return { error: "Bus nicht gefunden." };
    const occupied = state.drivers.find(
      (d) => d.assigned_bus_id === busId && d.id !== driverId
    );
    if (occupied) return { error: `${occupied.name} fährt diesen Bus bereits. Erst umsetzen.` };
  }
  return {
    state: {
      ...state,
      drivers: state.drivers.map((d) =>
        d.id === driverId ? { ...d, assigned_bus_id: busId } : d
      ),
    },
  };
}

export function demoTakeLoan(state: DemoState, offerId: string): Result {
  const activeLoans = state.loans.filter((l) => l.remaining > 0);
  if (activeLoans.length >= MAX_ACTIVE_LOANS) {
    return { error: `Maximal ${MAX_ACTIVE_LOANS} Kredite gleichzeitig.` };
  }
  const score = creditScore({
    cash: state.stats.cash,
    reputation: Number(state.stats.reputation),
    totalDebt: totalDebt(activeLoans),
  });
  const offer = loanOffers(score).find((o) => o.id === offerId);
  if (!offer) return { error: "Kreditangebot nicht gefunden." };
  if (levelForXp(state.stats.xp) < offer.minLevel) {
    return { error: `Dieser Kredit erfordert Level ${offer.minLevel}.` };
  }

  let next: DemoState = {
    ...state,
    stats: { ...state.stats, cash: state.stats.cash + offer.principal },
    loans: [
      ...state.loans,
      {
        id: uid(),
        user_id: USER,
        principal: offer.principal,
        remaining: Math.round(offer.principal * (1 + offer.interestTotalPct / 100)),
        daily_payment: offer.dailyPayment,
        interest_total_pct: offer.interestTotalPct,
        term_days: offer.termDays,
        taken_on_day: state.stats.current_day,
      },
    ],
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "loan_payout",
    amount: offer.principal,
    description: `${offer.label}: Auszahlung (${offer.interestTotalPct} % Zins, ${offer.termDays} Tage)`,
  });
  return { state: next };
}

export function demoUnlockRegion(state: DemoState, region: string): Result {
  const info = REGIONS[region as RegionId];
  if (!info) return { error: "Unbekannte Region." };
  const regionId = region as RegionId;
  if (state.stats.unlocked_regions.includes(regionId)) {
    return { error: "Region ist bereits freigeschaltet." };
  }
  if (levelForXp(state.stats.xp) < info.minLevel) {
    return { error: `${info.name} erfordert Level ${info.minLevel}.` };
  }
  if (state.stats.cash < info.unlockCost) {
    return { error: `Nicht genug Geld: Die Expansion kostet ${info.unlockCost.toLocaleString("de-DE")} €.` };
  }
  let next: DemoState = {
    ...state,
    stats: {
      ...state.stats,
      cash: state.stats.cash - info.unlockCost,
      unlocked_regions: [...state.stats.unlocked_regions, regionId],
    },
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "region_unlock",
    amount: -info.unlockCost,
    description: `Expansion: ${info.name} freigeschaltet`,
  });
  return { state: next };
}

export function demoBuyWorkshop(state: DemoState, region: string): Result {
  const info = REGIONS[region as RegionId];
  if (!info) return { error: "Unbekannte Region." };
  const regionId = region as RegionId;
  if (!state.stats.unlocked_regions.includes(regionId)) {
    return { error: "Region zuerst freischalten." };
  }
  if (state.stats.workshops.includes(regionId)) {
    return { error: "Hier steht bereits eine Werkstatt." };
  }
  if (state.stats.cash < WORKSHOP_COST) {
    return { error: `Nicht genug Geld: Die Werkstatt kostet ${WORKSHOP_COST.toLocaleString("de-DE")} €.` };
  }
  let next: DemoState = {
    ...state,
    stats: {
      ...state.stats,
      cash: state.stats.cash - WORKSHOP_COST,
      workshops: [...state.stats.workshops, regionId],
    },
  };
  next = addTx(next, {
    day: state.stats.current_day,
    type: "workshop_purchase",
    amount: -WORKSHOP_COST,
    description: `Werkstatt gebaut: ${REGIONS[regionId].name}`,
  });
  return { state: next };
}

export function demoAdvanceDay(state: DemoState): Result {
  const comfortByBusId = new Map<string, BusComfort>();
  for (const owned of state.busUpgrades) {
    const upgrade = upgradesById.get(owned.upgrade_id);
    if (!upgrade) continue;
    const entry = comfortByBusId.get(owned.bus_id) ?? { comfortScore: 0, upkeepPerDay: 0 };
    entry.comfortScore += upgrade.comfort_bonus;
    entry.upkeepPerDay += upgrade.upkeep_per_day;
    comfortByBusId.set(owned.bus_id, entry);
  }

  const result = processDay({
    currentDay: state.stats.current_day,
    reputation: Number(state.stats.reputation),
    buses: state.buses,
    routes: state.routes,
    drivers: state.drivers,
    loans: state.loans.filter((l) => l.remaining > 0),
    events: state.events,
    modelsById,
    citiesById,
    comfortByBusId,
  });

  const busConditionById = new Map(result.busUpdates.map((u) => [u.id, u.condition]));
  const driverSatById = new Map(result.driverUpdates.map((u) => [u.id, u.satisfaction]));
  const loanRemainingById = new Map(result.loanUpdates.map((u) => [u.id, u.remaining]));

  let next: DemoState = {
    ...state,
    stats: {
      ...state.stats,
      cash: state.stats.cash + result.cashDelta,
      current_day: result.newDay,
      reputation: result.newReputation,
      xp: state.stats.xp + result.xpGained,
    },
    buses: state.buses.map((b) =>
      busConditionById.has(b.id) ? { ...b, condition: busConditionById.get(b.id)! } : b
    ),
    drivers: state.drivers.map((d) =>
      driverSatById.has(d.id) ? { ...d, satisfaction: driverSatById.get(d.id)! } : d
    ),
    loans: state.loans.map((l) =>
      loanRemainingById.has(l.id) ? { ...l, remaining: loanRemainingById.get(l.id)! } : l
    ),
    events: [
      ...state.events.filter((e) => e.day_end >= result.newDay),
      ...result.newEvents.map((e) => ({ ...e, id: uid(), user_id: USER })),
    ],
  };
  for (const tx of result.transactions) {
    next = addTx(next, tx);
  }
  return { state: next };
}
