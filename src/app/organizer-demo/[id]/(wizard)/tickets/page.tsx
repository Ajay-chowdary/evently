"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { TicketSheet } from "@/components/organizer/wizard/ticket-sheet";
import { TicketsList } from "@/components/organizer/wizard/tickets-list";
import { WizardStepBar } from "@/components/organizer/wizard/wizard-step-bar";
import { Button } from "@/components/ui/button";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import type { TicketType } from "@/types/domain";

type TicketKind = "paid" | "free" | "donation";

export default function OrganizerWizardTicketsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const event = useOrganizerMockStore((s) => s.getEventById(id));
  const tickets = useOrganizerMockStore((s) => s.getTicketTypesForEvent(id));
  const addOrUpdateTicketType = useOrganizerMockStore((s) => s.addOrUpdateTicketType);
  const deleteTicketType = useOrganizerMockStore((s) => s.deleteTicketType);
  const patchEvent = useOrganizerMockStore((s) => s.patchEvent);

  const capacityFromNote = useMemo(() => {
    const marker = (event?.heroSubtitle ?? "").match(/^cap:(\d+)$/);
    if (!marker) return null;
    return Number(marker[1]);
  }, [event?.heroSubtitle]);
  const [openSheet, setOpenSheet] = useState(false);
  const [kind, setKind] = useState<TicketKind>("paid");
  const [editing, setEditing] = useState<TicketType | null>(null);

  if (!event) {
    return <main className="p-8 text-zinc-500 dark:text-zinc-400">Event not found.</main>;
  }

  const hasTickets = tickets.length > 0;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create tickets</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Choose a ticket type or build a section with multiple ticket types.
          </p>
        </div>
        {hasTickets ? (
          <Button
            type="button"
            className="rounded-md bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => {
              setEditing(null);
              setKind("paid");
              setOpenSheet(true);
            }}
          >
            Add more tickets <ChevronDown className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {!hasTickets ? (
        <div className="space-y-3">
          {[
            { type: "paid", title: "Paid", desc: "Create a ticket that people have to pay for." },
            { type: "free", title: "Free", desc: "Create a ticket that no one has to pay for." },
            { type: "donation", title: "Donation", desc: "Let people pay any amount for their ticket." },
          ].map((card) => (
            <button
              key={card.type}
              type="button"
              onClick={() => {
                setKind(card.type as TicketKind);
                setEditing(null);
                setOpenSheet(true);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-6 text-left hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{card.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{card.desc}</p>
              </div>
              <span className="text-xl text-zinc-400">›</span>
            </button>
          ))}

          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Create a section if you want to sell multiple ticket types that share the same inventory.
            <div className="mt-3">
              <Button type="button" variant="secondary" className="rounded-md" disabled>
                Create a section
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <TicketsList
          tickets={tickets}
          onEdit={(ticket) => {
            setEditing(ticket);
            setKind(ticket.price === 0 ? "free" : (ticket.perks.includes("donation") ? "donation" : "paid"));
            setOpenSheet(true);
          }}
          onDelete={(ticketId) => deleteTicketType(id, ticketId)}
          capacity={capacityFromNote}
          onCapacityChange={(value) => patchEvent(id, { heroSubtitle: value ? `cap:${value}` : null })}
        />
      )}

      {openSheet ? (
        <TicketSheet
          key={`${editing?.id ?? "new"}-${kind}`}
          open={openSheet}
          kind={kind}
          eventId={id}
          initial={editing}
          onClose={() => setOpenSheet(false)}
          onSave={(ticket) => addOrUpdateTicketType(id, ticket)}
        />
      ) : null}

      <WizardStepBar primaryLabel="Next" onPrimary={() => router.push(`/organizer-demo/${id}/publish`)} />
    </main>
  );
}
