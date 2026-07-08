"use client";

import { useState, useTransition, type ReactNode } from "react";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Formular-Wrapper für Server Actions mit Fehleranzeige und Pending-State.
 * Kinder als Render-Prop, damit Buttons den Pending-Zustand kennen.
 */
export function ActionForm({
  action,
  onSuccess,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  onSuccess?: () => void;
  className?: string;
  children: (pending: boolean) => ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await action(formData);
          if (!result.ok) setError(result.error);
          else onSuccess?.();
        });
      }}
    >
      {children(pending)}
      {error && (
        <p className="mt-2 rounded-lg bg-red-950 p-2 text-sm text-red-300 ring-1 ring-red-900">
          {error}
        </p>
      )}
    </form>
  );
}

/** Einfaches Modal */
export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-slate-900 p-5 ring-1 ring-slate-700 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
