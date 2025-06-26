import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface VisualFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onComplete?: () => void;
}

export function VisualFeedback({ type, visible, onComplete }: VisualFeedbackProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0, { duration: 200 }))
      );
      scale.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0.8, { duration: 200 }))
      );

      const timer = setTimeout(() => {
        onComplete?.();
      }, 1900);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, scale, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle,
        { backgroundColor: getBackgroundColor() }
      ]}
    >
      <View style={styles.indicator} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: '50%',
    marginLeft: -50,
    width: 100,
    height: 4,
    borderRadius: 2,
    zIndex: 1000,
  },
  indicator: {
    flex: 1,
    borderRadius: 2,
  },
});