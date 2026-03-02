/**
 * Data Service Layer - Production Ready
 * 
 * Access layer for reading data from Supabase.
 * Filters and sorting are applied server-side.
 */

import { supabase } from './supabaseClient';
import { Property, PropertyFilters, MeetingRequest, SiteVisitRequest, MeetingSlot, Booking } from './types';

// --- Properties ---

/**
 * Fetch a single property by ID with agent details and images
 */
export async function getPropertyById(id: string) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        agent:agents(
          id,
          name,
          email,
          phone,
          profile_image,
          bio
        ),
        images:property_images(
          image_url,
          display_order,
          is_primary
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    // Format for frontend
    const formattedData: Property = {
      ...data,
      priceNumeric: data.price_numeric,
      squareFeet: data.square_feet,
      propertyType: data.property_type,
      agentId: data.agent_id,
      createdAt: data.created_at,
      images: data.images
              ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
              .map((img: any) => img.image_url) || []
    };

    return { data: formattedData, error: null };
  } catch (err: any) {
    console.error('Error in getPropertyById:', err.message);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch all properties with optional server-side filtering and sorting
 * OPTIMIZED: Selects only needed columns, applies server-side limit, and indexes filters
 */
export async function getAllProperties(
  filters?: PropertyFilters, 
  sortBy: string = 'created_at', 
  sortOrder: 'asc' | 'desc' = 'desc',
  limit: number = 12  // Default limit to prevent overfetch
) {
  try {
    // 1. Base Query - only select essential columns
    let query = supabase
      .from('properties')
      .select(`
        id,
        title,
        price,
        price_numeric,
        city,
        area,
        bedrooms,
        bathrooms,
        square_feet,
        property_type,
        status,
        created_at,
        images:property_images(image_url, is_primary)
      `);

    // 2. Apply Filters (Server-Side) - always applies, no client-side filtering
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      if (filters.priceMin !== null) query = query.gte('price_numeric', filters.priceMin);
      if (filters.priceMax !== null) query = query.lte('price_numeric', filters.priceMax);

      if (filters.cities && filters.cities.length > 0) query = query.in('city', filters.cities);
      if (filters.areas && filters.areas.length > 0) query = query.in('area', filters.areas);

      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        query = query.in('property_type', filters.propertyTypes);
      }

      if (filters.bedrooms !== null) query = query.gte('bedrooms', filters.bedrooms);
      if (filters.bathrooms !== null) query = query.gte('bathrooms', filters.bathrooms);
      if (filters.squareFeetMin !== null) query = query.gte('square_feet', filters.squareFeetMin);
      if (filters.squareFeetMax !== null) query = query.lte('square_feet', filters.squareFeetMax);
      
      if (filters.searchQuery) {
        const term = `%${filters.searchQuery}%`;
        query = query.or(`title.ilike.${term},city.ilike.${term},area.ilike.${term}`);
      }
    }

    // 3. Apply Sorting
    const dbSortField = sortBy === 'squareFeet' ? 'square_feet' :
                        sortBy === 'priceNumeric' ? 'price_numeric' :
                        sortBy === 'createdAt' ? 'created_at' :
                        sortBy;

    query = query.order(dbSortField, { ascending: sortOrder === 'asc' });

    // 4. Apply limit to prevent overfetch
    query = query.limit(Math.min(limit, 100)); // Max 100 per request

    // 5. Execute
    const { data, error } = await query;

    if (error) throw error;
    
    // 6. Format Data
    const formattedData: Property[] = (data || []).map((p: any) => ({
      ...p,
      priceNumeric: p.price_numeric,
      squareFeet: p.square_feet,
      propertyType: p.property_type,
      agentId: p.agent_id,
      createdAt: p.created_at,
      images: p.images?.map((img: any) => img.image_url) || []
    }));

    return { data: formattedData, error: null };

  } catch (err: any) {
    console.error('Error in getAllProperties:', err.message);
    return { data: [], error: err.message };
  }
}

// --- Buyer Requests (Admin) ---
// OPTIMIZED: Limited columns, index-friendly filters, reasonable limit

