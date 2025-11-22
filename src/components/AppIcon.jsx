import React from 'react';

/**
 * Componente para mostrar el ícono de una aplicación
 * Soporta emojis, URLs de imágenes, o genera un ícono basado en categoría
 */
export default function AppIcon({ src, alt, slug, category, size = 'md' }) {
  // Mapeo de tamaños
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-20 h-20 text-4xl'
  };

  // Colores por categoría
  const categoryColors = {
    games: 'from-purple-500 to-pink-500',
    social: 'from-blue-500 to-cyan-500',
    finance: 'from-green-500 to-emerald-500',
    productivity: 'from-orange-500 to-yellow-500',
    utilities: 'from-gray-500 to-slate-500',
    entertainment: 'from-red-500 to-pink-500',
    default: 'from-indigo-500 to-purple-500'
  };

  // Emojis por defecto según categoría
  const categoryEmojis = {
    games: '🎮',
    social: '💬',
    finance: '💰',
    productivity: '📊',
    utilities: '🔧',
    entertainment: '🎬',
    default: '📱'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const bgColor = categoryColors[category] || categoryColors.default;
  const defaultEmoji = categoryEmojis[category] || categoryEmojis.default;

  // Si es un emoji (1-2 caracteres unicode)
  const isEmoji = src && src.length <= 4 && /[\p{Emoji}]/u.test(src);

  // Si es una URL de imagen
  const isImageUrl = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('ipfs://') || src.startsWith('/'));

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-xl bg-gradient-to-br ${bgColor} flex-shrink-0 overflow-hidden`}>
      {isImageUrl ? (
        <img 
          src={src.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
          alt={alt || slug} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback si la imagen no carga
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<span class="text-white">${defaultEmoji}</span>`;
          }}
        />
      ) : (
        <span className="text-white">
          {isEmoji ? src : defaultEmoji}
        </span>
      )}
    </div>
  );
}
