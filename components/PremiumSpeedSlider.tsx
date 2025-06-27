import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { Gauge, Zap, Minus, Plus } from 'lucide-react-native';
import { useOptimizedTouch } from '@/hooks/useOptimizedTouch';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

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
  const { isTablet } = useDeviceOrientation();
  
  // Animation values
  const translateX = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const isPressed = useSharedValue(false);
  const [sliderValue, setSliderValue] = useState(value);

  // Initialize position based on value
  useEffect(() => {
    const position = ((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
    translateX.value = withSpring(position, { damping: 15, stiffness: 150 });
    setSliderValue(value);
  }, [value, min, max, translateX]);

  const updateValue = useCallback((newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    setSliderValue(steppedValue);
  }, [min, max, step]);

  const confirmValueChange = useCallback((newValue: number) => {
    Alert.alert(
      'Confirm Speed Change',
      `Set motor speed to ${newValue}%?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => onValueChange(newValue)
        },
      ]
    );
  }, [onValueChange]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      isPressed.value = true;
      thumbScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(1, { duration: 200 });
      if (Platform.OS !== 'web') {
        runOnJS(triggerHaptic)('light');
      }
    })
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, event.translationX + translateX.value));
      translateX.value = newPosition;
      
      // Calculate new value
      const percentage = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
      const newValue = min + percentage * (max - min);
      
      // Trigger haptic feedback on value change
      const steppedValue = Math.round(newValue / step) * step;
      if (Math.abs(steppedValue - sliderValue) >= step) {
        if (Platform.OS !== 'web') {
          runOnJS(triggerHaptic)('light');
        }
        runOnJS(updateValue)(steppedValue);
      }
    })
    .onEnd(() => {
      isPressed.value = false;
      thumbScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
      
      // Snap to final position
      const finalPosition = ((sliderValue - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
      translateX.value = withSpring(finalPosition, { damping: 15, stiffness: 150 });
      
      if (Platform.OS !== 'web') {
        runOnJS(triggerHaptic)('medium');
      }
      runOnJS(confirmValueChange)(sliderValue);
    });

  // Handle increment/decrement buttons
  const handleIncrement = useCallback(() => {
    if (disabled || sliderValue >= max) return;
    
    const newValue = Math.min(max, sliderValue + step);
    setSliderValue(newValue);
    
    // Update slider position
    const newPosition = ((newValue - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
    translateX.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
    
    if (Platform.OS !== 'web') {
      triggerHaptic('light');
    }
    
    confirmValueChange(newValue);
  }, [disabled, sliderValue, max, step, min, translateX, triggerHaptic, confirmValueChange]);

  const handleDecrement = useCallback(() => {
    if (disabled || sliderValue <= min) return;
    
    const newValue = Math.max(min, sliderValue - step);
    setSliderValue(newValue);
    
    // Update slider position
    const newPosition = ((newValue - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
    translateX.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
    
    if (Platform.OS !== 'web') {
      triggerHaptic('light');
    }
    
    confirmValueChange(newValue);
  }, [disabled, sliderValue, min, step, max, translateX, triggerHaptic, confirmValueChange]);

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

  // Get color based on value
  const getValueColor = () => {
    const percentage = (sliderValue - min) / (max - min);
    if (percentage < 0.3) return ['#64748b', '#475569'];
    if (percentage < 0.7) return ['#3b82f6', '#2563eb'];
    return ['#ef4444', '#dc2626'];
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Gauge size={isTablet ? 24 : 20} color="#1e40af" />
          <Text style={[styles.title, isTablet && styles.tabletTitle]}>Motor Speed Control</Text>
        </View>
        <Animated.Text style={[styles.speedValue, isTablet && styles.tabletSpeedValue, speedTextStyle]}>
          {sliderValue}%
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
      <View style={[styles.sliderContainer, isTablet && styles.tabletSliderContainer]}>
        {/* Track Background */}
        <View style={[styles.trackBackground, isTablet && styles.tabletTrackBackground]}>
          {/* Progress Track */}
          <Animated.View style={[styles.progressTrack, progressStyle, isTablet && styles.tabletProgressTrack]} />
          
          {/* Track Overlay */}
          <Animated.View style={[styles.trackOverlay, trackStyle, isTablet && styles.tabletTrackOverlay]} />
        </View>

        {/* Tick Marks */}
        <View style={styles.tickMarks}>
          {Array.from({ length: 5 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tickMark,
                isTablet && styles.tabletTickMark,
                { left: (i * (SLIDER_WIDTH - THUMB_SIZE)) / 4 + THUMB_SIZE / 2 - 1 }
              ]}
            />
          ))}
        </View>

        {/* Gesture Detector */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.gestureArea}>
            {/* Thumb Glow */}
            <Animated.View style={[styles.thumbGlow, isTablet && styles.tabletThumbGlow, glowStyle]} />
            
            {/* Thumb */}
            <Animated.View style={[styles.thumb, isTablet && styles.tabletThumb, thumbStyle]}>
              <LinearGradient
                colors={getValueColor()}
                style={styles.thumbInner}
              >
                <View style={styles.thumbGrip} />
              </LinearGradient>
            </Animated.View>
          </View>
        </GestureDetector>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={[styles.controlButton, (disabled || sliderValue <= min) && styles.disabledButton]}
          onPress={handleDecrement}
          disabled={disabled || sliderValue <= min}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#64748b', '#475569']}
            style={styles.controlButtonGradient}
          >
            <Minus size={isTablet ? 24 : 20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.valueDisplay}>
          <LinearGradient
            colors={getValueColor()}
            style={styles.valueDisplayGradient}
          >
            <Text style={styles.valueDisplayText}>{sliderValue}%</Text>
          </LinearGradient>
        </View>
        
        <TouchableOpacity
          style={[styles.controlButton, (disabled || sliderValue >= max) && styles.disabledButton]}
          onPress={handleIncrement}
          disabled={disabled || sliderValue >= max}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#64748b', '#475569']}
            style={styles.controlButtonGradient}
          >
            <Plus size={isTablet ? 24 : 20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
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

      {/* Quick Preset Buttons */}
      <View style={styles.presetContainer}>
        <Text style={styles.presetTitle}>Quick Presets</Text>
        <View style={styles.presetButtons}>
          {[0, 25, 50, 75, 100].map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                sliderValue === preset && styles.activePresetButton,
                disabled && styles.disabledButton
              ]}
              onPress={() => {
                if (disabled) return;
                
                setSliderValue(preset);
                const newPosition = ((preset - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
                translateX.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
                
                if (Platform.OS !== 'web') {
                  triggerHaptic('medium');
                }
                
                confirmValueChange(preset);
              }}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={sliderValue === preset ? ['#3b82f6', '#1d4ed8'] : ['#f8fafc', '#f1f5f9']}
                style={styles.presetButtonGradient}
              >
                <Text style={[
                  styles.presetButtonText,
                  sliderValue === preset && styles.activePresetButtonText
                ]}>
                  {preset}%
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
  tabletTitle: {
    fontSize: 22,
  },
  speedValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
  },
  tabletSpeedValue: {
    fontSize: 40,
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
  tabletSliderContainer: {
    height: SLIDER_HEIGHT + 20,
    marginBottom: 30,
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
  tabletTrackBackground: {
    top: (SLIDER_HEIGHT + 20 - 12) / 2,
    height: 12,
    borderRadius: 6,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
    borderRadius: 4,
    zIndex: 1,
  },
  tabletProgressTrack: {
    borderRadius: 6,
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
  tabletTrackOverlay: {
    borderRadius: 6,
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
  tabletTickMark: {
    width: 3,
    height: 24,
  },
  gestureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLIDER_HEIGHT,
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
  tabletThumbGlow: {
    width: THUMB_SIZE + 30,
    height: THUMB_SIZE + 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: (THUMB_SIZE + 30) / 2,
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
  tabletThumb: {
    width: THUMB_SIZE + 10,
    height: THUMB_SIZE + 10,
    borderRadius: (THUMB_SIZE + 10) / 2,
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
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  controlButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueDisplay: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  valueDisplayGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  valueDisplayText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  speedZones: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
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
  presetContainer: {
    marginTop: 8,
  },
  presetTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#334155',
    marginBottom: 12,
    textAlign: 'center',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  presetButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePresetButton: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  presetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#334155',
  },
  activePresetButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
});