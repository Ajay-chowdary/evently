# Evently mock MVP (architecture notes)

This document describes the env-toggle mock layer, where it lives, and how to replace it with Prisma, auth, and payments later.

## Toggle

Set in `.env` or `.env.local`:

- `NEXT_PUBLIC_USE_MOCK_CATALOG=true` — mock seed catalog, tiered tickets, localStorage bookings, wishlist, organizer demo, client-side event detail and checkout.
- `NEXT_PUBLIC_USE_MOCK_CATALOG=false` (default) — Prisma SQLite, NextAuth, existing server actions for favorites and free RSVP.

Restart the dev server after changing this variable.

## Folder map

| Area | Location |
|------|----------|
| Domain types | `src/types/domain/` |
| Seed data | `src/mock-data/seed/index.ts` |
| Catalog queries (pure) | `src/lib/mock-db/catalog.ts` |
| Server data switch | `src/lib/data-source.ts` (imports `server-only`) |
| Booking math and rules | `src/lib/booking-engine/` |
| Currency | `src/lib/formatters/currency.ts` |
| Booking list helpers | `src/lib/selectors/bookings.ts` |
| Client env flag | `src/lib/public-env.ts` (`MOCK_CATALOG`) |
| Zustand stores | `src/stores/booking-store.ts`, `wishlist-store.ts`, `organizer-mock-store.ts` |

## Zustand persistence (localStorage)

| Key | Purpose |
|-----|---------|
| `evently-bookings-v1` | Bookings, issued tickets, inventory overrides |
| `evently-wishlist-v1` | Saved event ids |
| `evently-organizer-v1` | Organizer-published events and per-event ticket types |

Cart is not persisted; it clears after a successful checkout.

## Catalog vs persistence

- **Catalog (read):** RSC pages call `loadEventsForBrowse`, `loadFeaturedForHome`, `loadCategoriesForDiscovery`, etc. from `data-source.ts`. In mock mode these use in-memory seed arrays only (no organizer localStorage on the server).
- **Browse merge:** `MockEventsGrid` subscribes to `useOrganizerMockStore` and recomputes `searchMockEvents` when persisted organizer events load or change (including cross-tab via `storage` and `focus` rehydrate).
- **Event detail (mock):** `EventMockDetailClient` merges seed + `useOrganizerMockStore` published events and extra ticket types so new slugs resolve in the browser.
- **Checkout (mock):** `CheckoutRouteClient` resolves the event the same way before rendering `CheckoutClient`.

## Service fee

Configured in `src/lib/booking-engine/constants.ts` (`SERVICE_FEE_RATE`, `SERVICE_FEE_MAX_USD`). Not env-driven in this MVP.

## Routes (mock-oriented)

| Path | Role |
|------|------|
| `/explore` | Redirects to `/events` |
| `/events/category/[slug]` | Redirects to `/events?type=slug` |
| `/events/[slug]/checkout` | Mock checkout only; redirects away if mock off |
| `/book/success`, `/book/failure` | Post-checkout states |
| `/bookings`, `/bookings/[id]` | Mock booking list and detail |
| `/tickets/[ticketId]` | Digital pass placeholder |
| `/saved` | Wishlist (mock) |
| `/organizer-demo` | Unauthenticated organizer CRUD demo |
| `/organizers/[handle]` | Organizer profile (mock only; 404 if mock off) |
| `/help` | FAQ copy |
| `/dashboard/[id]/bookings`, `/dashboard/[id]/analytics` | Authenticated; mock bookings list uses same `OrganizerEventBookings` client when event id matches mock purchases |

## Plugging in real backend later

1. Keep `NEXT_PUBLIC_USE_MOCK_CATALOG=false` in production.
2. Replace or narrow `data-source.ts` so all reads go through Prisma (or your API).
3. Map Prisma models to shared DTOs or keep Prisma types on the server and pass serializable props to existing UI.
4. Swap Zustand booking flows for API calls (create booking, cancel, list); keep the same UI components where possible.
5. Add a payment provider (e.g. Stripe) in the checkout route or server action; replace `confirmCart` with a server-confirmed order.
6. Bind `MOCK_USER_ID` in `booking-engine/constants.ts` to the authenticated user id from the session.

## Assumptions

- Mock organizer profile pages do not merge localStorage-published events on the server; only seed events for that organizer handle are listed until you add a client merge or API.
- Prisma event ids and mock event ids are different namespaces; dashboard bookings shows mock rows only when `eventId` in the store matches the Prisma event id (typically only if you align ids manually or migrate data).
