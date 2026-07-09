import { EVENT_INFO } from "@/lib/game/meta";
import type { GameEvent } from "@/lib/types";

/** Banner für heute aktive Zufallsereignisse */
export function EventBanner({
  events,
  currentDay,
}: {
  events: GameEvent[];
  currentDay: number;
}) {
  const active = events.filter(
    (e) => e.day_start <= currentDay && currentDay <= e.day_end
  );
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((event) => {
        const info = EVENT_INFO[event.type];
        const remaining = event.day_end - currentDay + 1;
        const tone =
          event.type === "holiday"
            ? "bg-emerald-950 text-emerald-300 ring-emerald-900"
            : "bg-amber-950 text-amber-300 ring-amber-900";
        return (
          <div
            key={event.id}
            className={`flex items-center justify-between gap-3 rounded-xl p-3 text-sm ring-1 ${tone}`}
          >
            <p>
              <span className="mr-1.5">{info.icon}</span>
              <span className="font-semibold">{info.name}:</span>{" "}
              {info.describe(Number(event.magnitude))}
            </p>
            <span className="shrink-0 text-xs opacity-75">
              noch {remaining} Tag{remaining > 1 ? "e" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
