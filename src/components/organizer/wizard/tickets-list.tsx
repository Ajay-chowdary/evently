"use client";

import { GripVertical, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import type { TicketType } from "@/types/domain";

export function TicketsList({
  tickets,
  onEdit,
  onDelete,
  capacity,
  onCapacityChange,
}: {
  tickets: TicketType[];
  onEdit: (ticket: TicketType) => void;
  onDelete: (ticketId: string) => void;
  capacity: number | null;
  onCapacityChange: (value: number | null) => void;
}) {
  const totalInventory = tickets.reduce((sum, t) => sum + t.inventoryTotal, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {[
          "Admission",
          "Add-ons",
          "Promotions",
          "Holds",
          "Settings",
        ].map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={index === 0 ? "border-b-2 border-blue-600 pb-2 text-sm font-semibold text-blue-700 dark:text-blue-300" : "pb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"}
            disabled={index !== 0}
          >
            {tab}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {tickets.map((ticket) => {
          const sold = ticket.inventoryTotal - ticket.inventoryRemaining;
          return (
            <li key={ticket.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{ticket.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {ticket.status === "hidden" ? "Hidden" : "On sale"} · Sold: {sold}/{ticket.inventoryTotal}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {ticket.price > 0 ? formatCurrency(ticket.price, ticket.currency) : "Free"}
                </p>
                <button type="button" aria-label="Edit ticket" onClick={() => onEdit(ticket)} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onDelete(ticket.id)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700">
        <div className="flex items-center justify-between gap-3">
          <p className="text-zinc-600 dark:text-zinc-400">Event capacity</p>
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{totalInventory} / {capacity ?? totalInventory}</span>
            <button
              type="button"
              className="text-blue-700 hover:underline dark:text-blue-300"
              onClick={() => {
                const next = window.prompt("Set event capacity", String(capacity ?? totalInventory));
                if (next == null) return;
                const num = Number(next);
                if (!Number.isFinite(num) || num <= 0) return;
                onCapacityChange(Math.round(num));
              }}
            >
              Edit capacity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
