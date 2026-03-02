'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaLock, FaCalendarAlt, FaClock, FaTrash } from 'react-icons/fa';
import { getMeetingSlots, createMeetingSlot, updateMeetingSlot, deleteMeetingSlot, getBookings } from '@/lib/dataService';
import { MeetingSlot, Booking } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/lib/hooks/useToast';

// ============================================================
// Helpers
// ============================================================

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isSameDay(d1: string, d2: Date) {
  const a = new Date(d1);
  return a.getFullYear() === d2.getFullYear() && a.getMonth() === d2.getMonth() && a.getDate() === d2.getDate();
}

// ============================================================
// Admin Calendar Page
// ============================================================

export default function AdminCalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MeetingSlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    date: '',
    startHour: '09',
    startMinute: '00',
    endHour: '10',
    endMinute: '00',
    title: '',
    notes: '',
    is_blocked: false,
  });

  // --------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(currentYear, currentMonth, 1).toISOString();
      const to = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
      const [slotsRes, bookingsRes] = await Promise.all([
        getMeetingSlots(from, to),
        getBookings(),
      ]);
      setSlots(slotsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --------------------------------------------------------
  // Real-time subscriptions
  // --------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel('admin-calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_slots' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // --------------------------------------------------------
  // Navigation
  // --------------------------------------------------------
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // --------------------------------------------------------
  // Slot CRUD
  // --------------------------------------------------------
  const openCreateModal = (date?: Date) => {
    const d = date || selectedDate;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setEditingSlot(null);
    setSlotForm({ date: dateStr, startHour: '09', startMinute: '00', endHour: '10', endMinute: '00', title: '', notes: '', is_blocked: false });
    setShowModal(true);
  };

  const openEditModal = (slot: MeetingSlot) => {
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    setEditingSlot(slot);
    setSlotForm({
      date: dateStr,
      startHour: String(start.getHours()).padStart(2, '0'),
      startMinute: String(start.getMinutes()).padStart(2, '0'),
      endHour: String(end.getHours()).padStart(2, '0'),
      endMinute: String(end.getMinutes()).padStart(2, '0'),
      title: slot.title || '',
      notes: slot.notes || '',
      is_blocked: slot.is_blocked,
    });
    setShowModal(true);
  };

  const handleSaveSlot = async () => {
    const start_time = new Date(`${slotForm.date}T${slotForm.startHour}:${slotForm.startMinute}:00`).toISOString();
    const end_time = new Date(`${slotForm.date}T${slotForm.endHour}:${slotForm.endMinute}:00`).toISOString();

    try {
      if (editingSlot) {
        await updateMeetingSlot(editingSlot.id, { start_time, end_time, is_blocked: slotForm.is_blocked, title: slotForm.title, notes: slotForm.notes } as Partial<MeetingSlot>);
        toast.success('Slot updated successfully');
      } else {
        await createMeetingSlot({ start_time, end_time, is_blocked: slotForm.is_blocked, title: slotForm.title, notes: slotForm.notes });
        toast.success('Slot created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save slot');
      console.error(err);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Delete this slot? Any linked bookings will lose their slot reference.')) return;
    try {
      await deleteMeetingSlot(id);
      toast.success('Slot deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete slot');
      console.error(err);
    }
  };

  // --------------------------------------------------------
  // Calendar grid data
  // --------------------------------------------------------
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getSlotsForDate = (date: Date) => slots.filter(s => isSameDay(s.start_time, date));
  const getBookingsForDate = (date: Date) => bookings.filter(b => isSameDay(b.start_time, date));

  // Stats
  const totalSlots = slots.length;
  const availableSlots = slots.filter(s => !s.is_blocked).length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

  // --------------------------------------------------------
  // Day detail
  // --------------------------------------------------------
  const daySlots = getSlotsForDate(selectedDate);
  const dayBookings = getBookingsForDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage availability slots and view bookings</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20 font-medium"
        >
          <FaPlus className="text-sm" /> Add Slot
        </button>
      </div>

      {/* Stats Cards — Bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Slots', value: totalSlots, color: 'bg-blue-500', icon: <FaCalendarAlt /> },
          { label: 'Available', value: availableSlots, color: 'bg-green-500', icon: <FaClock /> },
          { label: 'Pending', value: pendingBookings, color: 'bg-orange-500', icon: <FaClock /> },
          { label: 'Confirmed', value: confirmedBookings, color: 'bg-purple-500', icon: <FaCalendarAlt /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`${stat.color} text-white p-3 rounded-xl`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar + Day Detail — Bento layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Calendar header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><FaChevronLeft className="text-gray-600" /></button>
              <h2 className="text-lg font-bold text-gray-900 min-w-[180px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><FaChevronRight className="text-gray-600" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Today</button>
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-0.5">
                {(['month', 'week', 'day'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(d => (
              <div key={d} className="p-2 sm:p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] p-1 bg-gray-50/50 border-b border-r border-gray-50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentYear, currentMonth, day);
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const daySlotsList = getSlotsForDate(date);
              const dayBookingsList = getBookingsForDate(date);
              const hasBlocked = daySlotsList.some(s => s.is_blocked);
              const hasAvailable = daySlotsList.some(s => !s.is_blocked);
              const hasPending = dayBookingsList.some(b => b.status === 'pending');

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r border-gray-100 cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : 'hover:bg-gray-50'}
                    ${isToday ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full
                      ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openCreateModal(date); }}
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500 transition-opacity"
                      title="Add slot"
                    >
                      <FaPlus className="text-[10px]" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {hasAvailable && (
                      <div className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium truncate">
                        {daySlotsList.filter(s => !s.is_blocked).length} slot{daySlotsList.filter(s => !s.is_blocked).length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {hasBlocked && (
                      <div className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium truncate">
                        Blocked
                      </div>
                    )}
                    {hasPending && (
                      <div className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium truncate animate-pulse">
                        {dayBookingsList.filter(b => b.status === 'pending').length} pending
                      </div>
                    )}
                    {dayBookingsList.filter(b => b.status === 'confirmed').length > 0 && (
                      <div className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium truncate">
                        {dayBookingsList.filter(b => b.status === 'confirmed').length} confirmed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{daySlots.length} slots · {dayBookings.length} bookings</p>
          </div>

          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
                ))}
              </div>
            ) : (
              <>
                {/* Slots */}
                {daySlots.length === 0 && dayBookings.length === 0 && (
                  <div className="text-center py-8">
                    <FaCalendarAlt className="text-4xl text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No slots for this day</p>
                    <button
                      onClick={() => openCreateModal(selectedDate)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add availability
                    </button>
                  </div>
                )}

                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                      slot.is_blocked
                        ? 'border-red-200 bg-red-50 hover:border-red-300'
                        : 'border-green-200 bg-green-50 hover:border-green-300'
                    }`}
                    onClick={() => openEditModal(slot)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {slot.is_blocked ? (
                          <FaLock className="text-red-500 text-sm" />
                        ) : (
                          <FaClock className="text-green-600 text-sm" />
                        )}
                        <span className="font-semibold text-sm text-gray-900">
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                    {slot.title && <p className="text-xs text-gray-600 mt-1 font-medium">{slot.title}</p>}
                    {slot.is_blocked && <span className="text-[10px] text-red-600 font-semibold uppercase">Blocked</span>}
                  </div>
                ))}

                {/* Bookings for this day */}
                {dayBookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Bookings</h4>
                    {dayBookings.map(booking => (
                      <div key={booking.id} className={`p-3 rounded-xl border-2 mb-2 ${
                        booking.status === 'pending' ? 'border-orange-200 bg-orange-50' :
                        booking.status === 'confirmed' ? 'border-purple-200 bg-purple-50' :
                        booking.status === 'completed' ? 'border-green-200 bg-green-50' :
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900">{booking.guest_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            booking.status === 'pending' ? 'bg-orange-200 text-orange-700' :
                            booking.status === 'confirmed' ? 'bg-purple-200 text-purple-700' :
                            booking.status === 'completed' ? 'bg-green-200 text-green-700' :
                            'bg-gray-200 text-gray-700'
                          }`}>{booking.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(booking.start_time)} – {formatTime(booking.end_time)} · {booking.guest_email}
                        </p>
                        {booking.message && <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{booking.message}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingSlot ? 'Edit Slot' : 'New Availability Slot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={slotForm.date}
                  onChange={(e) => setSlotForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <div className="flex gap-1">
                    <select value={slotForm.startHour} onChange={(e) => setSlotForm(f => ({ ...f, startHour: e.target.value }))}
                      className="flex-1 px-2 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      {HOURS.map(h => <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>)}
                    </select>
                    <select value={slotForm.startMinute} onChange={(e) => setSlotForm(f => ({ ...f, startMinute: e.target.value }))}
                      className="flex-1 px-2 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <div className="flex gap-1">
                    <select value={slotForm.endHour} onChange={(e) => setSlotForm(f => ({ ...f, endHour: e.target.value }))}
                      className="flex-1 px-2 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      {HOURS.map(h => <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>)}
                    </select>
                    <select value={slotForm.endMinute} onChange={(e) => setSlotForm(f => ({ ...f, endMinute: e.target.value }))}
                      className="flex-1 px-2 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                      {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={slotForm.title}
                  onChange={(e) => setSlotForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Morning availability"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={slotForm.notes}
                  onChange={(e) => setSlotForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Internal notes..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Block toggle */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={slotForm.is_blocked}
                  onChange={(e) => setSlotForm(f => ({ ...f, is_blocked: e.target.checked }))}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Block this time</span>
                  <p className="text-xs text-gray-500">Blocked slots won&apos;t appear on the public booking page</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleSaveSlot} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm shadow-lg shadow-blue-600/20">
                {editingSlot ? 'Update' : 'Create'} Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
