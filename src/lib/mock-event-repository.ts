import type { DomainEvent, TicketType } from "@/types/domain";
import { buildMockDomainEvent } from "@/lib/mock-organizer-factory";
import { defaultGaTicketTypesForEvent } from "@/lib/mock-organizer-default-tickets";
import {
  domainEventToPublicListItem,
  getMockEventsForOrganizer,
  searchMockEvents,
  type MockEventFilters,
} from "@/lib/mock-db/catalog";

export type OrganizerCreateInput = {
  title: string;
  description: string;
  city: string;
  categoryName: string;
  categorySlug: string;
  coverImage: string;
  startDateTimeIso: string;
  endDateTimeIso: string | null;
  status: "draft" | "published";
};

/**
 * Builds a persisted-shaped event plus default ticket rows for the mock organizer store.
 * Slugs are unique against seed plus any events already in the organizer slice.
 */
export function createOrganizerMockEvent(
  input: OrganizerCreateInput,
  publishedSnapshot: DomainEvent[],
): { event: DomainEvent; ticketTypes: TicketType[] } {
  const ev = buildMockDomainEvent({
    title: input.title,
    description: input.description,
    category: input.categoryName,
    categorySlug: input.categorySlug,
    city: input.city,
    coverImage: input.coverImage,
    startDateTime: input.startDateTimeIso,
    endDateTime: input.endDateTimeIso,
    status: input.status,
    publishedSnapshot,
  });
  const ticketTypes = defaultGaTicketTypesForEvent(ev);
  const event: DomainEvent = { ...ev, ticketTypeIds: ticketTypes.map((t) => t.id) };
  return { event, ticketTypes };
}

export function listOrganizerMockEvents(organizerId: string, published: DomainEvent[]): DomainEvent[] {
  return getMockEventsForOrganizer(organizerId, published);
}

export function listPublishedMockBrowse(
  filters: MockEventFilters,
  published: DomainEvent[],
  extraTicketTypes: TicketType[],
) {
  return searchMockEvents(filters, published, extraTicketTypes);
}

export function toPublicListItem(ev: DomainEvent, extraTicketTypes: TicketType[]) {
  return domainEventToPublicListItem(ev, extraTicketTypes);
}
