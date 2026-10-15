'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ZoomContextType {
  isFullWidth: boolean;
  toggleFullWidth: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const ZoomContext = createContext<ZoomContextType>({
  isFullWidth: true,
  toggleFullWidth: () => {},
  isFullscreen: false,
  toggleFullscreen: () => {},
});

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [isFullWidth, setIsFullWidth] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      // Clear any artificial CSS zoom override so browser native zoom is used
      (document.documentElement.style as any).zoom = '';
      localStorage.removeItem('social_tracking_zoom');

      const savedFullWidth = localStorage.getItem('social_tracking_full_width');
      if (savedFullWidth !== null) {
        setIsFullWidth(savedFullWidth === 'true');
      }
    } catch (e) {
      console.warn('Could not read layout preferences from localStorage', e);
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('social_tracking_full_width', String(isFullWidth));
    } catch (e) {
      console.warn('Failed to save full width preference', e);
    }
  }, [isFullWidth, mounted]);

  const toggleFullWidth = () => {
    setIsFullWidth((prev) => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Error attempting to exit fullscreen:', err);
        });
      }
    }
  };

  return (
    <ZoomContext.Provider
      value={{
        isFullWidth,
        toggleFullWidth,
        isFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
}

export const useZoom = () => useContext(ZoomContext);
