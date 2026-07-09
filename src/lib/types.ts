export type Powertrain = "diesel" | "electric";
export type FuelType = "diesel" | "hvo";
export type DriverExperience = "rookie" | "experienced" | "veteran";

export type BusModel = {
  id: string;
  name: string;
  price: number;
  seats: number;
  consumption: number; // Diesel: l/100km, Elektro: kWh/100km
  speed_kmh: number;
  reliability: number; // 0-100
  is_used: boolean;
  powertrain: Powertrain;
  range_km: number | null; // nur Elektro
  required_level: number;
  description: string;
};

export type RegionId = "de" | "at" | "ch";

export type City = {
  id: string;
  name: string;
  population: number;
  lat: number;
  lng: number;
  region: RegionId;
};

export type PlayerStats = {
  user_id: string;
  company_name: string;
  cash: number;
  current_day: number;
  reputation: number; // 1.0-5.0 Sterne
  xp: number;
  unlocked_regions: RegionId[];
  workshops: RegionId[];
};

export type Loan = {
  id: string;
  user_id: string;
  principal: number;
  remaining: number;
  daily_payment: number;
  interest_total_pct: number;
  term_days: number;
  taken_on_day: number;
};

export type GameEventType = "fuel_spike" | "holiday" | "storm";

export type GameEvent = {
  id: string;
  user_id: string;
  type: GameEventType;
  magnitude: number;
  day_start: number;
  day_end: number;
  description: string;
};

export type Bus = {
  id: string;
  user_id: string;
  model_id: string;
  name: string;
  condition: number;
  purchased_on_day: number;
  assigned_route_id: string | null;
  fuel_type: FuelType;
  in_maintenance_until_day: number | null;
};

export type Route = {
  id: string;
  user_id: string;
  origin_city_id: string;
  dest_city_id: string;
  distance_km: number;
  ticket_price: number; // Economy
  price_comfort: number;
  price_premium: number;
  active: boolean;
};

export type Driver = {
  id: string;
  user_id: string;
  name: string;
  experience: DriverExperience;
  daily_salary: number;
  satisfaction: number; // 0-100
  assigned_bus_id: string | null;
  hired_on_day: number;
};

export type Upgrade = {
  id: string;
  name: string;
  price: number;
  upkeep_per_day: number;
  comfort_bonus: number;
  description: string;
};

export type BusUpgrade = {
  bus_id: string;
  upgrade_id: string;
  user_id: string;
};

export type TransactionType =
  | "ticket_revenue"
  | "fuel"
  | "driver_salary"
  | "maintenance"
  | "bus_purchase"
  | "depot_fee"
  | "starting_capital"
  | "upgrade_purchase"
  | "maintenance_service"
  | "repair"
  | "severance"
  | "loan_payout"
  | "loan_payment"
  | "region_unlock"
  | "workshop_purchase";

export type Transaction = {
  id: number;
  user_id: string;
  day: number;
  type: TransactionType;
  amount: number;
  description: string;
};
