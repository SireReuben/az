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
  const width = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset width to 0
      width.value = 0;
      
      // Fade in
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
      
      // Animate width from 0% to 100% over 1.5 seconds
      width.value = withTiming(100, { duration: 1500 });
      
      // Fade out after completion
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
  }, [visible, opacity, scale, width, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#64748b';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        containerStyle,
      ]}
    >
      <View style={[
        styles.background,
        { backgroundColor: getBackgroundColor() }
      ]}>
        <Animated.View 
          style={[
            styles.progress,
            progressStyle,
            { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
          ]} 
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 6,
    borderRadius: 3,
    zIndex: 1000,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  background: {
    flex: 1,
    borderRadius: 3,
  },
  progress: {
    height: '100%',
    borderRadius: 3,
  },
});