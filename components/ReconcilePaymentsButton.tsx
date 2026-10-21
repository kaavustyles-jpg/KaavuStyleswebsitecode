"use client";
import { useState } from "react";
export default function ReconcilePaymentsButton({ onRecovered }: { onRecovered: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <div className="print:hidden space-y-2">
    <button type="button" disabled={busy} onClick={async () => {
      if (busy) return;
      setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/payments/reconcile", { method: "POST" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Payment check failed.");
        setMessage(`${result.checked} attempts checked. ${result.recovered} orders confirmed. ${result.waiting} awaiting payment. ${result.failed} need review.${result.deferred ? " More attempts will be checked on the next run." : ""}`);
        if (result.recovered) onRecovered();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not check payments."); }
      finally { setBusy(false); }
    }} className="rounded-lg border border-gold bg-white px-4 py-3 text-xs font-semibold text-ink disabled:opacity-50">{busy ? "Checking captured payments…" : "Check pending payments"}</button>
    {message && <p role="status" className="text-sm text-ink-muted">{message}</p>}
  </div>;
}
