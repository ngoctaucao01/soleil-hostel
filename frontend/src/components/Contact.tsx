import React, { useState } from 'react';
import api from '../services/api';
import { escapeHtml, isValidEmail } from '../utils/security';

interface ContactProps {
  dark?: boolean;
}

const Contact: React.FC<ContactProps> = ({ dark }) => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!form.name.trim() || form.name.length > 255) {
      setError('Name is required and must be less than 255 characters');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Valid email is required');
      return;
    }

    if (!form.message.trim() || form.message.length > 5000) {
      setError('Message cannot be empty and must be less than 5000 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/contact', {
        name: escapeHtml(form.name),
        email: escapeHtml(form.email),
        message: escapeHtml(form.message),
      });

      setSuccess(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to send message';
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
          : 'bg-gradient-to-br from-yellow-300 via-pink-200 to-blue-200')
      }>
        <div className={
          `rounded-2xl p-8 ` +
          (dark ? 'bg-gray-900 text-gray-100' : 'bg-white')
        }>
          <h2 className={
            `text-3xl font-extrabold mb-6 text-transparent bg-clip-text drop-shadow-lg ` +
            (dark
              ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700'
              : 'bg-gradient-to-r from-yellow-600 via-pink-500 to-blue-500')
          }>Contact Us</h2>
          <div className="mb-6 text-gray-700">
            <p><strong>Address:</strong> 123 Soleil Hostel St, City</p>
            <p><strong>Phone:</strong> 0123 456 789</p>
            <p><strong>Email:</strong> contact@soleilhostel.com</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-500 rounded-lg text-green-700 text-sm">
              ✓ Message sent successfully! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="w-full p-3 border-2 border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" 
              placeholder="Your Name" 
              required 
            />
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              className="w-full p-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition" 
              placeholder="Email" 
              required 
            />
            <textarea 
              name="message" 
              value={form.message} 
              onChange={handleChange} 
              className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" 
              placeholder="Your Message" 
              rows={4}
              required 
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-yellow-500 via-pink-400 to-blue-500 shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
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

export default Contact;
