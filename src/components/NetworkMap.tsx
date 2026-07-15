"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { REGION_BORDERS } from "@/lib/game/borders";
import { referencePrice, routeDistanceKm } from "@/lib/game/economy";
import { REGIONS } from "@/lib/game/meta";
import type { Bus, City, RegionId, Route } from "@/lib/types";
import { useGameActions } from "./GameActionsContext";
import { RoutePriceForm } from "./RoutePriceForm";
import { ActionForm } from "./ui";

// Ausschnitt DACH; einfache Plattkarte (Länge × cos(50°), Breite linear)
const MIN_LAT = 45.6;
const MAX_LAT = 55.0;
const MIN_LNG = 5.6;
const MAX_LNG = 17.2;
const KX = Math.cos((50.3 * Math.PI) / 180) * 100; // px pro Grad Länge
const KY = 100; // px pro Grad Breite
const W = (MAX_LNG - MIN_LNG) * KX;
const H = (MAX_LAT - MIN_LAT) * KY;

const MAX_ZOOM = 8; // kleinster Ausschnitt = W / MAX_ZOOM

type ViewBox = { x: number; y: number; w: number; h: number };
const FULL_VIEW: ViewBox = { x: 0, y: 0, w: W, h: H };

const clampNum = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const project = (lat: number, lng: number) => ({
  x: (lng - MIN_LNG) * KX,
  y: (MAX_LAT - lat) * KY,
});

const px = (city: City) => project(city.lat, city.lng);

/** Punktgröße nach Einwohnerzahl (in Basis-Einheiten, wird mit Zoom skaliert) */
const dotRadius = (population: number) => 3.5 + Math.sqrt(population) / 400;

/** Zoom um einen festen Punkt in Kartenkoordinaten */
function zoomView(v: ViewBox, cx: number, cy: number, factor: number): ViewBox {
  const w = clampNum(v.w / factor, W / MAX_ZOOM, W);
  const h = w * (H / W);
  const x = clampNum(cx - (cx - v.x) * (w / v.w), 0, W - w);
  const y = clampNum(cy - (cy - v.y) * (h / v.h), 0, H - h);
  return { x, y, w, h };
}

