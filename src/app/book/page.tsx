'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaEnvelope, FaPhone, FaCommentDots, FaCheckCircle, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import { getAvailableSlots, createBooking } from '@/lib/dataService';
import { MeetingSlot } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function BookMeetingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: pick date, 2: pick slot & fill info, 3: success
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Slots with available dates for highlighting on calendar
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // Fetch available dates for the current month (for calendar highlighting)
  useEffect(() => {
    async function fetchMonthSlots() {
      const from = new Date(currentYear, currentMonth, 1).toISOString();
      const to = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
      const { data } = await getAvailableSlots(undefined, from, to);
      const dates = new Set<string>();
      data.forEach((s: MeetingSlot) => {
        dates.add(new Date(s.start_time).toDateString());
      });
      setAvailableDates(dates);
    }
    fetchMonthSlots();
  }, [currentMonth, currentYear]);

  // Fetch slots for selected date
  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data } = await getAvailableSlots(dateStr);
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Real-time: refresh slots when bookings change
  useEffect(() => {
    if (!selectedDate) return;
    const channel = supabase
      .channel('booking-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchSlots();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_slots' }, () => {
        fetchSlots();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedDate, fetchSlots]);

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (date < new Date(new Date().toDateString())) return; // no past dates
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(2);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!selectedSlot) e.slot = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedSlot) return;
    setSubmitting(true);
    try {
      await createBooking({
        slot_id: selectedSlot.id,
        guest_name: form.name.trim(),
        guest_email: form.email.trim(),
        guest_phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
      });
      setStep(3);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Booking failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();
  const calendarDays = getCalendarDays(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // Success screen
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-green-600 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted!</h2>
          <p className="text-gray-600 mb-2">
            Your meeting request for <strong>{selectedDate && formatDate(selectedDate)}</strong> at{' '}
            <strong>{selectedSlot && formatTime(selectedSlot.start_time)}</strong> has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ll review your request and send a confirmation to <strong>{form.email}</strong>.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep(1); setSelectedDate(null); setSelectedSlot(null); setForm({ name: '', email: '', phone: '', message: '' }); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Book Another
            </button>
            <Link href="/" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Book a Meeting</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Schedule a consultation with our real estate experts. Pick a date, choose a time, and we&apos;ll take care of the rest.
          </p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="max-w-3xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-center gap-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            <span className="text-sm font-medium hidden sm:inline">Select Date</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            <span className="text-sm font-medium hidden sm:inline">Choose Slot & Details</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
            <span className="text-sm font-medium hidden sm:inline">Confirmed</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FaChevronLeft className="text-gray-600" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">{monthName}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FaChevronRight className="text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const date = new Date(currentYear, currentMonth, day);
                const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const hasSlots = availableDates.has(date.toDateString());

                return (
                  <button
                    key={day}
                    onClick={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                      ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}
                      ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-600' : ''}
                      ${isToday && !isSelected ? 'border-2 border-blue-400' : ''}
                    `}
                  >
                    {day}
                    {hasSlots && !isSelected && !isPast && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full" /> Available slots</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 border-2 border-blue-400 rounded-full" /> Today</span>
            </div>
          </div>

          {/* Right panel: Slot selection + Form */}
          <div className="space-y-6">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <FaCalendarAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Select a date from the calendar</p>
                <p className="text-sm text-gray-500 mt-1">Green dots indicate dates with available slots</p>
              </div>
            )}

            {step === 2 && selectedDate && (
              <>
                {/* Selected date info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Selected Date</p>
                      <p className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</p>
                    </div>
                    <button onClick={() => { setStep(1); setSelectedSlot(null); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Change
                    </button>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaClock className="text-blue-600" /> Available Times
                  </h3>
                  {loadingSlots ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">No available slots for this date. Please try another day.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border
                            ${selectedSlot?.id === slot.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                        >
                          {formatTime(slot.start_time)}
                          {slot.title && (
                            <span className="block text-[10px] opacity-75 mt-0.5 truncate">{slot.title}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.slot && <p className="text-red-500 text-xs mt-2">{errors.slot}</p>}
                </div>

                {/* Booking Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FaUser className="text-blue-600" /> Your Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        placeholder="+880 1234-567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                    <div className="relative">
                      <FaCommentDots className="absolute left-3 top-3 text-gray-400 text-sm" />
                      <textarea
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                        placeholder="Any specific topics you'd like to discuss?"
                      />
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{errors.submit}</div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !selectedSlot}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    {submitting ? (
                      <><FaSpinner className="animate-spin" /> Booking...</>
                    ) : (
                      <><FaCalendarAlt /> Confirm Booking</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
