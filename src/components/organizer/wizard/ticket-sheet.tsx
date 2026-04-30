"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import type { TicketType } from "@/types/domain";

type TicketKind = "paid" | "free" | "donation";

function localValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDatetimeLocalValue(d);
}

function toIso(v: string) {
  if (!v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function TicketSheet({
  open,
  kind,
  eventId,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  kind: TicketKind;
  eventId: string;
  initial?: TicketType | null;
  onClose: () => void;
  onSave: (ticket: TicketType) => void;
}) {
  const [name, setName] = useState(() => initial?.name ?? "General Admission");
  const [quantity, setQuantity] = useState(() => String(initial?.inventoryTotal ?? 50));
  const [price, setPrice] = useState(() => String(initial?.price ?? (kind === "free" ? 0 : 25)));
  const [saleStart, setSaleStart] = useState(() => localValue(initial?.saleStart ?? null));
  const [saleEnd, setSaleEnd] = useState(() => localValue(initial?.saleEnd ?? null));
  const [description, setDescription] = useState(() => initial?.description ?? "");
  const [visible, setVisible] = useState(() => (initial ? initial.status !== "hidden" : true));
  const [minQty, setMinQty] = useState(() => String(initial?.minPerOrder ?? 1));
  const [maxQty, setMaxQty] = useState(() => String(initial?.maxPerOrder ?? 6));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaleMeta, setShowSaleMeta] = useState(true);
  const [eTicket, setETicket] = useState(true);
  const [willCall, setWillCall] = useState(false);

  const numericPrice = useMemo(() => {
    if (kind === "free") return 0;
    if (kind === "donation") return 0;
    const parsed = Number(price);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }, [kind, price]);

  const save = () => {
    const inventoryTotal = Math.max(0, Number(quantity) || 0);
    const ticket: TicketType = {
      id: initial?.id ?? `tt-${eventId}-${crypto.randomUUID().slice(0, 8)}`,
      eventId,
      name: name.trim() || "General Admission",
      description: description.trim(),
      price: numericPrice,
      currency: initial?.currency ?? "USD",
      inventoryTotal,
      inventoryRemaining: initial?.inventoryRemaining ?? inventoryTotal,
      minPerOrder: Math.max(1, Number(minQty) || 1),
      maxPerOrder: Math.max(1, Number(maxQty) || 1),
      saleStart: toIso(saleStart),
      saleEnd: toIso(saleEnd),
      perks: [
        showSaleMeta ? "show_sale_meta" : "hide_sale_meta",
        eTicket ? "e_ticket" : "",
        willCall ? "will_call" : "",
        kind,
      ].filter(Boolean),
      status: visible ? "on_sale" : "hidden",
    };
    onSave(ticket);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full max-w-md">
        <SheetTitle>Add tickets</SheetTitle>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className={`rounded-md border px-3 py-2 text-sm ${kind === "paid" ? "border-blue-500 bg-blue-50" : "border-zinc-300"}`}>
              Paid
            </button>
            <button type="button" className={`rounded-md border px-3 py-2 text-sm ${kind === "free" ? "border-blue-500 bg-blue-50" : "border-zinc-300"}`}>
              Free
            </button>
            <button type="button" className={`rounded-md border px-3 py-2 text-sm ${kind === "donation" ? "border-blue-500 bg-blue-50" : "border-zinc-300"}`}>
              Donation
            </button>
          </div>

          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Available quantity</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Price</Label>
            {kind === "donation" ? (
              <Input value="Any amount" disabled />
            ) : (
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} disabled={kind === "free"} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Sales start</Label>
              <Input type="datetime-local" value={saleStart} onChange={(e) => setSaleStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Sales end</Label>
              <Input type="datetime-local" value={saleEnd} onChange={(e) => setSaleEnd(e.target.value)} />
            </div>
          </div>

          <button type="button" className="w-full text-left text-sm font-medium text-zinc-700" onClick={() => setShowAdvanced((v) => !v)}>
            Advanced settings
          </button>

          {showAdvanced ? (
            <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <div className="space-y-1">
                <Label>Description</Label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <Label>Visibility</Label>
                <select
                  value={visible ? "visible" : "hidden"}
                  onChange={(e) => setVisible(e.target.value === "visible")}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Min. quantity</Label>
                  <Input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Max. quantity</Label>
                  <Input type="number" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={showSaleMeta} onChange={(e) => setShowSaleMeta(e.target.checked)} />
                  Show ticket sale end dates and sale status at checkout
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={eTicket} onChange={(e) => setETicket(e.target.checked)} />
                  eTicket
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={willCall} onChange={(e) => setWillCall(e.target.checked)} />
                  Will call
                </label>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" className="rounded-md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" className="rounded-md bg-orange-600 text-white hover:bg-orange-700" onClick={save}>
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
