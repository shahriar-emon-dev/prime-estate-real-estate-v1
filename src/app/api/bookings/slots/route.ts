export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// ============================================================
// GET  /api/bookings/slots — public: available slots
// POST /api/bookings/slots — public: create a booking
// ============================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Start building the query for unblocked slots
  let query = supabase
    .from('meeting_slots')
    .select('id, start_time, end_time, title')
    .eq('is_blocked', false)
    .order('start_time', { ascending: true });

  if (date) {
    // Filter for a specific day
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;
    query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
  } else if (from && to) {
    query = query.gte('start_time', from).lte('start_time', to);
  } else {
    // Default: next 30 days
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('start_time', now).lte('start_time', future);
  }

  const { data: slots, error: slotsError } = await query;

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  // Get existing bookings that are not cancelled to filter out occupied slots
  const slotIds = (slots || []).map((s) => s.id);

  let bookedSlotIds: string[] = [];
  if (slotIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_id')
      .in('slot_id', slotIds)
      .in('status', ['pending', 'confirmed']);

    bookedSlotIds = (bookings || []).map((b) => b.slot_id).filter(Boolean);
  }

  // Filter out booked slots
  const availableSlots = (slots || []).filter(
    (slot) => !bookedSlotIds.includes(slot.id)
  );

  return NextResponse.json({ data: availableSlots });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slot_id, guest_name, guest_email, guest_phone, message, duration } = body;

    if (!slot_id || !guest_name || !guest_email) {
      return NextResponse.json(
        { error: 'slot_id, guest_name, and guest_email are required' },
        { status: 400 }
      );
    }

    // 1. Fetch the slot to ensure it exists and is available
    const { data: slot, error: slotError } = await supabase
      .from('meeting_slots')
      .select('*')
      .eq('id', slot_id)
      .eq('is_blocked', false)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Slot not found or unavailable' },
        { status: 404 }
      );
    }

    // 2. Check for conflicts (existing non-cancelled bookings on this slot)
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', slot_id)
      .in('status', ['pending', 'confirmed']);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This slot has already been booked' },
        { status: 409 }
      );
    }

    // 3. Create the booking
    const bookingDuration = duration || 30;
    const startTime = new Date(slot.start_time);
    const endTime = new Date(startTime.getTime() + bookingDuration * 60 * 1000);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id,
        guest_name,
        guest_email,
        guest_phone: guest_phone || null,
        start_time: slot.start_time,
        end_time: endTime.toISOString(),
        duration: bookingDuration,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (err) {
    console.error('Booking creation error:', err);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
