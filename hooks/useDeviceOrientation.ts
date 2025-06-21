import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

interface DeviceOrientation {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  screenType: 'phone' | 'tablet' | 'large-tablet' | 'desktop';
  aspectRatio: number;
  isWideScreen: boolean;
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
  const aspectRatio = maxDimension / minDimension;
  
  // Enhanced device classification
  const isTablet = minDimension >= 600; // More inclusive tablet detection
  const isLargeTablet = minDimension >= 900; // Large tablets like iPad Pro
  const isWideScreen = aspectRatio > 1.6; // Wide aspect ratios
  
  let screenType: 'phone' | 'tablet' | 'large-tablet' | 'desktop';
  if (maxDimension >= 1920 || (isLandscape && maxDimension >= 1440)) {
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
    aspectRatio,
    isWideScreen,
  };
}