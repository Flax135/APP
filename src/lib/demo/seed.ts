import type { BusModel, City, Upgrade } from "@/lib/types";

/**
 * Statische Spieldaten für den Demo-Modus – identisch mit den Seeds der
 * Supabase-Migrationen (0001–0004).
 */

export const SEED_BUS_MODELS: BusModel[] = [
  { id: "used-setra-315", name: "Setra S 315 (gebraucht)", price: 42000, seats: 49, consumption: 34.0, speed_kmh: 90, reliability: 68, is_used: true, powertrain: "diesel", range_km: null, required_level: 1, description: "Solider Veteran. Günstig in der Anschaffung, durstig und störanfällig." },
  { id: "sprinter-mini", name: "Mercedes Sprinter Minibus", price: 78000, seats: 19, consumption: 14.5, speed_kmh: 95, reliability: 88, is_used: false, powertrain: "diesel", range_km: null, required_level: 1, description: "Wendiger Minibus für dünne Strecken. Niedriger Verbrauch, wenig Plätze." },
  { id: "man-intercity", name: "MAN Lion's Intercity", price: 195000, seats: 35, consumption: 22.0, speed_kmh: 92, reliability: 90, is_used: false, powertrain: "diesel", range_km: null, required_level: 2, description: "Zuverlässiger Überlandbus. Guter Kompromiss aus Kosten und Kapazität." },
  { id: "setra-516", name: "Setra S 516 HD", price: 335000, seats: 53, consumption: 26.5, speed_kmh: 98, reliability: 94, is_used: false, powertrain: "diesel", range_km: null, required_level: 3, description: "Moderner Reisebus. Effizient auf langen Strecken, hoher Komfortstandard." },
  { id: "ebus-yutong", name: "Yutong ICe12 (Elektro)", price: 365000, seats: 48, consumption: 98.0, speed_kmh: 92, reliability: 89, is_used: false, powertrain: "electric", range_km: 320, required_level: 4, description: "Bezahlbarer E-Bus für Regionalstrecken. Günstig im Betrieb, begrenzte Reichweite." },
  { id: "setra-531-dt", name: "Setra S 531 DT Doppeldecker", price: 495000, seats: 83, consumption: 31.0, speed_kmh: 96, reliability: 92, is_used: false, powertrain: "diesel", range_km: null, required_level: 5, description: "Das Flaggschiff. Maximale Kapazität für nachfragestarke Korridore." },
  { id: "ebus-eintouro", name: "Mercedes eIntouro", price: 430000, seats: 50, consumption: 105.0, speed_kmh: 95, reliability: 94, is_used: false, powertrain: "electric", range_km: 400, required_level: 6, description: "Elektrischer Überlandbus der Spitzenklasse. Niedrige Energiekosten, starkes Image." },
];

export const SEED_UPGRADES: Upgrade[] = [
  { id: "wifi", name: "WLAN an Bord", price: 1500, upkeep_per_day: 3, comfort_bonus: 1, description: "Kostenloses WLAN für Fahrgäste." },
  { id: "usb", name: "Steckdosen & USB", price: 2800, upkeep_per_day: 2, comfort_bonus: 1, description: "Lademöglichkeit an jedem Sitz." },
  { id: "klima", name: "Klimaanlage", price: 9500, upkeep_per_day: 6, comfort_bonus: 2, description: "Angenehmes Klima zu jeder Jahreszeit." },
  { id: "leder", name: "Ledersitze", price: 14000, upkeep_per_day: 4, comfort_bonus: 2, description: "Hochwertige Bestuhlung mit mehr Beinfreiheit." },
  { id: "panorama", name: "Panorama-Fenster", price: 16000, upkeep_per_day: 3, comfort_bonus: 2, description: "Großzügige Verglasung für Aussicht unterwegs." },
  { id: "wc", name: "Bordtoilette", price: 19000, upkeep_per_day: 8, comfort_bonus: 2, description: "Unverzichtbar auf langen Strecken." },
];

const c = (
  id: string,
  name: string,
  population: number,
  lat: number,
  lng: number,
  region: City["region"]
): City => ({ id, name, population, lat, lng, region });

