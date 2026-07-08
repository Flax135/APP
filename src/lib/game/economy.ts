import type { BusModel, City } from "@/lib/types";
import {
  FUEL_PRICE_PER_LITER,
  MAX_PRICE_FACTOR,
  MIN_REFERENCE_PRICE,
  OPERATING_HOURS_PER_DAY,
  PRICE_ELASTICITY,
  REFERENCE_PRICE_PER_KM,
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

/** Marktgerechter Referenzpreis für eine Distanz */
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

/** Erwartete Fahrgäste pro Fahrt (vor Kapazitätsgrenze) */
export function demandPerTrip(
  origin: City,
  dest: City,
  distanceKm: number,
  ticketPrice: number
): number {
  const base = baseDemandPerTrip(origin, dest, distanceKm);
  return Math.round(base * priceFactor(ticketPrice, referencePrice(distanceKm)));
}

/** Wie viele einfache Fahrten schafft ein Bus pro Tag auf dieser Distanz? */
export function tripsPerDay(distanceKm: number, model: BusModel): number {
  const hoursPerLeg = distanceKm / model.speed_kmh + TURNAROUND_HOURS;
  return Math.max(1, Math.floor(OPERATING_HOURS_PER_DAY / hoursPerLeg));
}

/** Treibstoffkosten für eine Strecke in € */
export function fuelCost(distanceKm: number, model: BusModel): number {
  return (distanceKm * model.consumption * FUEL_PRICE_PER_LITER) / 100;
}
