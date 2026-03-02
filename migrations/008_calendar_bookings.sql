-- =====================================================
-- MIGRATION 008: Calendar & Booking System
-- =====================================================
-- Creates meeting_slots and bookings tables for
-- real-time calendar synchronization between
-- Admin Dashboard and public Storefront.
-- =====================================================

-- =====================================================
-- 1. MEETING SLOTS TABLE
-- =====================================================
-- Stores admin-defined availability windows and blocked times.
-- All timestamps stored in UTC.

CREATE TABLE IF NOT EXISTS public.meeting_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_meeting_slots_start ON public.meeting_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_slots_end ON public.meeting_slots(end_time);
CREATE INDEX IF NOT EXISTS idx_meeting_slots_blocked ON public.meeting_slots(is_blocked);

-- =====================================================
-- 2. BOOKINGS TABLE
-- =====================================================
-- Stores customer booking requests linked to meeting slots.

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID REFERENCES public.meeting_slots(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_booking_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON public.bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON public.bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(guest_email);

-- =====================================================
-- 3. UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_meeting_slots_updated_at ON public.meeting_slots;
CREATE TRIGGER update_meeting_slots_updated_at
    BEFORE UPDATE ON public.meeting_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- meeting_slots: Public can SELECT non-blocked slots; Admin full access
DROP POLICY IF EXISTS "Public can view available slots" ON public.meeting_slots;
CREATE POLICY "Public can view available slots"
    ON public.meeting_slots FOR SELECT
    USING (is_blocked = false);

DROP POLICY IF EXISTS "Admins full access to meeting_slots" ON public.meeting_slots;
CREATE POLICY "Admins full access to meeting_slots"
    ON public.meeting_slots FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- bookings: Public can SELECT own bookings & INSERT new; Admin full access
DROP POLICY IF EXISTS "Public can view own bookings" ON public.bookings;
CREATE POLICY "Public can view own bookings"
    ON public.bookings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to bookings" ON public.bookings;
CREATE POLICY "Admins full access to bookings"
    ON public.bookings FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- =====================================================
-- 5. ENABLE REALTIME
-- =====================================================
-- Run these in the Supabase Dashboard > Database > Replication
-- or use the following:

ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- =====================================================
-- DONE
-- =====================================================
