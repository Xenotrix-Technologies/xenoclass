import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4'
    : `flex flex-col items-center justify-center p-6 ${className}`;

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Animated breathing / glow ring */}
        <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
        
        {/* Loading Image */}
        <img
          src="/assets/images/xenoclass_loading.png"
          alt="Loading..."
          className={`${sizeMap[size]} object-contain animate-pulse relative z-10`}
          onError={(e: any) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/images/xenoclass_logo.png';
          }}
        />
      </div>

      {message && (
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wide animate-pulse text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
