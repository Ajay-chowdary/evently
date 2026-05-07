-- =====================================================================
-- Row Level Security policies (idempotent — safe to re-run)
-- =====================================================================
--
-- Trust model:
--   * Prisma connects with a privileged Postgres role and BYPASSES RLS, so
--     all server-side actions and route handlers continue to work as-is.
--   * The Supabase JS *anon* client (no JWT or anon JWT) is governed by these
--     policies — used for the public events read path.
--   * The Supabase JS *service-role* client bypasses RLS — used for Stripe
--     webhooks, image uploads, etc.
--
-- Helper: maps auth.uid() (UUID from auth.users) -> public."User".id (cuid).

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User_self_select" ON public."User";
DROP POLICY IF EXISTS "User_self_update" ON public."User";

CREATE POLICY "User_self_select" ON public."User"
  FOR SELECT TO authenticated
  USING ("authUserId" = auth.uid());

CREATE POLICY "User_self_update" ON public."User"
  FOR UPDATE TO authenticated
  USING ("authUserId" = auth.uid())
  WITH CHECK ("authUserId" = auth.uid());

-- ---------------------------------------------------------------------
-- Organizer (public profile data)
-- ---------------------------------------------------------------------
-- contactEmail is also exposed by this policy. The application layer is
-- responsible for omitting it from anon-facing responses.
ALTER TABLE public."Organizer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizer_public_select" ON public."Organizer";
DROP POLICY IF EXISTS "Organizer_self_update" ON public."Organizer";

CREATE POLICY "Organizer_public_select" ON public."Organizer"
  FOR SELECT
  USING (true);

CREATE POLICY "Organizer_self_update" ON public."Organizer"
  FOR UPDATE TO authenticated
  USING (id = public.current_app_user_id())
  WITH CHECK (id = public.current_app_user_id());

-- ---------------------------------------------------------------------
-- Event
-- ---------------------------------------------------------------------
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Event_public_select" ON public."Event";
DROP POLICY IF EXISTS "Event_organizer_select" ON public."Event";
DROP POLICY IF EXISTS "Event_organizer_write" ON public."Event";

CREATE POLICY "Event_public_select" ON public."Event"
  FOR SELECT
  USING (
    published = true
    AND visibility = 'PUBLIC'
    AND status <> 'CANCELLED'
  );

CREATE POLICY "Event_organizer_select" ON public."Event"
  FOR SELECT TO authenticated
  USING ("organizerId" = public.current_app_user_id());

CREATE POLICY "Event_organizer_write" ON public."Event"
  FOR ALL TO authenticated
  USING ("organizerId" = public.current_app_user_id())
  WITH CHECK ("organizerId" = public.current_app_user_id());

-- ---------------------------------------------------------------------
-- TicketType
-- ---------------------------------------------------------------------
ALTER TABLE public."TicketType" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "TicketType_public_select" ON public."TicketType";
DROP POLICY IF EXISTS "TicketType_organizer_write" ON public."TicketType";

CREATE POLICY "TicketType_public_select" ON public."TicketType"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "TicketType"."eventId"
        AND e.published = true
        AND e.visibility = 'PUBLIC'
        AND e.status <> 'CANCELLED'
    )
  );

CREATE POLICY "TicketType_organizer_write" ON public."TicketType"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "TicketType"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "TicketType"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- EventTag
-- ---------------------------------------------------------------------
ALTER TABLE public."EventTag" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "EventTag_public_select" ON public."EventTag";
DROP POLICY IF EXISTS "EventTag_organizer_write" ON public."EventTag";

CREATE POLICY "EventTag_public_select" ON public."EventTag"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventTag"."eventId"
        AND e.published = true
        AND e.visibility = 'PUBLIC'
        AND e.status <> 'CANCELLED'
    )
  );

CREATE POLICY "EventTag_organizer_write" ON public."EventTag"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventTag"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventTag"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- EventFAQ
-- ---------------------------------------------------------------------
ALTER TABLE public."EventFAQ" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "EventFAQ_public_select" ON public."EventFAQ";
DROP POLICY IF EXISTS "EventFAQ_organizer_write" ON public."EventFAQ";

CREATE POLICY "EventFAQ_public_select" ON public."EventFAQ"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventFAQ"."eventId"
        AND e.published = true
        AND e.visibility = 'PUBLIC'
        AND e.status <> 'CANCELLED'
    )
  );

