import type {
  BookingStatus,
  EventStatus,
  EventVisibility,
  TicketPassStatus,
  TicketTypeStatus,
  UserRole,
} from "./status";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  createdAt: string;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  website?: string;
}

export interface Organizer {
  id: string;
  name: string;
  handle: string;
  logo: string | null;
  bio: string;
  verified: boolean;
  contactEmail: string;
  socialLinks: SocialLinks;
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  accessibilityInfo: string | null;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface AgendaItem {
  id: string;
  label: string;
  startTime: string;
  endTime: string | null;
  description: string;
  speaker: string | null;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string;
}

export interface DomainEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  shortDescription: string | null;
  category: string;
  categorySlug: string;
  tags: string[];
  coverImage: string;
  galleryImages: string[];
  startDateTime: string;
  endDateTime: string | null;
  timezone: string;
  venueId: string;
  /** When set, overrides venue map city for browse cards and city filters (user-entered location). */
  listingCity?: string | null;
  /** When set, overrides the seed Venue entirely with a user-chosen address (organizer wizard flow). */
  listingVenue?: {
    name: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region: string;
    country: string;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  organizerId: string;
  status: EventStatus;
  featured: boolean;
  ageRestriction: string | null;
  dressCode: string | null;
  refundPolicy: string | null;
  agenda: AgendaItem[];
  faqItems: FAQItem[];
  ticketTypeIds: string[];
  visibility: EventVisibility;
  createdAt: string;
  updatedAt: string;
  salesEndsAt: string | null;
  ticketNote: string | null;
  presenterLine: string | null;
  tagline: string | null;
  heroSubtitle: string | null;
  customOrganizerName?: string | null;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  inventoryTotal: number;
  inventoryRemaining: number;
  minPerOrder: number;
  maxPerOrder: number;
  saleStart: string | null;
  saleEnd: string | null;
  perks: string[];
  status: TicketTypeStatus;
}

export interface BookingLineItem {
  id: string;
  bookingId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Booking {
  id: string;
  referenceCode: string;
  userId: string;
  eventId: string;
  /** Denormalized for client routing without catalog lookup */
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string;
  status: BookingStatus;
  currency: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  lineItems: BookingLineItem[];
  ticketsIssuedCount: number;
  attendeeName: string;
  attendeeEmail: string;
}

export interface IssuedTicket {
  id: string;
  bookingId: string;
  eventId: string;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
  qrCodeValue: string;
  status: TicketPassStatus;
  issuedAt: string;
}

/** Card grid shape: compatible with EventCard (Prisma Event fields). */
export interface PublicEventListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  imageUrl: string;
  startsAt: Date;
  minPrice: number;
  currency: string;
}

export interface CatalogEventDetail extends DomainEvent {
  venue: Venue;
  organizer: Organizer;
  ticketTypes: TicketType[];
}
