import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/routeAuth';

// ============================================================
// GET /api/admin/meeting-slots — list all slots (admin view)
// POST /api/admin/meeting-slots — create/update a slot
// ============================================================

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = auth.supabase
    .from('meeting_slots')
    .select('*')
    .order('start_time', { ascending: true });

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
  const { id, start_time, end_time, is_blocked, title, notes } = body;

  if (!start_time || !end_time) {
    return NextResponse.json(
      { error: 'start_time and end_time are required' },
      { status: 400 }
    );
  }

  // Update existing slot
  if (id) {
    const { data, error } = await auth.supabase
      .from('meeting_slots')
      .update({ start_time, end_time, is_blocked: is_blocked ?? false, title, notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  // Create new slot
  const { data, error } = await auth.supabase
    .from('meeting_slots')
    .insert({ start_time, end_time, is_blocked: is_blocked ?? false, title, notes })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('meeting_slots')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
