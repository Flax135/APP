type Achievement = {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
};

/** Erfolge werden aus dem aktuellen Spielstand berechnet (keine Persistenz nötig) */
export function AchievementsPanel({
  fleetSize,
  routeCount,
  reputation,
  regionCount,
  cash,
  lastDayResult,
}: {
  fleetSize: number;
  routeCount: number;
  reputation: number;
  regionCount: number;
  cash: number;
  lastDayResult: number | null;
}) {
  const achievements: Achievement[] = [
    {
      icon: "📈",
      name: "Schwarze Zahlen",
      description: "Einen Tag mit Gewinn abschließen",
      unlocked: lastDayResult !== null && lastDayResult > 0,
    },
    {
      icon: "🚌",
      name: "Fuhrpark-Chef",
      description: "5 Busse besitzen",
      unlocked: fleetSize >= 5,
    },
    {
      icon: "🗺️",
      name: "Netzwerker",
      description: "5 Linien betreiben",
      unlocked: routeCount >= 5,
    },
    {
      icon: "⭐",
      name: "Servicewunder",
      description: "Reputation 4,5 ★ erreichen",
      unlocked: reputation >= 4.5,
    },
    {
      icon: "🌍",
      name: "Grenzgänger",
      description: "Eine zweite Region freischalten",
      unlocked: regionCount >= 2,
    },
    {
      icon: "💰",
      name: "Millionär",
      description: "1 Mio. € Kontostand",
      unlocked: cash >= 1_000_000,
    },
  ];

  return (
    <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <h2 className="mb-4 font-bold">Erfolge</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {achievements.map((a) => (
          <li
            key={a.name}
            className={`rounded-xl p-3 ring-1 ${
              a.unlocked
                ? "bg-slate-800 ring-amber-500/40"
                : "bg-slate-900 opacity-50 ring-slate-800"
            }`}
            title={a.description}
          >
            <p className="text-lg">{a.unlocked ? a.icon : "🔒"}</p>
            <p className="mt-1 text-xs font-semibold text-white">{a.name}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{a.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
