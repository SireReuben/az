import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  padding?: boolean;
}

export function ResponsiveContainer({ 
  children, 
  style, 
  maxWidth = 1200,
  padding = true 
}: ResponsiveContainerProps) {
  const { width, isTablet, isLargeTablet, screenType } = useDeviceOrientation();

  const getContainerStyle = () => {
    const baseStyle: ViewStyle = {
      width: '100%',
      alignSelf: 'center',
    };

    // Apply max width for larger screens
    if (screenType === 'desktop' || isLargeTablet) {
      baseStyle.maxWidth = maxWidth;
    } else if (isTablet) {
      baseStyle.maxWidth = Math.min(width * 0.95, 900);
    }

    // Apply responsive padding
    if (padding) {
      if (screenType === 'desktop') {
        baseStyle.paddingHorizontal = 32;
      } else if (isLargeTablet) {
        baseStyle.paddingHorizontal = 24;
      } else if (isTablet) {
        baseStyle.paddingHorizontal = 20;
      } else {
        baseStyle.paddingHorizontal = 16;
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