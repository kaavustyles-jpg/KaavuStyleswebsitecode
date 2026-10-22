"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Truck, X } from "lucide-react";
import type { Order } from "@/lib/mockData";

export default function ShiprocketOrderDialog({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: (shipping: NonNullable<Order["shiprocket"]>, status?: Order["status"]) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [locations, setLocations] = useState<{ name: string; address: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState(order.shiprocket);
  const [pickupLocation, setPickupLocation] = useState(order.shiprocket?.pickupLocation || "");
  const [deliveryState, setDeliveryState] = useState(order.shiprocket?.deliveryState || order.shippingAddress.split(",").at(-1)?.trim() || "");
  const [measurements, setMeasurements] = useState({ weight: order.shiprocket?.weight?.toString() || "", length: order.shiprocket?.length?.toString() || "", width: order.shiprocket?.width?.toString() || "", height: order.shiprocket?.height?.toString() || "" });
  const needsReplacement = !!shipping && ["Cancelled", "Mismatch", "Failed"].includes(shipping.status);
  const showSummary = !!shipping && !needsReplacement;
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const controller = new AbortController();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    {
      fetch("/api/admin/shiprocket/pickups", { signal: controller.signal }).then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setLocations(result.locations);
        if (result.locations.length === 1) setPickupLocation(result.locations[0].name);
      }).catch(error => { if (!controller.signal.aborted) setError(error.message || "Could not load pickup locations."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }
    return () => { controller.abort(); element?.close(); document.body.style.overflow = previous; };
  }, [order.id, order.shiprocket]);
  const inputClass = "w-full rounded-lg border border-ivory-300 bg-white px-3 py-3 text-base text-ink focus:border-gold outline-none";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shiprocket`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pickupLocation, deliveryState, ...Object.fromEntries(Object.entries(measurements).map(([key, value]) => [key, Number(value)])) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create shipment.");
      setShipping(result.shipping); onSaved(result.shipping, result.orderStatus);
    } catch (error) { setError(error instanceof Error ? error.message : "Shipment request failed."); }
    finally { setBusy(false); }
  }
  async function refresh() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shiprocket`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not refresh shipment.");
      setShipping(result.shipping); onSaved(result.shipping, result.orderStatus);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not refresh shipment."); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} aria-labelledby="shipping-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="banner-editor-dialog w-[calc(100%-1rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl border-0 p-0 bg-ivory shadow-2xl">
    <div className="flex items-center justify-between gap-4 bg-ink text-ivory p-5 sticky top-0 z-10">
      <div><h2 id="shipping-title" className="font-serif text-2xl flex items-center gap-2"><Truck className="w-5 h-5 text-gold" />Shiprocket shipment</h2><p className="text-xs text-gold mt-1">{order.orderNumber} · {order.customerName}</p></div>
      <button type="button" aria-label="Close shipment form" disabled={busy} onClick={onClose} className="p-2 rounded-full bg-white/10"><X className="w-5 h-5" /></button>
    </div>
    <div className="px-5 pt-4 space-y-3"><button type="button" disabled={busy} onClick={refresh} className="w-full rounded-lg border border-gold px-4 py-3 text-sm disabled:opacity-50">{busy ? "Checking Shiprocket…" : "Refresh Shiprocket status"}</button>{error && <p role="alert" className="text-sm text-crimson">{error}{error.includes("sign in") && <Link href="/admin/login" className="block underline">Sign in to admin</Link>}</p>}</div>
    {showSummary && shipping ? <div className="p-5 space-y-4">
      <p className="font-medium text-ink">{shipping.status === "NeedsReview" ? "Shipment needs review" : shipping.orderId ? "Order linked to Shiprocket" : "Shipment request is awaiting confirmation"}</p>
      {shipping.remoteStatus && <p className="text-sm">Shiprocket status: <strong>{shipping.remoteStatus}</strong></p>}
      {shipping.reference && <p className="text-xs break-all">Shipping reference: {shipping.reference}</p>}
      {shipping.error && <p className="text-sm text-crimson">{shipping.error}</p>}
      {shipping.orderId && <p className="text-sm">Shiprocket order: <strong>{shipping.orderId}</strong><br />Shipment: <strong>{shipping.shipmentId}</strong></p>}
      <p className="text-sm text-ink-muted">{shipping.weight} kg · {shipping.length} × {shipping.width} × {shipping.height} cm<br />Pickup: {shipping.pickupLocation}</p>
      <p className="text-sm text-ink-muted">{shipping.orderId ? "Choose a courier, generate your shipping label and schedule pickup in Shiprocket. Creating this order does not mark it as shipped." : "Check Shiprocket for this order number before retrying. This prevents duplicate shipments."}</p>
      <a href="https://app.shiprocket.in/seller/orders" target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-crimson text-ivory px-5 py-3 text-sm">Open Shiprocket</a>
    </div> : <form onSubmit={submit} className="p-5 space-y-5">
      {needsReplacement && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>{shipping?.status === "Cancelled" ? "Cancelled shipment" : "Previous shipment cannot be used"}</strong><p className="mt-1">{shipping?.error}</p><p className="mt-2">Confirm the parcel details below to create a replacement. The website order number and payment stay unchanged.</p></div>}
      <div className="bg-white rounded-xl border border-ivory-300 p-4 text-sm"><p className="font-medium">Delivery address</p><p className="text-ink-muted mt-1">{order.shippingAddress} · {order.postalCode}</p></div>
      <label className="block text-sm font-medium">Delivery state<input required value={deliveryState} onChange={event => setDeliveryState(event.target.value)} className={`${inputClass} mt-2`} placeholder="Customer's state, e.g. Karnataka" /></label>
      <label className="block text-sm font-medium">Pickup location<select required disabled={loading || busy} value={pickupLocation} onChange={event => setPickupLocation(event.target.value)} className={`${inputClass} mt-2`}><option value="">{loading ? "Loading registered pickups…" : "Select your pickup location"}</option>{locations.map(location => <option key={location.name} value={location.name}>{location.name}</option>)}</select></label>
      {locations.find(location => location.name === pickupLocation) && <p className="text-xs text-ink-muted">{locations.find(location => location.name === pickupLocation)?.address}</p>}
      {!loading && !locations.length && !error && <p className="text-sm text-ink-muted">Add your pickup address in Shiprocket Settings first, then reopen this form.</p>}
      <fieldset><legend className="font-serif text-xl mb-3">Packed parcel measurements</legend><div className="grid grid-cols-2 gap-4">{([['weight', 'Weight (kg)'], ['length', 'Length (cm)'], ['width', 'Width (cm)'], ['height', 'Height (cm)']] as const).map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input type="number" inputMode="decimal" required min="0.01" max="1000" step="0.01" value={measurements[key]} onChange={event => setMeasurements(previous => ({ ...previous, [key]: event.target.value }))} className={`${inputClass} mt-2`} placeholder="Enter value" /></label>)}</div><p className="text-xs text-ink-muted mt-3">Measure the sealed parcel, including its packaging.</p></fieldset>
      {error && <div role="alert" className="rounded-lg bg-crimson/5 p-3 text-sm text-crimson">{error}{error.includes("sign in") && <Link href="/admin/login" className="block underline mt-2">Sign in to admin</Link>}</div>}
      <button disabled={loading || busy || !locations.length || order.paymentStatus !== "Paid"} className="w-full rounded-lg bg-crimson text-ivory p-3 font-medium disabled:opacity-50">{busy ? "Creating shipment…" : needsReplacement ? "Create replacement shipment" : "Create Shiprocket order"}</button>
      {order.paymentStatus !== "Paid" && <p className="text-xs text-crimson">Payment must be confirmed before creating a shipment.</p>}
    </form>}
  </dialog>;
}
