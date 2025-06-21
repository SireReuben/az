import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  padding?: boolean;
  fillScreen?: boolean;
}

export function ResponsiveContainer({ 
  children, 
  style, 
  maxWidth = 1400,
  padding = true,
  fillScreen = true
}: ResponsiveContainerProps) {
  const { width, height, isTablet, isLargeTablet, screenType, isLandscape, isWideScreen } = useDeviceOrientation();

  const getContainerStyle = () => {
    const baseStyle: ViewStyle = {
      width: '100%',
      alignSelf: 'center',
    };

    // Fill screen height for landscape tablets
    if (fillScreen && isTablet && isLandscape) {
      baseStyle.minHeight = height;
    }

    // Apply max width for larger screens
    if (screenType === 'desktop') {
      baseStyle.maxWidth = maxWidth;
    } else if (isLargeTablet && isLandscape) {
      baseStyle.maxWidth = Math.min(width * 0.98, maxWidth);
    } else if (isTablet && isLandscape) {
      baseStyle.maxWidth = Math.min(width * 0.96, 1200);
    } else if (isTablet) {
      baseStyle.maxWidth = Math.min(width * 0.95, 900);
    }

    // Apply responsive padding
    if (padding) {
      if (screenType === 'desktop') {
        baseStyle.paddingHorizontal = 40;
        baseStyle.paddingVertical = 32;
      } else if (isLargeTablet) {
        baseStyle.paddingHorizontal = isLandscape ? 32 : 28;
        baseStyle.paddingVertical = isLandscape ? 24 : 28;
      } else if (isTablet) {
        baseStyle.paddingHorizontal = isLandscape ? 28 : 24;
        baseStyle.paddingVertical = isLandscape ? 20 : 24;
      } else {
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 16;
      }
    }

    return baseStyle;
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});