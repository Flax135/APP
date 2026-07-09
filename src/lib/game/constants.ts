import type { DriverExperience } from "@/lib/types";

// Ökonomie-Konstanten – grob an realen Fernbus-Betriebskosten orientiert.
// Quellenlage (Größenordnungen): Diesel ~1,55 €/l, HVO100 ~1,95 €/l,
// Strom (Depot-Laden) ~0,30 €/kWh, Reisebus 25–35 l/100km bzw. ~1 kWh/km,
// Fahrertagessatz inkl. Nebenkosten 160–240 €, Wartung ~0,20 €/km,
// Fernbus-Ticketniveau ~0,10–0,12 €/km.

export const STARTING_CASH = 25_000;
export const STARTER_BUS_MODEL_ID = "used-setra-315";
export const STARTER_BUS_CONDITION = 65;

// ---------- Treibstoff ----------
export const FUEL_PRICE_PER_LITER = 1.55; // Diesel
export const HVO_PRICE_PER_LITER = 1.95; // Biodiesel/HVO100
export const ELECTRICITY_PRICE_PER_KWH = 0.3;

export const DEPOT_FEE_PER_IDLE_BUS = 25;
export const MAINTENANCE_COST_PER_KM = 0.2;

/** Referenzpreis pro km (Economy) – Basis der Nachfragekurve */
export const REFERENCE_PRICE_PER_KM = 0.11;
export const MIN_REFERENCE_PRICE = 6;
/** Preiselastizität: Nachfrage ~ (ref/price)^ELASTICITY */
export const PRICE_ELASTICITY = 1.5;
/** Nachfrage-Faktor kann Referenz maximal verdoppeln (Dumping-Preise) */
export const MAX_PRICE_FACTOR = 2.0;

// ---------- Sitzklassen ----------
/** Sitzplatz-Aufteilung Economy/Comfort/Premium */
export const SEAT_SPLIT = { economy: 0.7, comfort: 0.2, premium: 0.1 } as const;
/** Referenzpreis-Aufschläge der Klassen */
export const CLASS_PRICE_MULTIPLIER = { comfort: 1.35, premium: 1.8 } as const;
/** Mindest-Komfort-Score, damit die Klasse voll nachgefragt wird */
export const CLASS_COMFORT_REQUIREMENT = { comfort: 3, premium: 6 } as const;
/** Nachfrage-Dämpfung, wenn der Komfort-Score nicht reicht */
export const CLASS_COMFORT_PENALTY = { comfort: 0.25, premium: 0.1 } as const;

// ---------- Betrieb & Lenkzeiten ----------
/** Einsatzstunden eines Busses pro Tag (inkl. Standzeiten) */
export const OPERATING_HOURS_PER_DAY = 14;
/** Puffer pro Fahrt (Halte, Pausen, Rangieren) in Stunden */
export const TURNAROUND_HOURS = 0.75;
/** EU-Lenkzeit (VO (EG) 561/2006): max. 9 h Lenkzeit pro Fahrer und Tag */
export const MAX_DRIVING_HOURS_PER_DAY = 9;
/** Ab dieser Tages-Lenkzeit sinkt die Fahrerzufriedenheit */
export const DRIVER_OVERWORK_HOURS = 8;

// ---------- Wartung, Verschleiß & Pannen ----------
/** Grundverschleiß pro Einsatztag in Prozentpunkten */
export const CONDITION_WEAR_BASE = 0.25;
/** Zusätzlicher Verschleiß pro gefahrenem km */
export const CONDITION_WEAR_PER_KM = 1 / 2500;
/** Werkstatt-Service: Grundpreis + Anteil am Neupreis je fehlendem Zustandspunkt */
export const SERVICE_BASE_COST = 300;
export const SERVICE_COST_PER_POINT_FACTOR = 0.0004;
/** Panne: Reparatur-Grundkosten + Anteil am Neupreis */
export const REPAIR_BASE_COST = 800;
export const REPAIR_COST_FACTOR = 0.015;
/** Zusätzlicher Zustandsverlust bei einer Panne */
export const BREAKDOWN_CONDITION_LOSS = 5;

// ---------- Personal ----------
export const DRIVER_SALARIES: Record<DriverExperience, number> = {
  rookie: 160,
  experienced: 190,
  veteran: 235,
};
/** Pannenrisiko-Faktor nach Erfahrung (schonende Fahrweise) */
export const DRIVER_BREAKDOWN_FACTOR: Record<DriverExperience, number> = {
  rookie: 1.15,
  experienced: 1.0,
  veteran: 0.8,
};
/** Abfindung bei Kündigung: Tagessätze */
export const SEVERANCE_DAYS = 5;

// ---------- Reputation ----------
/** Nachfrage-Multiplikator: 3★ = 1,0 · 5★ = 1,2 · 1★ = 0,8 */
export const reputationDemandFactor = (reputation: number) =>
  0.7 + reputation * 0.1;
/** Trägheit: Reputation bewegt sich pro Tag nur anteilig Richtung Tagesnote */
export const REPUTATION_SMOOTHING = 0.15;

/** Grenzen für den Ticketpreis im UI */
export const MIN_TICKET_PRICE = 1;
export const MAX_TICKET_PRICE = 500;
