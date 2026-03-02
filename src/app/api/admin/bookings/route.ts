import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/routeAuth';

// ============================================================
// GET  /api/admin/bookings — list all bookings (admin)
// POST /api/admin/bookings — update booking status (approve/cancel/complete)
// ============================================================

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = auth.supabase
    .from('bookings')
    .select('*, meeting_slots(*)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('start_time', to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  const body = await request.json();
  const { id, action, admin_notes } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: 'id and action are required' },
      { status: 400 }
    );
  }

  const validActions = ['confirm', 'cancel', 'complete', 'reschedule'];
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
      { status: 400 }
    );
  }

  const statusMap: Record<string, string> = {
    confirm: 'confirmed',
    cancel: 'cancelled',
    complete: 'completed',
    reschedule: 'pending',
  };

  const updateData: Record<string, unknown> = { status: statusMap[action] };
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

  // If rescheduling, also accept new times
  if (action === 'reschedule' && body.start_time && body.end_time) {
    updateData.start_time = body.start_time;
    updateData.end_time = body.end_time;
  }

  const { data, error } = await auth.supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
