import type { GameEvent, GameEventType, Loan, RegionId } from "@/lib/types";

// =============================================================
// Level-System
// XP = beförderte Fahrgäste; Level = 1 + floor(√(XP / 500))
// L2: 500 · L3: 2.000 · L4: 4.500 · L5: 8.000 · L6: 12.500 XP
// =============================================================

export function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 500));
}

export function xpForLevel(level: number): number {
  return 500 * (level - 1) ** 2;
}

// =============================================================
// Regionen & Werkstätten
// =============================================================

export const REGIONS: Record<
  RegionId,
  { name: string; flag: string; unlockCost: number; minLevel: number }
> = {
  de: { name: "Deutschland", flag: "🇩🇪", unlockCost: 0, minLevel: 1 },
  at: { name: "Österreich", flag: "🇦🇹", unlockCost: 150_000, minLevel: 3 },
  ch: { name: "Schweiz", flag: "🇨🇭", unlockCost: 250_000, minLevel: 4 },
};

export const WORKSHOP_COST = 120_000;
/** Eigene Werkstatt: Service 30 % günstiger und ohne Ausfalltag */
export const WORKSHOP_SERVICE_DISCOUNT = 0.3;

// =============================================================
// Kredite & Bonität
// =============================================================

export type LoanOffer = {
  id: string;
  label: string;
  principal: number;
  termDays: number;
  minLevel: number;
  /** Gesamtzins über die Laufzeit in %, abhängig von der Bonität */
  interestTotalPct: number;
  dailyPayment: number;
};

export const MAX_ACTIVE_LOANS = 2;

/**
 * Bonität 5–95: Reputation, Liquidität und bestehende Schulden.
 */
export function creditScore(input: {
  cash: number;
  reputation: number;
  totalDebt: number;
}): number {
  const { cash, reputation, totalDebt } = input;
  const score =
    50 +
    (reputation - 3) * 10 +
    Math.min(20, Math.max(0, cash) / 25_000) -
    Math.min(30, totalDebt / 20_000);
  return Math.round(Math.min(95, Math.max(5, score)));
}

/** Gesamtzins über die Laufzeit, abhängig von der Bonität */
export function interestForScore(score: number): number {
  if (score >= 70) return 6;
  if (score >= 50) return 10;
  if (score >= 30) return 15;
  return 22;
}

const LOAN_TEMPLATES = [
  { id: "small", label: "Betriebsmittelkredit", principal: 25_000, termDays: 60, minLevel: 1 },
  { id: "medium", label: "Flottenkredit", principal: 100_000, termDays: 120, minLevel: 2 },
  { id: "large", label: "Expansionskredit", principal: 300_000, termDays: 240, minLevel: 4 },
] as const;

export function loanOffers(score: number): LoanOffer[] {
  const pct = interestForScore(score);
  return LOAN_TEMPLATES.map((t) => ({
    ...t,
    interestTotalPct: pct,
    dailyPayment: Math.ceil((t.principal * (1 + pct / 100)) / t.termDays),
  }));
}

export function totalDebt(loans: Loan[]): number {
  return loans.reduce((sum, l) => sum + l.remaining, 0);
}

// =============================================================
// Zufallsereignisse
// =============================================================

/** Chance pro Tag, dass ein neues Ereignis beginnt (wenn keines aktiv ist) */
export const EVENT_CHANCE_PER_DAY = 0.18;

export const EVENT_INFO: Record<
  GameEventType,
  { name: string; icon: string; describe: (magnitude: number) => string }
> = {
  fuel_spike: {
    name: "Spritpreis-Spike",
    icon: "⛽",
    describe: (m) => `Energiepreise +${Math.round((m - 1) * 100)} %`,
  },
  holiday: {
    name: "Sonderfeiertag",
    icon: "🎉",
    describe: (m) => `Nachfrage +${Math.round((m - 1) * 100)} %`,
  },
  storm: {
    name: "Unwetter",
    icon: "🌩️",
    describe: () => "Nachfrage −40 %, erhöhtes Pannenrisiko",
  },
};

export type NewGameEvent = Omit<GameEvent, "id" | "user_id">;

/** Würfelt ggf. ein neues Ereignis aus, das ab dem Folgetag gilt */
export function maybeSpawnEvent(currentDay: number): NewGameEvent | null {
  if (Math.random() >= EVENT_CHANCE_PER_DAY) return null;

  const roll = Math.random();
  const duration = 2 + Math.floor(Math.random() * 3); // 2-4 Tage
  const dayStart = currentDay + 1;
  const dayEnd = currentDay + duration;

  if (roll < 0.34) {
    const magnitude = Math.round((1.3 + Math.random() * 0.3) * 100) / 100;
    return {
      type: "fuel_spike",
      magnitude,
      day_start: dayStart,
      day_end: dayEnd,
      description: `${EVENT_INFO.fuel_spike.name}: ${EVENT_INFO.fuel_spike.describe(magnitude)}`,
    };
  }
  if (roll < 0.67) {
    const magnitude = Math.round((1.25 + Math.random() * 0.25) * 100) / 100;
    return {
      type: "holiday",
      magnitude,
      day_start: dayStart,
      day_end: dayEnd,
      description: `${EVENT_INFO.holiday.name}: ${EVENT_INFO.holiday.describe(magnitude)}`,
    };
  }
  return {
    type: "storm",
    magnitude: 0.6,
    day_start: dayStart,
    day_end: dayEnd,
    description: `${EVENT_INFO.storm.name}: ${EVENT_INFO.storm.describe(0.6)}`,
  };
}

/** Effekte der heute aktiven Ereignisse aggregieren */
export function eventModifiers(events: GameEvent[], day: number) {
  const active = events.filter((e) => e.day_start <= day && day <= e.day_end);
  let energyFactor = 1;
  let demandFactor = 1;
  let breakdownFactor = 1;
  for (const event of active) {
    if (event.type === "fuel_spike") energyFactor *= Number(event.magnitude);
    if (event.type === "holiday") demandFactor *= Number(event.magnitude);
    if (event.type === "storm") {
      demandFactor *= Number(event.magnitude);
      breakdownFactor *= 1.5;
    }
  }
  return { energyFactor, demandFactor, breakdownFactor, active };
}
