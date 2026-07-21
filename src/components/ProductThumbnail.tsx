import React, { useState } from 'react';

interface ProductThumbnailProps {
  name: string;
  categoryName?: string;
  size?: number;
  imageUrl?: string;
  className?: string;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  name,
  categoryName = 'Others',
  size = 40,
  imageUrl,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  // Parse category clean string
  const cleanCat = categoryName.toLowerCase().trim();

  // Pick vibrant, high-end gradient matches based on category
  let gradient = 'linear-gradient(135deg, #64748b 0%, #4f46e5 100%)'; // default Others
  let iconPath = null;

  if (cleanCat.includes('engine')) {
    // Crimson to fire orange
    gradient = 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)';
    // Piston/gear graphic
    iconPath = (
      <>
        <circle cx="12" cy="10" r="3.5" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 13.5v5.5M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 6.5V4M9.5 4h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    );
  } else if (cleanCat.includes('brake')) {
    // Carbon charcoal to dark red
    gradient = 'linear-gradient(135deg, #1e293b 0%, #dc2626 100%)';
    // Brake disc vents outline
    iconPath = (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
        <circle cx="12" cy="7.5" r="0.75" fill="currentColor" />
        <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
        <circle cx="7.5" cy="12" r="0.75" fill="currentColor" />
        <circle cx="16.5" cy="12" r="0.75" fill="currentColor" />
        <circle cx="9" cy="9" r="0.75" fill="currentColor" />
        <circle cx="15" cy="15" r="0.75" fill="currentColor" />
        <circle cx="9" cy="15" r="0.75" fill="currentColor" />
        <circle cx="15" cy="9" r="0.75" fill="currentColor" />
      </>
    );
  } else if (cleanCat.includes('suspension')) {
    // Indigo to cyan/teal fluid motion
    gradient = 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)';
    // Shock absorber spring coil
    iconPath = (
      <>
        <path d="M12 2.5v3M12 18.5v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 6h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 8.5c1.5-.75 4.5-.75 6 0M15 11c-1.5-.75-4.5-.75-6 0M9 13.5c1.5-.75 4.5-.75 6 0M15 16c-1.5-.75-4.5-.75-6 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    );
  } else if (cleanCat.includes('electrical')) {
    // Electric yellow to energy orange
    gradient = 'linear-gradient(135deg, #eab308 0%, #f97316 100%)';
    // Thunderbolt
    iconPath = (
      <path d="M13 2.5L4.5 13.5h7.5L11 21.5l8.5-11h-7.5l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" />
    );
  } else if (cleanCat.includes('filter')) {
    // Teal purification green
    gradient = 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)';
    // Mesh grid design
    iconPath = (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7.5 12h9M12 7.5v9M9 9l6 6M9 15l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="var(--bg-panel, #000)" />
      </>
    );
  } else if (cleanCat.includes('wheel')) {
    // Dark slate rubber/asphalt to dark metallic
    gradient = 'linear-gradient(135deg, #1e293b 0%, #475569 100%)';
    // Tire spokes wheel
    iconPath = (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <line x1="12" y1="3.5" x2="12" y2="20.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="3.5" y1="12" x2="20.5" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" />
        <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="1.2" />
      </>
    );
  } else if (cleanCat.includes('transmission')) {
    // Mechanical purple link to violet
    gradient = 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)';
    // Interlocking gear links
    iconPath = (
      <>
        <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="15.5" cy="15.5" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M9 4V2.5M9 15.5V14M4.5 9H3M13.5 9h-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15.5 11.5v-1M15.5 20.5v-1M12 15.5h-1M19 15.5h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    );
  } else if (cleanCat.includes('body')) {
    // Emerald shield style
    gradient = 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
    // Frame shield
    iconPath = (
      <path d="M12 20.5s7-3.5 7-9V5.5l-7-2.5-7 2.5v6c0 5.5 7 9 7 9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
    );
  } else if (cleanCat.includes('accessory') || cleanCat.includes('accessories')) {
    // Sweet pink/rose gold
    gradient = 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)';
    // Star badge
    iconPath = (
      <path d="M12 2.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.7-5.2 2.7 1-5.9-4.3-4.2 5.9-.9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
    );
  } else if (cleanCat.includes('lubricant')) {
    // Liquid oil amber golden honey
    gradient = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    // Droplet
    iconPath = (
      <path d="M12 20.5a6.5 6.5 0 006.5-6.5c0-4-6.5-12-6.5-12S5.5 10 5.5 14a6.5 6.5 0 006.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" />
    );
  } else {
    // Default wrench tool icon
    gradient = 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    iconPath = (
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    );
  }

  // Get brand/part name initials as overlay helper
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : '';

  const fallbackLogo = (
    <div 
      className={`product-thumbnail-fallback ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '12px',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}
      title={`${name} (${categoryName})`}
    >
      <svg 
        width={Math.round(size * 0.5)} 
        height={Math.round(size * 0.5)} 
        viewBox="0 0 24 24" 
        fill="none" 
        style={{ opacity: 0.9, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
      >
        {iconPath}
      </svg>
      {size >= 36 && (
        <span 
          style={{ 
            position: 'absolute', 
            bottom: '2px', 
            right: '4px', 
            fontSize: '9px', 
            fontWeight: 800, 
            opacity: 0.75, 
            letterSpacing: '0.05em' 
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );

  if (imageUrl && imageUrl !== '/parts_thumbnail.png' && !imgError) {
    return (
      <div 
        className="thumbnail-container"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-color)',
          flexShrink: 0 
        }}
      >
        <img 
          className="thumbnail-img" 
          src={imageUrl} 
          alt={name} 
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '12px'
          }}
        />
      </div>
    );
  }

  return fallbackLogo;
};
export default ProductThumbnail;
