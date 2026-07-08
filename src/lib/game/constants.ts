// Ökonomie-Konstanten – grob an realen Fernbus-Betriebskosten orientiert.
// Quellenlage (Größenordnungen): Diesel ~1,55 €/l, Reisebus 25–35 l/100km,
// Fahrertagessatz inkl. Nebenkosten ~180 €, Wartung ~0,20 €/km,
// Fernbus-Ticketniveau ~0,10–0,12 €/km.

export const STARTING_CASH = 25_000;
export const STARTER_BUS_MODEL_ID = "used-setra-315";
export const STARTER_BUS_CONDITION = 65;

export const FUEL_PRICE_PER_LITER = 1.55;
export const DRIVER_SALARY_PER_DAY = 180;
export const MAINTENANCE_COST_PER_KM = 0.2;
export const DEPOT_FEE_PER_IDLE_BUS = 25;

/** Referenzpreis pro km – Basis der Nachfragekurve */
export const REFERENCE_PRICE_PER_KM = 0.11;
export const MIN_REFERENCE_PRICE = 6;
/** Preiselastizität: Nachfrage ~ (ref/price)^ELASTICITY */
export const PRICE_ELASTICITY = 1.5;
/** Nachfrage-Faktor kann Referenz maximal verdoppeln (Dumping-Preise) */
export const MAX_PRICE_FACTOR = 2.0;

/** Einsatzstunden eines Busses pro Tag */
export const OPERATING_HOURS_PER_DAY = 14;
/** Puffer pro Fahrt (Halte, Pausen, Rangieren) in Stunden */
export const TURNAROUND_HOURS = 0.75;

/** Zustandverschleiß pro Einsatztag in Prozentpunkten */
export const CONDITION_WEAR_PER_DAY = 0.4;

/** Grenzen für den Ticketpreis im UI */
export const MIN_TICKET_PRICE = 1;
export const MAX_TICKET_PRICE = 500;