export async function getAllMeetingRequests() {
  try {
    const { data, error } = await supabase
      .from('meeting_requests')
      .select('id, property_id, client_name, client_email, client_phone, preferred_date, preferred_time, message, status, created_at, property:properties(id, title)')
      .order('created_at', { ascending: false })
      .limit(100);  // Reasonable limit

    if (error) throw error;
    
    // Transform to match frontend type
    const formatted: MeetingRequest[] = (data || []).map((item: any) => ({
      id: item.id,
      propertyId: item.property_id,
      propertyTitle: item.property?.title || 'Unknown',
      buyerName: item.client_name,
      buyerEmail: item.client_email,
      buyerPhone: item.client_phone,
      preferredDate: item.preferred_date,
      preferredTime: item.preferred_time,
      message: item.message,
      status: item.status,
      createdAt: item.created_at
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    console.error('Error fetching meeting requests:', err);
    return { data: [], error: err.message };
  }
}

export async function getAllSiteVisitRequests() {
  try {
    const { data, error } = await supabase
      .from('site_visit_requests')
      .select('id, property_id, client_name, client_email, client_phone, visit_date, visit_time, number_of_people, notes, status, created_at, property:properties(id, title)')
      .order('created_at', { ascending: false })
      .limit(100);  // Reasonable limit

    if (error) throw error;

    const formatted: SiteVisitRequest[] = (data || []).map((item: any) => ({
      id: item.id,
      propertyId: item.property_id,
      propertyTitle: item.property?.title || 'Unknown',
      buyerName: item.client_name,
      buyerEmail: item.client_email,
      buyerPhone: item.client_phone,
      preferredDate: item.visit_date,
      preferredTime: item.visit_time,
      attendees: item.number_of_people,
      message: item.notes,
      status: item.status,
      createdAt: item.created_at
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    console.error('Error fetching site visit requests:', err);
    return { data: [], error: err.message };
  }
}

export async function updateRequestStatus(
  type: 'meeting' | 'site-visit' | 'site_visit',
  id: string,
  status: string
) {
  const table = type === 'meeting' ? 'meeting_requests' : 'site_visit_requests';
  const { error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

export async function getDashboardStats() {
  try {
    const [
      { count: totalProperties },
      { count: availableProperties },
      { count: meetingPending },
      { count: visitPending },
      { count: propertyTypes },
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'Available'),
      supabase.from('meeting_requests').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'New']),
      supabase.from('site_visit_requests').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'New']),
      supabase.from('property_types').select('*', { count: 'exact', head: true }),
    ]);

    return {
      data: {
        totalProperties: totalProperties || 0,
        availableProperties: availableProperties || 0,
        pendingRequests: (meetingPending || 0) + (visitPending || 0),
        propertyTypes: propertyTypes || 0,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      data: {
        totalProperties: 0,
        availableProperties: 0,
        pendingRequests: 0,
        propertyTypes: 0,
      },
      error: err.message,
    };
  }
}

// --- Notifications ---

export async function getNotifications(): Promise<{ data: Array<{
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}> }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) {
      console.error('Failed to fetch notifications:', error.message || error);
      return { data: [] };
    }
    
    return { data: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching notifications';
    console.error('Notifications fetch error:', errorMessage);
    return { data: [] };
  }
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead() {
  await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
}

// --- Agents ---

export async function getAllAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching agents:', error);
    return { data: [], error: error.message };
  }
  
  return { data: data || [], error: null };
}

export async function createAgent(payload: {
  name: string;
  email: string;
  phone: string;
  company?: string;
  bio?: string;
  license_number?: string;
}) {
  const { data, error } = await supabase
    .from('agents')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating agent:', error);
    throw new Error(error.message);
  }

  return { data, error: null };
}

export async function updateAgent(
  id: string,
  payload: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    bio?: string;
    license_number?: string;
  }
) {
  const { data, error } = await supabase
    .from('agents')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent:', error);
    throw new Error(error.message);
  }

  return { data, error: null };
}

export async function deleteAgent(id: string) {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting agent:', error);
    throw new Error(error.message);
  }

  return { success: true, error: null };
}

// --- Public Requests ---

export async function createMeetingRequest(data: any) {
  const { error } = await supabase
    .from('meeting_requests')
    .insert([{
      property_id: data.propertyId,
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      buyer_phone: data.buyerPhone,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      message: data.message,
      status: 'New'
    }]);

  if (error) {
    console.error('Error creating meeting request:', error);
    throw new Error(error.message);
  }
  return { success: true, error: null };
}

export async function createSiteVisitRequest(data: any) {
  const { error } = await supabase
    .from('site_visit_requests')
    .insert([{
      property_id: data.propertyId,
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      buyer_phone: data.buyerPhone,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      attendees: data.attendees,
      message: data.message,
      status: 'New'
    }]);

  if (error) {
    console.error('Error creating site visit request:', error);
    throw new Error(error.message);
  }
  return { success: true, error: null };
}

// --- Master Data (Cities, Types) ---

export async function getAllCities() {
  const { data, error } = await supabase.from('cities').select('*').order('name');
  if (error) throw error;
  return { data };
}

export async function createCity(name: string) {
  const { data, error } = await supabase.from('cities').insert([{ name }]).select().single();
  if (error) throw error;
  return { data };
}

export async function updateCity(id: string, name: string) {
  const { data, error } = await supabase.from('cities').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return { data };
}

