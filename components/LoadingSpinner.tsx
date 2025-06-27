import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  isVisible: boolean;
}

export function LoadingSpinner({ isVisible }: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isVisible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
      scale.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      scale.value = 1;
    }
  }, [isVisible, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
    opacity: interpolate(scale.value, [1, 1.1], [0.8, 1]),
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, animatedStyle]}>
        <View style={styles.innerRing} />
        <View style={styles.outerRing} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  spinner: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  innerRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#3b82f6',
    borderRadius: 25,
  },
  outerRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 25,
  },
});