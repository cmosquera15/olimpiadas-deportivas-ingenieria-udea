import React from 'react';

interface AnimatedGradientProps {
  className?: string;
}

/**
 * Animated gradient background component
 */
export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] animate-gradient-spin rounded-full bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 blur-3xl" />
    </div>
  );
};
