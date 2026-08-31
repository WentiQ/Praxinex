import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, onLoadingComplete }) => {
  const [shouldRender, setShouldRender] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        const hideTimer = setTimeout(() => {
          setShouldRender(false);
          if (onLoadingComplete) onLoadingComplete();
        }, 650);
        return () => clearTimeout(hideTimer);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isLoading, onLoadingComplete]);

  if (!shouldRender) return null;

  return (
    <div
      id="praxinex-loading-splash"
      className={`fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-black select-none transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Clean Fullscreen Edge-to-Edge Image */}
      <img
        src="/loading_page.png"
        alt="Praxinex — AI Revenue Recovery"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/praxinex_splash.png';
        }}
      />
    </div>
  );
};