export async function deleteCity(id: string) {
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getAreasList() {
  const { data, error } = await supabase
    .from('areas')
    .select('*, city:cities(name)')
    .order('name');
    
  if (error) throw error;
  return {
    data: data.map((a: any) => ({
      ...a,
      city: a.city?.name // flatten city name
    }))
  };
}

export async function createArea(name: string, cityId: string) {
  const { data, error } = await supabase
    .from('areas')
    .insert([{ name, city_id: cityId }])
    .select()
    .single();
  if (error) throw error;
  return { data };
}

export async function deleteArea(id: string) {
  const { error } = await supabase.from('areas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getAllPropertyTypes() {
  const { data, error } = await supabase.from('property_types').select('*').order('name');
  if (error) throw error;
  return { data };
}

export async function createPropertyType(name: string) {
  const { data, error } = await supabase.from('property_types').insert([{ name }]).select().single();
  if (error) throw error;
  return { data };
}

export async function deletePropertyType(id: string) {
  const { error } = await supabase.from('property_types').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      area:areas(id, name, city:cities(name))
    `)
    .order('name');
    
  if (error) throw error;

  return {
    data: data.map((p: any) => ({
      ...p,
      areaName: p.area?.name,
      cityName: p.area?.city?.name
    }))
  };
}

export async function createProject(data: { name: string; developer: string; areaId: string; isActive: boolean }) {
  const { data: result, error } = await supabase
    .from('projects')
    .insert([{
      name: data.name,
      developer: data.developer,
      area_id: data.areaId,
      is_active: data.isActive
    }])
    .select()
    .single();
    
  if (error) throw error;
  return { data: result };
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =====================================================
// Calendar & Booking Functions
// =====================================================

export async function getMeetingSlots(from?: string, to?: string): Promise<{ data: MeetingSlot[] }> {
  let query = supabase
    .from('meeting_slots')
    .select('*')
    .order('start_time', { ascending: true });

  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('start_time', to);

  const { data, error } = await query;
  if (error) throw error;
  return { data: data || [] };
}

export async function createMeetingSlot(slot: Partial<MeetingSlot>): Promise<{ data: MeetingSlot }> {
  const { data, error } = await supabase
    .from('meeting_slots')
    .insert({
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_blocked: slot.is_blocked ?? false,
      title: slot.title || null,
      notes: slot.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return { data };
}

export async function updateMeetingSlot(id: string, updates: Partial<MeetingSlot>): Promise<{ data: MeetingSlot }> {
  const { data, error } = await supabase
    .from('meeting_slots')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { data };
}

export async function deleteMeetingSlot(id: string): Promise<boolean> {
  const { error } = await supabase.from('meeting_slots').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getBookings(status?: string): Promise<{ data: Booking[] }> {
  let query = supabase
    .from('bookings')
    .select('*, meeting_slots(*)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return { data: data || [] };
}

export async function updateBookingStatus(
  id: string,
  action: 'confirm' | 'cancel' | 'complete',
  adminNotes?: string
): Promise<{ data: Booking }> {
  const statusMap: Record<string, string> = {
    confirm: 'confirmed',
    cancel: 'cancelled',
    complete: 'completed',
  };

  const updateData: Record<string, unknown> = { status: statusMap[action] };
  if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { data };
}

export async function getAvailableSlots(date?: string, from?: string, to?: string): Promise<{ data: MeetingSlot[] }> {
  let query = supabase
    .from('meeting_slots')
    .select('id, start_time, end_time, title')
    .eq('is_blocked', false)
    .order('start_time', { ascending: true });

  if (date) {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;
    query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
  } else if (from && to) {
    query = query.gte('start_time', from).lte('start_time', to);
  } else {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('start_time', now).lte('start_time', future);
  }

  const { data: slots, error } = await query;
  if (error) throw error;

  // Filter out booked slots
  const slotIds = (slots || []).map((s) => s.id);
  let bookedSlotIds: string[] = [];

  if (slotIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_id')
      .in('slot_id', slotIds)
      .in('status', ['pending', 'confirmed']);

    bookedSlotIds = (bookings || []).map((b) => b.slot_id).filter(Boolean) as string[];
  }

  const available = (slots || []).filter((s) => !bookedSlotIds.includes(s.id));
  return { data: available as MeetingSlot[] };
}

export async function createBooking(booking: {
  slot_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  message?: string;
  duration?: number;
}): Promise<{ data: Booking }> {
  // Fetch slot times
  const { data: slot, error: slotErr } = await supabase
    .from('meeting_slots')
    .select('start_time, end_time')
    .eq('id', booking.slot_id)
    .single();

  if (slotErr || !slot) throw new Error('Slot not found');

  const dur = booking.duration || 30;
  const start = new Date(slot.start_time);
  const end = new Date(start.getTime() + dur * 60 * 1000);

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      slot_id: booking.slot_id,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone || null,
      start_time: slot.start_time,
      end_time: end.toISOString(),
      duration: dur,
      message: booking.message || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return { data };
}

