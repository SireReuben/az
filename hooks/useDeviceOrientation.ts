import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

interface DeviceOrientation {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  screenType: 'phone' | 'tablet' | 'large-tablet' | 'desktop';
}

export function useDeviceOrientation(): DeviceOrientation {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  // Device classification based on screen size
  const isTablet = minDimension >= 768; // iPad mini and larger
  const isLargeTablet = minDimension >= 1024; // iPad Pro and larger
  
  let screenType: 'phone' | 'tablet' | 'large-tablet' | 'desktop';
  if (maxDimension >= 1440) {
    screenType = 'desktop';
  } else if (isLargeTablet) {
    screenType = 'large-tablet';
  } else if (isTablet) {
    screenType = 'tablet';
  } else {
    screenType = 'phone';
  }

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isLargeTablet,
    screenType,
  };
}