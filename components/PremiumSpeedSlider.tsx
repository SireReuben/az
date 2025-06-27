import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gauge, Zap } from 'lucide-react-native';
import { useOptimizedTouch } from '@/hooks/useOptimizedTouch';

interface PremiumSpeedSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const SLIDER_WIDTH = Dimensions.get('window').width - 80;
const SLIDER_HEIGHT = 60;
const THUMB_SIZE = 40;

export function PremiumSpeedSlider({
  value,
  onValueChange,
  disabled = false,
  min = 0,
  max = 100,
  step = 5,
}: PremiumSpeedSliderProps) {
  const { triggerHaptic } = useOptimizedTouch();
  
  // Animation values
  const translateX = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const isPressed = useSharedValue(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Initialize position based on value
  useEffect(() => {
    if (!isDragging) {
      const position = ((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
      translateX.value = withSpring(position, { damping: 15, stiffness: 150 });
      setLocalValue(value);
    }
  }, [value, min, max, translateX, isDragging]);

  const updateValue = useCallback((newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    setLocalValue(steppedValue);
    onValueChange(steppedValue);
  }, [onValueChange, min, max, step]);

  // Create PanResponder for handling touch gestures
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    
    onPanResponderGrant: () => {
      setIsDragging(true);
      isPressed.value = true;
      thumbScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(1, { duration: 200 });
      
      if (Platform.OS !== 'web') {
        triggerHaptic('light');
      }
    },
    
    onPanResponderMove: (_, gestureState) => {
      // Calculate new position based on drag
      const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, gestureState.moveX - 40));
      translateX.value = newPosition;
      
      // Calculate new value based on position
      const percentage = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
      const newValue = min + percentage * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      
      // Update value if changed
      if (steppedValue !== localValue) {
        setLocalValue(steppedValue);
        onValueChange(steppedValue);
        
        if (Platform.OS !== 'web') {
          triggerHaptic('light');
        }
      }
    },
    
    onPanResponderRelease: () => {
      setIsDragging(false);
      isPressed.value = false;
      thumbScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
      
      // Snap to final position
      const finalPosition = ((localValue - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
      translateX.value = withSpring(finalPosition, { damping: 15, stiffness: 150 });
      
      if (Platform.OS !== 'web') {
        triggerHaptic('medium');
      }
    },
  }), [disabled, min, max, step, localValue, onValueChange, triggerHaptic]);

  // Animated styles
  const trackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 0.5, 1],
        ['#64748b', '#3b82f6', '#ef4444']
      ),
    };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: thumbScale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: thumbScale.value },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
  }));

  const speedTextStyle = useAnimatedStyle(() => {
    const progress = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
    return {
      color: interpolateColor(
        progress,
        [0, 0.5, 1],
        ['#64748b', '#3b82f6', '#ef4444']
      ),
      transform: [{ scale: isPressed.value ? withSpring(1.1) : withSpring(1) }],
    };
  });

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Gauge size={20} color="#1e40af" />
          <Text style={styles.title}>Motor Speed Control</Text>
        </View>
        <Animated.Text style={[styles.speedValue, speedTextStyle]}>
          {localValue}%
        </Animated.Text>
      </View>

      {/* Speed Indicators */}
      <View style={styles.indicators}>
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>MIN</Text>
          <Text style={styles.indicatorValue}>{min}%</Text>
        </View>
        <View style={styles.indicator}>
          <Zap size={16} color="#f59e0b" />
          <Text style={styles.indicatorValue}>LIVE</Text>
        </View>
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>MAX</Text>
          <Text style={styles.indicatorValue}>{max}%</Text>
        </View>
      </View>

      {/* Slider Container */}
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        {/* Track Background */}
        <View style={styles.trackBackground}>
          {/* Progress Track */}
          <Animated.View style={[styles.progressTrack, progressStyle]} />
          
          {/* Track Overlay */}
          <Animated.View style={[styles.trackOverlay, trackStyle]} />
        </View>

        {/* Tick Marks */}
        <View style={styles.tickMarks}>
          {Array.from({ length: 5 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tickMark,
                { left: (i * (SLIDER_WIDTH - THUMB_SIZE)) / 4 + THUMB_SIZE / 2 - 1 }
              ]}
            />
          ))}
        </View>

        {/* Thumb Glow */}
        <Animated.View style={[styles.thumbGlow, glowStyle]} />
        
        {/* Thumb */}
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.thumbInner}
          >
            <View style={styles.thumbGrip} />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Speed Zones */}
      <View style={styles.speedZones}>
        <View style={[styles.speedZone, styles.lowZone]}>
          <Text style={styles.zoneLabel}>LOW</Text>
          <Text style={styles.zoneRange}>0-30%</Text>
        </View>
        <View style={[styles.speedZone, styles.mediumZone]}>
          <Text style={styles.zoneLabel}>MEDIUM</Text>
          <Text style={styles.zoneRange}>31-70%</Text>
        </View>
        <View style={[styles.speedZone, styles.highZone]}>
          <Text style={styles.zoneLabel}>HIGH</Text>
          <Text style={styles.zoneRange}>71-100%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
  },
  speedValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  indicator: {
    alignItems: 'center',
    gap: 4,
  },
  indicatorLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    letterSpacing: 1,
  },
  indicatorValue: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#334155',
  },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    marginBottom: 20,
    position: 'relative',
  },
  trackBackground: {
    position: 'absolute',
    top: (SLIDER_HEIGHT - 8) / 2,
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: 8,
    backgroundColor: 'rgba(203, 213, 225, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
    borderRadius: 4,
  },
  trackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: 4,
    opacity: 0.3,
  },
  tickMarks: {
    position: 'absolute',
    top: (SLIDER_HEIGHT - 8) / 2 - 4,
    left: 0,
    right: 0,
    height: 16,
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.6)',
    borderRadius: 1,
  },
  thumbGlow: {
    position: 'absolute',
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE + 20,
    height: THUMB_SIZE + 20,
    marginLeft: -10,
    marginTop: -10,
    borderRadius: (THUMB_SIZE + 20) / 2,
    backgroundColor: '#3b82f6',
    opacity: 0,
  },
  thumb: {
    position: 'absolute',
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  thumbInner: {
    flex: 1,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGrip: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  speedZones: {
    flexDirection: 'row',
    gap: 8,
  },
  speedZone: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  lowZone: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  mediumZone: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  highZone: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  zoneLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#334155',
    letterSpacing: 0.5,
  },
  zoneRange: {
    fontSize: 8,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 2,
  },
});