const borderPath = (points: [number, number][]) =>
  points
    .map(([lat, lng], i) => {
      const { x, y } = project(lat, lng);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

export function NetworkMap({
  cities,
  routes,
  buses,
  unlockedRegions,
}: {
  cities: City[];
  routes: Route[];
  buses: Bus[];
  unlockedRegions: RegionId[];
}) {
  const { createRoute } = useGameActions();
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [view, setView] = useState<ViewBox>(FULL_VIEW);

  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; view: ViewBox; cx: number; cy: number } | null>(null);
  const dragged = useRef(false);

  const citiesById = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities]);
  const busCountByRoute = useMemo(() => {
    const map = new Map<string, number>();
    for (const bus of buses) {
      if (bus.assigned_route_id) {
        map.set(bus.assigned_route_id, (map.get(bus.assigned_route_id) ?? 0) + 1);
      }
    }
    return map;
  }, [buses]);

  // Alles, was auf dem Bildschirm gleich groß bleiben soll, skaliert mit dem Zoom
  const scale = view.w / W;
  const zoomedIn = view.w < W - 1;
  const labelMinPopulation = scale < 0.45 ? 100_000 : 600_000;

  const clientToMap = (clientX: number, clientY: number, v: ViewBox) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: v.x + ((clientX - rect.left) / rect.width) * v.w,
      y: v.y + ((clientY - rect.top) / rect.height) * v.h,
    };
  };

  // Mausrad-Zoom braucht einen nativen Listener (preventDefault gegen Seiten-Scroll)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.25 : 1 / 1.25;
      setView((v) => {
        const point = clientToMap(e.clientX, e.clientY, v);
        return zoomView(v, point.x, point.y, factor);
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // WICHTIG: hier noch kein setPointerCapture – das würde das click-Event
    // aufs SVG umleiten und Stadt-/Linien-Klicks schlucken. Capture erst,
    // sobald wirklich gezogen wird (siehe onPointerMove).
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const mid = clientToMap((a.x + b.x) / 2, (a.y + b.y) / 2, view);
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        view,
        cx: mid.x,
        cy: mid.y,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const current = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, current);

    // Pan/Pinch im Gang: Pointer einfangen, damit die Geste auch außerhalb
    // des SVG weiterläuft (Klicks sind ab hier ohnehin unterdrückt)
    if (dragged.current && !e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (Math.abs(dist - pinchStart.current.dist) > 4) dragged.current = true;
      const factor = dist / pinchStart.current.dist;
      const { view: startView, cx, cy } = pinchStart.current;
      setView(zoomView(startView, cx, cy, factor));
      return;
    }

    if (pointers.current.size === 1) {
      const dxClient = current.x - prev.x;
      const dyClient = current.y - prev.y;
      if (Math.hypot(dxClient, dyClient) > 2) dragged.current = true;
      const rect = svgRef.current!.getBoundingClientRect();
      setView((v) => ({
        ...v,
        x: clampNum(v.x - (dxClient / rect.width) * v.w, 0, W - v.w),
        y: clampNum(v.y - (dyClient / rect.height) * v.h, 0, H - v.h),
      }));
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const zoomButtons = (factor: number) =>
    setView((v) => zoomView(v, v.x + v.w / 2, v.y + v.h / 2, factor));

  const handleCityClick = (city: City) => {
    if (dragged.current) return;
    setHint(null);
    setSelectedRouteId(null);
    if (!unlockedRegions.includes(city.region)) {
      setHint(
        `${city.name} liegt in ${REGIONS[city.region].name} – Region zuerst im Expansions-Panel freischalten.`
      );
      return;
    }
    let next: string[];
    if (selected.includes(city.id)) next = selected.filter((id) => id !== city.id);
    else if (selected.length >= 2) next = [city.id];
    else next = [...selected, city.id];

    // Existiert die Verbindung schon? Dann direkt den Preis-Editor öffnen.
    if (next.length === 2) {
      const existing = routes.find(
        (r) =>
          (r.origin_city_id === next[0] && r.dest_city_id === next[1]) ||
          (r.origin_city_id === next[1] && r.dest_city_id === next[0])
      );
      if (existing) {
        setSelectedRouteId(existing.id);
        setSelected([]);
        return;
      }
    }
    setSelected(next);
  };

  const handleRouteClick = (routeId: string) => {
    if (dragged.current) return;
    setHint(null);
    setSelected([]);
    setSelectedRouteId((prev) => (prev === routeId ? null : routeId));
  };

  const selectedCities = selected
    .map((id) => citiesById.get(id))
    .filter((c): c is City => Boolean(c));

  const pair = selectedCities.length === 2 ? selectedCities : null;
  const pairInfo = useMemo(() => {
    if (!pair) return null;
    const distance = routeDistanceKm(pair[0], pair[1]);
    return {
      distance,
      suggested: Math.round(referencePrice(distance) * 100) / 100,
    };
  }, [pair]);

  const selectedRoute = selectedRouteId
    ? routes.find((r) => r.id === selectedRouteId)
    : null;
  const selectedRouteCities = selectedRoute
    ? {
        origin: citiesById.get(selectedRoute.origin_city_id),
        dest: citiesById.get(selectedRoute.dest_city_id),
      }
    : null;

  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/90 text-base font-bold text-white ring-1 ring-slate-700 transition hover:bg-slate-700";

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="h-auto w-full cursor-grab select-none rounded-xl bg-slate-950 ring-1 ring-slate-800 active:cursor-grabbing"
          style={{ touchAction: zoomedIn ? "none" : "pan-y" }}
          role="img"
          aria-label="Liniennetz-Karte"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Landesumrisse (vereinfacht) */}
          {(Object.keys(REGION_BORDERS) as RegionId[]).map((regionId) => {
            const unlocked = unlockedRegions.includes(regionId);
            return (
              <path
                key={regionId}
                d={borderPath(REGION_BORDERS[regionId])}
                fill={unlocked ? "#1e293b" : "#0f172a"}
                fillOpacity={unlocked ? 0.5 : 0.35}
                stroke="#334155"
                strokeWidth={1.2 * scale}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Bestehende Linien */}
          {routes.map((route) => {
            const a = citiesById.get(route.origin_city_id);
            const b = citiesById.get(route.dest_city_id);
            if (!a || !b) return null;
            const pa = px(a);
            const pb = px(b);
            const busCount = busCountByRoute.get(route.id) ?? 0;
            const isSelected = route.id === selectedRouteId;
            const width =
              (busCount > 0 ? 2 + Math.min(3, busCount) : 2) * scale;
            return (
              <g
                key={route.id}
                onClick={() => handleRouteClick(route.id)}
                className="cursor-pointer"
              >
                {/* Unsichtbare breite Klickfläche */}
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke="transparent"
                  strokeWidth={14 * scale}
                />
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={isSelected ? "#22d3ee" : busCount > 0 ? "#f59e0b" : "#64748b"}
                  strokeWidth={isSelected ? width + 1.5 * scale : width}
                  strokeDasharray={busCount > 0 ? undefined : `${6 * scale} ${5 * scale}`}
                  strokeLinecap="round"
                  opacity={0.9}
                />
                <title>
                  {a.name} – {b.name}: {route.distance_km} km,{" "}
                  {busCount > 0 ? `${busCount} Bus(se)` : "kein Bus zugewiesen"} –
                  antippen zum Preis-Editieren
                </title>
              </g>
            );
          })}

          {/* Vorschau der ausgewählten Verbindung */}
          {pair && (
            <line
              x1={px(pair[0]).x}
              y1={px(pair[0]).y}
              x2={px(pair[1]).x}
              y2={px(pair[1]).y}
              stroke="#22d3ee"
              strokeWidth={2.5 * scale}
              strokeDasharray={`${4 * scale} ${5 * scale}`}
              strokeLinecap="round"
            />
          )}

          {/* Städte */}
          {cities.map((city) => {
            const { x, y } = px(city);
            const unlocked = unlockedRegions.includes(city.region);
            const isSelected = selected.includes(city.id);
            const r = dotRadius(city.population) * scale;
            const fontSize = 13 * scale;
            return (
              <g
                key={city.id}
                onClick={() => handleCityClick(city)}
                className="cursor-pointer"
              >
                <circle cx={x} cy={y} r={r + 6 * scale} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? r + 2 * scale : r}
                  fill={isSelected ? "#fbbf24" : unlocked ? "#e2e8f0" : "#475569"}
                  stroke={isSelected ? "#f59e0b" : "#0f172a"}
                  strokeWidth={1.5 * scale}
                  opacity={unlocked ? 1 : 0.55}
                />
                <title>
                  {city.name} · {(city.population / 1000).toFixed(0)}k EW ·{" "}
                  {REGIONS[city.region].name}
                  {unlocked ? "" : " (gesperrt)"}
                </title>
                {(city.population >= labelMinPopulation || isSelected) && (
                  <text
                    x={x}
                    y={y - r - 5 * scale}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={isSelected ? 700 : 500}
                    fill={isSelected ? "#fbbf24" : "#94a3b8"}
                  >
                    {city.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Zoom-Steuerung */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button onClick={() => zoomButtons(1.5)} className={buttonClass} aria-label="Hineinzoomen">
            +
          </button>
          <button onClick={() => zoomButtons(1 / 1.5)} className={buttonClass} aria-label="Herauszoomen">
            −
          </button>
          {zoomedIn && (
            <button
              onClick={() => setView(FULL_VIEW)}
              className={buttonClass}
              aria-label="Ansicht zurücksetzen"
            >
              ⟲
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Zwei Städte antippen → neue Linie · Linie antippen → Preise ändern ·
        Scrollen/Kneifen zoomt, Ziehen verschiebt.
      </p>

      {hint && (
        <p className="mt-2 rounded-lg bg-amber-950 p-2 text-sm text-amber-300 ring-1 ring-amber-900">
          {hint}
        </p>
      )}

      {selectedCities.length === 1 && (
        <p className="mt-2 text-sm text-slate-400">
          <span className="font-semibold text-white">{selectedCities[0].name}</span>{" "}
          ausgewählt – jetzt die Zielstadt antippen.
        </p>
      )}

      {/* Preis-Editor für angeklickte Linie */}
      {selectedRoute && selectedRouteCities?.origin && selectedRouteCities?.dest && (
        <div className="mt-3 rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-white">
              {selectedRouteCities.origin.name} – {selectedRouteCities.dest.name}{" "}
              <span className="text-sm font-normal text-slate-400">
                {selectedRoute.distance_km} km ·{" "}
                {busCountByRoute.get(selectedRoute.id) ?? 0} Bus(se)
              </span>
            </p>
            <button
              onClick={() => setSelectedRouteId(null)}
              aria-label="Schließen"
              className="rounded-lg px-2 py-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mt-3">
            <RoutePriceForm route={selectedRoute} />
          </div>
        </div>
      )}

      {/* Formular für neue Linie */}
      {pair && pairInfo && (
        <div className="mt-3 rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700">
          <p className="font-semibold text-white">
            {pair[0].name} – {pair[1].name}{" "}
            <span className="text-sm font-normal text-slate-400">
              {pairInfo.distance} km
            </span>
          </p>
          <ActionForm
            action={createRoute}
            onSuccess={() => setSelected([])}
            className="mt-3"
          >
            {(pending) => (
              <div className="flex items-end gap-2">
                <input type="hidden" name="origin_city_id" value={pair[0].id} />
                <input type="hidden" name="dest_city_id" value={pair[1].id} />
                <label className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-xs text-slate-400">
                    Economy-Preis (Markt {pairInfo.suggested.toFixed(2)} €)
                  </span>
                  <input
                    name="ticket_price"
                    type="number"
                    step="0.01"
                    min="1"
                    max="500"
                    required
                    defaultValue={pairInfo.suggested}
                    className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-sm text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="shrink-0 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {pending ? "…" : "Linie eröffnen"}
                </button>
              </div>
            )}
          </ActionForm>
        </div>
      )}
    </div>
  );
}
