import React from 'react';

const images = [
  '/assets/gallery1.jpg',
  '/assets/gallery2.jpg',
  '/assets/gallery3.jpg',
  '/assets/gallery4.jpg',
];


interface GalleryProps {
  dark?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ dark }) => {
  return (
    <div className="max-w-4xl mx-auto p-1">
      <div className={
        `rounded-2xl shadow-2xl p-1 animate-fade-in ` +
        (dark
          ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
          : 'bg-gradient-to-br from-pink-200 via-blue-100 to-yellow-200')
      }>
        <div className={
          `rounded-2xl p-8 ` +
          (dark ? 'bg-gray-900 text-gray-100' : 'bg-white')
        }>
          <h2 className={
            `text-3xl font-extrabold mb-6 text-transparent bg-clip-text drop-shadow-lg ` +
            (dark
              ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700'
              : 'bg-gradient-to-r from-pink-600 via-blue-500 to-yellow-500')
          }>Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {images.map((src, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-blue-100 via-yellow-50 to-pink-100">
                <img
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-32 object-cover rounded-xl hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    // If the local asset isn't found (404), replace with a placeholder image so the page still looks OK in dev.
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.dataset.fallback) {
                      img.dataset.fallback = '1';
                      img.src = `https://via.placeholder.com/600x400?text=Gallery+${idx + 1}`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease; }
      `}</style>
    </div>
  );
};

export default Gallery;
