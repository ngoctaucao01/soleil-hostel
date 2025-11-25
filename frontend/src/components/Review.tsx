import React, { useState } from 'react';
import { escapeHtml } from '../utils/security';

interface ReviewItem {
  name: string;
  content: string;
  rating: number;
}

const initialReviews: ReviewItem[] = [
  { name: 'Anna', content: 'Great place, friendly staff!', rating: 5 },
  { name: 'John', content: 'Clean rooms and good location.', rating: 4 },
];

interface ReviewProps {
  dark?: boolean;
}

const Review: React.FC<ReviewProps> = ({ dark }) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [form, setForm] = useState({ name: '', content: '', rating: 5 });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!form.content.trim()) {
      setError('Review content is required');
      return;
    }

    if (form.name.length > 255) {
      setError('Name is too long (max 255 characters)');
      return;
    }

    if (form.content.length > 1000) {
      setError('Review is too long (max 1000 characters)');
      return;
    }

    // Add review with sanitized content to prevent XSS
    setReviews([
      ...reviews,
      {
        name: escapeHtml(form.name),
        content: escapeHtml(form.content),
        rating: Number(form.rating),
      },
    ]);
    
    setForm({ name: '', content: '', rating: 5 });
    setError(null);
  };

  return (
    <div className="max-w-lg mx-auto p-1">
      <div className={
        `rounded-2xl shadow-2xl p-1 animate-fade-in ` +
        (dark
          ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
          : 'bg-gradient-to-br from-green-200 via-blue-100 to-pink-200')
      }>
        <div className={
          `rounded-2xl p-8 ` +
          (dark ? 'bg-gray-900 text-gray-100' : 'bg-white')
        }>
          <h2 className={
            `text-3xl font-extrabold mb-6 text-transparent bg-clip-text drop-shadow-lg ` +
            (dark
              ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700'
              : 'bg-gradient-to-r from-green-600 via-blue-500 to-pink-500')
          }>Reviews</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <ul className="mb-6">
            {reviews.map((r, idx) => (
              <li key={idx} className="mb-4 pb-4 border-b border-gray-200">
                <span className="font-semibold text-lg text-green-700">{r.name}</span> <span className="text-yellow-500">{'★'.repeat(r.rating)}</span><br />
                <span className="text-gray-700">{r.content}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="w-full p-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition" 
              placeholder="Your Name" 
              maxLength={255}
              required 
            />
            <textarea 
              name="content" 
              value={form.content} 
              onChange={handleChange} 
              className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition" 
              placeholder="Your Review" 
              maxLength={1000}
              rows={4}
              required 
            />
            <input 
              type="number" 
              name="rating" 
              value={form.rating} 
              min={1} 
              max={5} 
              onChange={handleChange} 
              className="w-full p-3 border-2 border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" 
              required 
            />
            <button 
              type="submit" 
              className="w-full py-3 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-green-500 via-blue-400 to-pink-500 shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Submit Review
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

export default Review;