export const SEED_CITIES: City[] = [
  // Deutschland (Migration 0001 + 0004)
  c("berlin", "Berlin", 3700000, 52.52, 13.405, "de"),
  c("hamburg", "Hamburg", 1900000, 53.5511, 9.9937, "de"),
  c("muenchen", "München", 1500000, 48.1351, 11.582, "de"),
  c("koeln", "Köln", 1100000, 50.9375, 6.9603, "de"),
  c("frankfurt", "Frankfurt", 760000, 50.1109, 8.6821, "de"),
  c("stuttgart", "Stuttgart", 630000, 48.7758, 9.1829, "de"),
  c("duesseldorf", "Düsseldorf", 620000, 51.2277, 6.7735, "de"),
  c("leipzig", "Leipzig", 600000, 51.3397, 12.3731, "de"),
  c("dresden", "Dresden", 560000, 51.0504, 13.7373, "de"),
  c("hannover", "Hannover", 540000, 52.3759, 9.732, "de"),
  c("nuernberg", "Nürnberg", 520000, 49.4521, 11.0767, "de"),
  c("bremen", "Bremen", 570000, 53.0793, 8.8017, "de"),
  c("dortmund", "Dortmund", 590000, 51.5136, 7.4653, "de"),
  c("essen", "Essen", 580000, 51.4556, 7.0116, "de"),
  c("duisburg", "Duisburg", 500000, 51.4344, 6.7623, "de"),
  c("bochum", "Bochum", 365000, 51.4818, 7.2162, "de"),
  c("wuppertal", "Wuppertal", 355000, 51.2562, 7.1508, "de"),
  c("bielefeld", "Bielefeld", 335000, 52.0302, 8.5325, "de"),
  c("bonn", "Bonn", 330000, 50.7374, 7.0982, "de"),
  c("muenster", "Münster", 320000, 51.9607, 7.6261, "de"),
  c("mannheim", "Mannheim", 310000, 49.4875, 8.466, "de"),
  c("karlsruhe", "Karlsruhe", 310000, 49.0069, 8.4037, "de"),
  c("augsburg", "Augsburg", 300000, 48.3705, 10.8978, "de"),
  c("aachen", "Aachen", 250000, 50.7753, 6.0839, "de"),
  c("braunschweig", "Braunschweig", 250000, 52.2689, 10.5268, "de"),
  c("kiel", "Kiel", 246000, 54.3233, 10.1228, "de"),
  c("chemnitz", "Chemnitz", 245000, 50.8278, 12.9214, "de"),
  c("halle", "Halle (Saale)", 240000, 51.497, 11.9688, "de"),
  c("magdeburg", "Magdeburg", 240000, 52.1205, 11.6276, "de"),
  c("freiburg", "Freiburg", 230000, 47.999, 7.8421, "de"),
  c("mainz", "Mainz", 220000, 49.9929, 8.2473, "de"),
  c("luebeck", "Lübeck", 216000, 53.8655, 10.6866, "de"),
  c("erfurt", "Erfurt", 214000, 50.9848, 11.0299, "de"),
  c("rostock", "Rostock", 210000, 54.0924, 12.0991, "de"),
  c("kassel", "Kassel", 200000, 51.3127, 9.4797, "de"),
  c("potsdam", "Potsdam", 185000, 52.3906, 13.0645, "de"),
  c("saarbruecken", "Saarbrücken", 180000, 49.2402, 6.9969, "de"),
  c("oldenburg", "Oldenburg", 170000, 53.1435, 8.2146, "de"),
  c("osnabrueck", "Osnabrück", 165000, 52.2799, 8.0472, "de"),
  c("heidelberg", "Heidelberg", 160000, 49.3988, 8.6724, "de"),
  c("regensburg", "Regensburg", 155000, 49.0134, 12.1016, "de"),
  c("ingolstadt", "Ingolstadt", 140000, 48.7665, 11.4258, "de"),
  c("wuerzburg", "Würzburg", 128000, 49.7913, 9.9534, "de"),
  c("ulm", "Ulm", 126000, 48.4011, 9.9876, "de"),
  c("goettingen", "Göttingen", 118000, 51.5413, 9.9158, "de"),
  c("koblenz", "Koblenz", 115000, 50.3569, 7.589, "de"),
  c("trier", "Trier", 111000, 49.7596, 6.6441, "de"),
  c("jena", "Jena", 111000, 50.9271, 11.5892, "de"),
  c("cottbus", "Cottbus", 100000, 51.7563, 14.3329, "de"),
  // Österreich (0003 + 0004)
  c("wien", "Wien", 1930000, 48.2082, 16.3738, "at"),
  c("graz", "Graz", 295000, 47.0707, 15.4395, "at"),
  c("linz", "Linz", 210000, 48.3069, 14.2858, "at"),
  c("salzburg", "Salzburg", 155000, 47.8095, 13.055, "at"),
  c("innsbruck", "Innsbruck", 132000, 47.2692, 11.4041, "at"),
  c("klagenfurt", "Klagenfurt", 105000, 46.6249, 14.3053, "at"),
  // Schweiz (0003 + 0004)
  c("zuerich", "Zürich", 423000, 47.3769, 8.5417, "ch"),
  c("genf", "Genf", 204000, 46.2044, 6.1432, "ch"),
  c("basel", "Basel", 178000, 47.5596, 7.5886, "ch"),
  c("bern", "Bern", 135000, 46.948, 7.4474, "ch"),
  c("lausanne", "Lausanne", 140000, 46.5197, 6.6323, "ch"),
  c("winterthur", "Winterthur", 115000, 47.5008, 8.7241, "ch"),
  c("luzern", "Luzern", 82000, 47.0502, 8.3093, "ch"),
  c("stgallen", "St. Gallen", 76000, 47.4245, 9.3767, "ch"),
  c("lugano", "Lugano", 62000, 46.0037, 8.9511, "ch"),
];
