import type { BusModel, City, DriverExperience, FuelType } from "@/lib/types";
import {
  DRIVER_BREAKDOWN_FACTOR,
  ELECTRICITY_PRICE_PER_KWH,
  FUEL_PRICE_PER_LITER,
  HVO_PRICE_PER_LITER,
  MAX_DRIVING_HOURS_PER_DAY,
  MAX_PRICE_FACTOR,
  MIN_REFERENCE_PRICE,
  OPERATING_HOURS_PER_DAY,
  PRICE_ELASTICITY,
  REFERENCE_PRICE_PER_KM,
  REPAIR_BASE_COST,
  REPAIR_COST_FACTOR,
  SERVICE_BASE_COST,
  SERVICE_COST_PER_POINT_FACTOR,
  TURNAROUND_HOURS,
} from "./constants";

/** Straßendistanz zwischen zwei Städten: Luftlinie (Haversine) × 1,25 Umwegfaktor */
export function routeDistanceKm(a: City, b: City): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const airline = 2 * R * Math.asin(Math.sqrt(h));
  return Math.round(airline * 1.25);
}

/** Marktgerechter Referenzpreis (Economy) für eine Distanz */
export function referencePrice(distanceKm: number): number {
  return Math.max(MIN_REFERENCE_PRICE, distanceKm * REFERENCE_PRICE_PER_KM);
}

/**
 * Basisnachfrage pro Fahrt (eine Richtung) beim Referenzpreis.
 * Skaliert mit dem geometrischen Mittel der Einwohnerzahlen; sehr kurze
 * Strecken (Auto/ÖPNV-Konkurrenz) und sehr lange (Bahn/Flug) dämpfen.
 */
export function baseDemandPerTrip(
  origin: City,
  dest: City,
  distanceKm: number
): number {
  const gravity = Math.sqrt(origin.population * dest.population) / 80_000;
  let distanceFactor = 1;
  if (distanceKm < 120) distanceFactor = distanceKm / 120;
  else if (distanceKm > 450) distanceFactor = Math.max(0.35, 450 / distanceKm);
  return Math.max(4, Math.round(gravity * distanceFactor));
}

/** Preis-Nachfrage-Kurve: Nachfrage relativ zum Referenzpreis */
export function priceFactor(price: number, refPrice: number): number {
  if (price <= 0) return MAX_PRICE_FACTOR;
  return Math.min(MAX_PRICE_FACTOR, (refPrice / price) ** PRICE_ELASTICITY);
}

/** Erwartete Fahrgäste pro Fahrt (vor Kapazitätsgrenze und Klassenaufteilung) */
export function demandPerTrip(
  origin: City,
  dest: City,
  distanceKm: number,
  ticketPrice: number
): number {
  const base = baseDemandPerTrip(origin, dest, distanceKm);
  return Math.round(base * priceFactor(ticketPrice, referencePrice(distanceKm)));
}

/** Fahrzeit einer einfachen Fahrt in Stunden */
export function legHours(distanceKm: number, model: BusModel): number {
  return distanceKm / model.speed_kmh;
}

/**
 * Fahrten pro Tag: begrenzt durch Einsatzzeit UND EU-Lenkzeit des Fahrers.
 * 0, wenn die Strecke selbst für eine einzige Fahrt zu lang ist.
 */
export function tripsPerDay(distanceKm: number, model: BusModel): number {
  const leg = legHours(distanceKm, model);
  const byOperating = Math.floor(OPERATING_HOURS_PER_DAY / (leg + TURNAROUND_HOURS));
  const byDrivingTime = Math.floor(MAX_DRIVING_HOURS_PER_DAY / leg);
  return Math.max(0, Math.min(byOperating, byDrivingTime));
}

/** Energiekosten für eine Strecke in € (Diesel/HVO/Strom je nach Antrieb) */
export function energyCost(
  distanceKm: number,
  model: BusModel,
  fuelType: FuelType
): number {
  const unitsPer100 = model.consumption; // l oder kWh
  const pricePerUnit =
    model.powertrain === "electric"
      ? ELECTRICITY_PRICE_PER_KWH
      : fuelType === "hvo"
        ? HVO_PRICE_PER_LITER
        : FUEL_PRICE_PER_LITER;
  return (distanceKm * unitsPer100 * pricePerUnit) / 100;
}

/** Energie-Label fürs Buchungsjournal */
export function energyLabel(model: BusModel, fuelType: FuelType): string {
  if (model.powertrain === "electric") return "Strom";
  return fuelType === "hvo" ? "HVO" : "Diesel";
}

/**
 * Pannenwahrscheinlichkeit pro Einsatztag.
 * Steigt quadratisch mit sinkendem Zustand, sinkt mit Zuverlässigkeit
 * des Modells und Erfahrung des Fahrers.
 */
export function breakdownProbability(
  condition: number,
  model: BusModel,
  experience: DriverExperience
): number {
  const wearRisk = ((100 - condition) / 100) ** 2;
  const reliabilityRisk = 1.2 - model.reliability / 100;
  return Math.min(0.5, wearRisk * reliabilityRisk * 0.9 * DRIVER_BREAKDOWN_FACTOR[experience]);
}

/** Kosten eines Werkstatt-Service (stellt Zustand auf 100 % wieder her) */
export function serviceCost(condition: number, model: BusModel): number {
  return Math.round(
    SERVICE_BASE_COST + model.price * (100 - condition) * SERVICE_COST_PER_POINT_FACTOR
  );
}

/** Reparaturkosten nach einer Panne */
export function repairCost(model: BusModel): number {
  return Math.round(REPAIR_BASE_COST + model.price * REPAIR_COST_FACTOR);
}
