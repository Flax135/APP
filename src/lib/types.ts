export type BusModel = {
  id: string;
  name: string;
  price: number;
  seats: number;
  consumption: number; // l/100km
  speed_kmh: number;
  reliability: number;
  is_used: boolean;
  description: string;
};

export type City = {
  id: string;
  name: string;
  population: number;
  lat: number;
  lng: number;
};

export type PlayerStats = {
  user_id: string;
  company_name: string;
  cash: number;
  current_day: number;
  reputation: number;
};

export type Bus = {
  id: string;
  user_id: string;
  model_id: string;
  name: string;
  condition: number;
  purchased_on_day: number;
  assigned_route_id: string | null;
};

export type Route = {
  id: string;
  user_id: string;
  origin_city_id: string;
  dest_city_id: string;
  distance_km: number;
  ticket_price: number;
  active: boolean;
};

export type TransactionType =
  | "ticket_revenue"
  | "fuel"
  | "driver_salary"
  | "maintenance"
  | "bus_purchase"
  | "depot_fee"
  | "starting_capital";

export type Transaction = {
  id: number;
  user_id: string;
  day: number;
  type: TransactionType;
  amount: number;
  description: string;
};
