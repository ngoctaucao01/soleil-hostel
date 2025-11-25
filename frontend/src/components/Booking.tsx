import React, { useState } from 'react';
import api from '../services/api';
import { escapeHtml, isValidEmail } from '../utils/security';

interface BookingProps {
  dark?: boolean;
}

const Booking: React.FC<BookingProps> = ({ dark }) => {
  const [form, setForm] = useState({
    room_id: '',
    check_in: '',
    check_out: '',
    guests: 1,
    guest_name: '',
    guest_email: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in first to make a booking');
      return;
    }

    // Validation
    if (!form.room_id) {
      setError('Please select a room');
      return;
    }

    const checkInDate = new Date(form.check_in);
    const checkOutDate = new Date(form.check_out);

    if (checkInDate >= checkOutDate) {
      setError('Check-out date must be after check-in date');
      return;
    }

    if (!form.guest_name.trim() || form.guest_name.length > 255) {
      setError('Name is required and must be less than 255 characters');
      return;
    }

    if (!isValidEmail(form.guest_email)) {
      setError('Valid email is required');
      return;
    }

    setLoading(true);

    try {
      await api.post('/bookings', {
        room_id: parseInt(form.room_id),
        check_in: form.check_in,
        check_out: form.check_out,
        guest_name: escapeHtml(form.guest_name),
        guest_email: escapeHtml(form.guest_email),
      });

      setSuccess(true);
      setForm({
        room_id: '',
        check_in: '',
        check_out: '',
        guests: 1,
        guest_name: '',
        guest_email: '',
        phone: ''
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to create booking';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-1">
      <div className={
        `rounded-2xl shadow-2xl p-1 animate-fade-in ` +
        (dark
          ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
          : 'bg-gradient-to-br from-blue-400 via-yellow-200 to-pink-300')
      }>
        <div className={
          `rounded-2xl p-8 ` +
          (dark ? 'bg-gray-900 text-gray-100' : 'bg-white')
        }>
          <h2 className={
            `text-3xl font-extrabold mb-6 text-transparent bg-clip-text drop-shadow-lg ` +
            (dark
              ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700'
              : 'bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500')
          }>Book a Room</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-500 rounded-lg text-green-700 text-sm">
              ✓ Booking created successfully! Check your email for confirmation.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <select name="room_id" value={form.room_id} onChange={handleChange} className={
              `w-full p-3 border-2 rounded-lg focus:outline-none transition ` +
              (dark ? 'border-gray-700 focus:ring-2 focus:ring-gray-500 bg-gray-800 text-gray-100' : 'border-blue-200 focus:ring-2 focus:ring-blue-400')
            } required>
              <option value="">Select Room</option>
              <option value="1">Single Room - $50/night</option>
              <option value="2">Double Room - $75/night</option>
              <option value="3">Suite - $120/night</option>
            </select>
            <div className="flex gap-4">
              <input type="date" name="check_in" value={form.check_in} onChange={handleChange} className={
                `w-1/2 p-3 border-2 rounded-lg focus:outline-none transition ` +
                (dark ? 'border-gray-700 focus:ring-2 focus:ring-gray-500 bg-gray-800 text-gray-100' : 'border-yellow-200 focus:ring-2 focus:ring-yellow-400')
              } required />
              <input type="date" name="check_out" value={form.check_out} onChange={handleChange} className={
                `w-1/2 p-3 border-2 rounded-lg focus:outline-none transition ` +
                (dark ? 'border-gray-700 focus:ring-2 focus:ring-gray-500 bg-gray-800 text-gray-100' : 'border-pink-200 focus:ring-2 focus:ring-pink-400')
              } required />
            </div>
            <input type="text" name="guest_name" value={form.guest_name} onChange={handleChange} className={
              `w-full p-3 border-2 rounded-lg focus:outline-none transition ` +
              (dark ? 'border-gray-700 focus:ring-2 focus:ring-gray-500 bg-gray-800 text-gray-100' : 'border-yellow-200 focus:ring-2 focus:ring-yellow-400')
            } placeholder="Your Name" required />
            <input type="email" name="guest_email" value={form.guest_email} onChange={handleChange} className={
              `w-full p-3 border-2 rounded-lg focus:outline-none transition ` +
              (dark ? 'border-gray-700 focus:ring-2 focus:ring-gray-500 bg-gray-800 text-gray-100' : 'border-pink-200 focus:ring-2 focus:ring-pink-400')
            } placeholder="Email" required />
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={
              `w-full p-3 border-2 rounded-lg focus:outline-none transition ` +
              (dark ? 'border-gray-700 focus:ring-2 focus:ring-gray-500 bg-gray-800 text-gray-100' : 'border-blue-200 focus:ring-2 focus:ring-blue-400')
            } placeholder="Phone (optional)" />
            <button 
              type="submit" 
              disabled={loading}
              className={
                `w-full py-3 rounded-lg font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed ` +
                (dark
                  ? 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-900 text-yellow-300'
                  : 'bg-gradient-to-r from-blue-500 via-yellow-400 to-pink-500 text-white')
              }>
              {loading ? 'Booking...' : 'Book Now'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease; }
      `}</style>
    </div>
  );
};

export default Booking;
