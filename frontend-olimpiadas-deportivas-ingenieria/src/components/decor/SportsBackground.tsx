// No need to import React for JSX with react-jsx runtime

/**
 * Decorative overlay with floating sports emojis and gradient blobs.
 * Positioned behind main content to add playful, sporty vibe.
 */
export const SportsBackground = (): JSX.Element => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 select-none">
      {/* Gradient blobs for extra depth (light/dark aware via CSS vars) */}
      <div className="absolute left-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-[-10%] bottom-[-10%] h-[36rem] w-[36rem] rounded-full bg-secondary/10 blur-3xl" />

      {/* Floating sports icons (emojis render consistently) */}
      <div className="sports-float" style={{ left: '5%', top: '20%', fontSize: '2.25rem' }}>⚽</div>
      <div className="sports-float spin" style={{ right: '8%', top: '18%', fontSize: '2.25rem' }}>🏀</div>
      <div className="sports-float" style={{ left: '12%', bottom: '16%', fontSize: '2.25rem' }}>🏐</div>
      <div className="sports-float spin" style={{ right: '12%', bottom: '14%', fontSize: '2.25rem' }}>🥎</div>
      <div className="sports-float" style={{ left: '50%', top: '8%', fontSize: '2rem' }}>🏓</div>

      {/* Subtle diagonal stripes mask (only visible at very low opacity) */}
      <svg className="absolute inset-0 -z-10 opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="stripes" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="20" height="40" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stripes)" />
      </svg>
    </div>
  );
};

export default SportsBackground;
