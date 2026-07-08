import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";
import { AdvanceDayButton } from "@/components/AdvanceDayButton";
import { BuyBusDialog } from "@/components/BuyBusDialog";
import { FleetPanel } from "@/components/FleetPanel";
import { NewRouteDialog } from "@/components/NewRouteDialog";
import { Onboarding } from "@/components/Onboarding";
import { RoutesPanel } from "@/components/RoutesPanel";
import type {
  Bus,
  BusModel,
  City,
  PlayerStats,
  Route,
  Transaction,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const euro = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

const TYPE_LABELS: Record<Transaction["type"], string> = {
  ticket_revenue: "Tickets",
  fuel: "Treibstoff",
  driver_salary: "Gehalt",
  maintenance: "Wartung",
  bus_purchase: "Buskauf",
  depot_fee: "Depot",
  starting_capital: "Startkapital",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statsData } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!statsData) return <Onboarding />;
  const stats = statsData as PlayerStats;

  const [
    { data: busesData },
    { data: routesData },
    { data: modelsData },
    { data: citiesData },
    { data: transactionsData },
  ] = await Promise.all([
    supabase.from("buses").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("routes").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("bus_models").select("*").order("price"),
    supabase.from("cities").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(30),
  ]);

  const buses = (busesData ?? []) as Bus[];
  const routes = (routesData ?? []) as Route[];
  const models = (modelsData ?? []) as BusModel[];
  const cities = (citiesData ?? []) as City[];
  const transactions = (transactionsData ?? []) as Transaction[];

  // Bilanz des letzten abgeschlossenen Tages
  const lastDay = stats.current_day - 1;
  const lastDayResult = transactions
    .filter((t) => t.day === lastDay && t.type !== "bus_purchase" && t.type !== "starting_capital")
    .reduce((sum, t) => sum + t.amount, 0);

  const kpis = [
    { label: "Kontostand", value: euro(stats.cash), highlight: stats.cash < 0 },
    {
      label: `Bilanz Tag ${lastDay >= 1 ? lastDay : "–"}`,
      value: lastDay >= 1 ? euro(lastDayResult) : "—",
      highlight: lastDay >= 1 && lastDayResult < 0,
    },
    { label: "Flotte", value: String(buses.length), highlight: false },
    { label: "Linien", value: String(routes.length), highlight: false },
  ];

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚌</span>
            <div>
              <h1 className="font-bold leading-tight">{stats.company_name}</h1>
              <p className="text-xs text-slate-400">Tag {stats.current_day}</p>
            </div>
          </div>
          <form action={signout}>
            <button className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white">
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* KPI-Leiste */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
            >
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p
                className={`mt-1 text-lg font-bold sm:text-xl ${
                  kpi.highlight ? "text-red-400" : "text-white"
                }`}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <AdvanceDayButton />

        {/* Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Liniennetz</h2>
              <NewRouteDialog cities={cities} />
            </div>
            <RoutesPanel routes={routes} buses={buses} cities={cities} />
          </section>

          <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Flotte</h2>
              <BuyBusDialog models={models} cash={stats.cash} />
            </div>
            <FleetPanel buses={buses} routes={routes} models={models} cities={cities} />
          </section>
        </div>

        {/* Buchungsjournal */}
        <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="mb-4 font-bold">Letzte Buchungen</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-400">Noch keine Buchungen.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-300">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      Tag {t.day} · {TYPE_LABELS[t.type]}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      t.amount >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {euro(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
