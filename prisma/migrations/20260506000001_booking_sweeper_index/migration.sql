-- Composite index used by the PENDING_PAYMENT sweeper to cheaply find
-- expired Stripe checkout sessions that need to be cancelled + inventory
-- returned. See src/app/api/cron/expire-pending-bookings/* (to be added).
CREATE INDEX IF NOT EXISTS "Booking_status_checkoutExpiresAt_idx"
  ON "Booking" ("status", "checkoutExpiresAt");
