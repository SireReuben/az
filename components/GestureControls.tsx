import React, { useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface GestureControlsProps {
  onSpeedChange: (speed: number) => void;
  currentSpeed: number;
  disabled?: boolean;
}

export function GestureControls({ 
  onSpeedChange, 
  currentSpeed, 
  disabled = false 
}: GestureControlsProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const updateSpeed = useCallback((newSpeed: number) => {
    const clampedSpeed = Math.max(0, Math.min(100, newSpeed));
    onSpeedChange(clampedSpeed);
  }, [onSpeedChange]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      
      // Calculate speed based on gesture
      const speedDelta = Math.round(event.translationX / 3);
      const newSpeed = currentSpeed + speedDelta;
      
      runOnJS(updateSpeed)(newSpeed);
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Speed Control (Swipe)</Text>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.gestureArea, animatedStyle]}>
          <View style={styles.speedIndicator}>
            <Text style={styles.speedText}>{currentSpeed}%</Text>
          </View>
        </Animated.View>
      </GestureDetector>
      <Text style={styles.instruction}>
        Swipe left/right to adjust speed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 16,
  },
  gestureArea: {
    width: 200,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  speedIndicator: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  instruction: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 8,
  },
});