CREATE POLICY "EventFAQ_organizer_write" ON public."EventFAQ"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventFAQ"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventFAQ"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- EventAgendaItem
-- ---------------------------------------------------------------------
ALTER TABLE public."EventAgendaItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "EventAgendaItem_public_select" ON public."EventAgendaItem";
DROP POLICY IF EXISTS "EventAgendaItem_organizer_write" ON public."EventAgendaItem";

CREATE POLICY "EventAgendaItem_public_select" ON public."EventAgendaItem"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventAgendaItem"."eventId"
        AND e.published = true
        AND e.visibility = 'PUBLIC'
        AND e.status <> 'CANCELLED'
    )
  );

CREATE POLICY "EventAgendaItem_organizer_write" ON public."EventAgendaItem"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventAgendaItem"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "EventAgendaItem"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- Booking
-- ---------------------------------------------------------------------
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Booking_self_select" ON public."Booking";
DROP POLICY IF EXISTS "Booking_organizer_select" ON public."Booking";
DROP POLICY IF EXISTS "Booking_self_insert" ON public."Booking";

CREATE POLICY "Booking_self_select" ON public."Booking"
  FOR SELECT TO authenticated
  USING ("userId" = public.current_app_user_id());

CREATE POLICY "Booking_organizer_select" ON public."Booking"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "Booking"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  );

CREATE POLICY "Booking_self_insert" ON public."Booking"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = public.current_app_user_id());

-- ---------------------------------------------------------------------
-- BookingLineItem (inherits Booking access)
-- ---------------------------------------------------------------------
ALTER TABLE public."BookingLineItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BookingLineItem_owner_select" ON public."BookingLineItem";

CREATE POLICY "BookingLineItem_owner_select" ON public."BookingLineItem"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Booking" b
      WHERE b.id = "BookingLineItem"."bookingId"
        AND (
          b."userId" = public.current_app_user_id()
          OR EXISTS (
            SELECT 1 FROM public."Event" e
            WHERE e.id = b."eventId"
              AND e."organizerId" = public.current_app_user_id()
          )
        )
    )
  );

-- ---------------------------------------------------------------------
-- Ticket
-- ---------------------------------------------------------------------
ALTER TABLE public."Ticket" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ticket_self_select" ON public."Ticket";
DROP POLICY IF EXISTS "Ticket_organizer_select" ON public."Ticket";

CREATE POLICY "Ticket_self_select" ON public."Ticket"
  FOR SELECT TO authenticated
  USING ("userId" = public.current_app_user_id());

CREATE POLICY "Ticket_organizer_select" ON public."Ticket"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Event" e
      WHERE e.id = "Ticket"."eventId"
        AND e."organizerId" = public.current_app_user_id()
    )
  );

-- ---------------------------------------------------------------------
-- SavedEvent (per-user wishlist)
-- ---------------------------------------------------------------------
ALTER TABLE public."SavedEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SavedEvent_self_all" ON public."SavedEvent";

CREATE POLICY "SavedEvent_self_all" ON public."SavedEvent"
  FOR ALL TO authenticated
  USING ("userId" = public.current_app_user_id())
  WITH CHECK ("userId" = public.current_app_user_id());

-- ---------------------------------------------------------------------
-- OrganizerFollow (public counts; self-only writes)
-- ---------------------------------------------------------------------
ALTER TABLE public."OrganizerFollow" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OrganizerFollow_public_select" ON public."OrganizerFollow";
DROP POLICY IF EXISTS "OrganizerFollow_self_write" ON public."OrganizerFollow";

CREATE POLICY "OrganizerFollow_public_select" ON public."OrganizerFollow"
  FOR SELECT
  USING (true);

CREATE POLICY "OrganizerFollow_self_write" ON public."OrganizerFollow"
  FOR ALL TO authenticated
  USING ("followerId" = public.current_app_user_id())
  WITH CHECK ("followerId" = public.current_app_user_id());

-- ---------------------------------------------------------------------
-- Venue / Category — reference data, public read, no client writes
-- ---------------------------------------------------------------------
ALTER TABLE public."Venue" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Venue_public_select" ON public."Venue";
CREATE POLICY "Venue_public_select" ON public."Venue"
  FOR SELECT
  USING (true);

ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Category_public_select" ON public."Category";
CREATE POLICY "Category_public_select" ON public."Category"
  FOR SELECT
  USING (true);
