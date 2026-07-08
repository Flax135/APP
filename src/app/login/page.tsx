import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-xl ring-1 ring-slate-800">
        <div className="mb-6 text-center">
          <div className="text-4xl">🚌</div>
          <h1 className="mt-2 text-2xl font-bold text-white">BusTycoon</h1>
          <p className="mt-1 text-sm text-slate-400">
            Baue dein Busimperium auf.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-950 p-3 text-sm text-red-300 ring-1 ring-red-900">
            {error}
          </p>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full rounded-lg bg-slate-800 px-3 py-2 text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              formAction={login}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Einloggen
            </button>
            <button
              formAction={signup}
              className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white ring-1 ring-slate-700 transition hover:bg-slate-700"
            >
              Registrieren
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
