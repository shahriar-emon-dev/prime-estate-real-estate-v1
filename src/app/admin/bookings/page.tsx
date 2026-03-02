'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaTimes, FaRedo, FaCheckCircle, FaClock, FaEnvelope, FaPhone, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { getBookings, updateBookingStatus } from '@/lib/dataService';
import { Booking } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/lib/hooks/useToast';

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const { data } = await getBookings(status);
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast.info(`New booking from ${(payload.new as Booking).guest_name}`);
        }
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBookings]);

  const handleAction = async (id: string, action: 'confirm' | 'cancel' | 'complete') => {
    setActionLoading(id);
    try {
      await updateBookingStatus(id, action);
      toast.success(`Booking ${action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed'}`);
      fetchBookings();
    } catch (err) {
      toast.error(`Failed to ${action} booking`);
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const filters = [
    { label: 'All', value: 'all', count: stats.total },
    { label: 'Pending', value: 'pending', count: stats.pending },
    { label: 'Confirmed', value: 'confirmed', count: stats.confirmed },
    { label: 'Completed', value: 'completed', count: stats.completed },
    { label: 'Cancelled', value: 'cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-1 text-sm">Manage and respond to meeting booking requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.total, icon: <FaCalendarAlt />, color: 'bg-blue-500' },
          { label: 'Pending', value: stats.pending, icon: <FaClock />, color: 'bg-orange-500' },
          { label: 'Confirmed', value: stats.confirmed, icon: <FaCheckCircle />, color: 'bg-purple-500' },
          { label: 'Completed', value: stats.completed, icon: <FaCheck />, color: 'bg-green-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`${s.color} text-white p-3 rounded-xl`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <FaFilter className="text-gray-400 text-sm flex-shrink-0" />
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} {f.count > 0 && <span className="ml-1 opacity-80">({f.count})</span>}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <FaCalendarAlt className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">No bookings found</p>
            <p className="text-gray-500 text-sm mt-1">Bookings will appear here when customers submit requests</p>
          </div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {booking.guest_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-base">{booking.guest_name}</h3>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-gray-400 text-xs" />
                        <span className="truncate">{booking.guest_email}</span>
                      </div>
                      {booking.guest_phone && (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-gray-400 text-xs" />
                          <span>{booking.guest_phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400 text-xs" />
                        <span>{formatDateTime(booking.start_time)}</span>
                      </div>
                    </div>

                    {booking.message && (
                      <p className="mt-2 text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg">
                        &ldquo;{booking.message}&rdquo;
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Duration: {booking.duration} min · Requested {formatDateTime(booking.created_at)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {booking.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(booking.id, 'confirm')}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
                      >
                        <FaCheck className="text-xs" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(booking.id, 'cancel')}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
                      >
                        <FaTimes className="text-xs" /> Reject
                      </button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(booking.id, 'complete')}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
                      >
                        <FaCheckCircle className="text-xs" /> Complete
                      </button>
                      <button
                        onClick={() => handleAction(booking.id, 'cancel')}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <FaTimes className="text-xs" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
