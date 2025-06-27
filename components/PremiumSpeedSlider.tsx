import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gauge, Zap, Minus, Plus } from 'lucide-react-native';
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
  const [localValue, setLocalValue] = useState(value);
  const [thumbPosition, setThumbPosition] = useState(0);
  
  // Initialize position based on value
  useEffect(() => {
    const position = ((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
    setThumbPosition(position);
    setLocalValue(value);
  }, [value, min, max]);

  // Handle slider touch
  const handleSliderTouch = useCallback((event: any) => {
    if (disabled) return;
    
    const { locationX } = event.nativeEvent;
    const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, locationX - THUMB_SIZE / 2));
    setThumbPosition(newPosition);
    
    // Calculate new value
    const percentage = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
    const newValue = min + percentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    
    setLocalValue(steppedValue);
    onValueChange(steppedValue);
    triggerHaptic('light');
  }, [disabled, min, max, step, onValueChange, triggerHaptic]);

  // Increment/decrement value
  const adjustValue = useCallback((increment: boolean) => {
    if (disabled) return;
    
    const delta = increment ? step : -step;
    const newValue = Math.max(min, Math.min(max, localValue + delta));
    
    setLocalValue(newValue);
    onValueChange(newValue);
    
    // Update thumb position
    const newPosition = ((newValue - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
    setThumbPosition(newPosition);
    
    triggerHaptic('light');
  }, [disabled, localValue, min, max, step, onValueChange, triggerHaptic]);

  // Get color based on value
  const getValueColor = () => {
    const percentage = (localValue - min) / (max - min);
    if (percentage < 0.3) return '#64748b';
    if (percentage < 0.7) return '#3b82f6';
    return '#ef4444';
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Gauge size={20} color="#1e40af" />
          <Text style={styles.title}>Motor Speed Control</Text>
        </View>
        <Text style={[styles.speedValue, { color: getValueColor() }]}>
          {localValue}%
        </Text>
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
      <View style={styles.sliderContainer}>
        {/* Track Background */}
        <View style={styles.trackBackground}>
          {/* Progress Track */}
          <View 
            style={[
              styles.progressTrack, 
              { width: thumbPosition + THUMB_SIZE / 2 }
            ]} 
          />
          
          {/* Track Overlay */}
          <LinearGradient
            colors={['#64748b', '#3b82f6', '#ef4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trackOverlay}
          />
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

        {/* Interactive Area */}
        <View 
          style={styles.touchArea}
          onStartShouldSetResponder={() => !disabled}
          onResponderGrant={(e) => {
            handleSliderTouch(e);
            triggerHaptic('medium');
          }}
          onResponderMove={handleSliderTouch}
          onResponderRelease={() => triggerHaptic('medium')}
        >
          {/* Thumb */}
          <View 
            style={[
              styles.thumb,
              { left: thumbPosition }
            ]}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.thumbInner}
            >
              <View style={styles.thumbGrip} />
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Speed Controls */}
      <View style={styles.speedControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => adjustValue(false)}
          disabled={disabled || localValue <= min}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#64748b', '#475569']}
            style={[
              styles.controlButtonGradient,
              (disabled || localValue <= min) && styles.disabledButton
            ]}
          >
            <Minus size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.speedDisplay}>
          <Text style={styles.speedDisplayText}>{localValue}%</Text>
        </View>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => adjustValue(true)}
          disabled={disabled || localValue >= max}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#64748b', '#475569']}
            style={[
              styles.controlButtonGradient,
              (disabled || localValue >= max) && styles.disabledButton
            ]}
          >
            <Plus size={20} color="#ffffff" />
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
    zIndex: 1,
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
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLIDER_HEIGHT,
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
  speedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  controlButton: {
    borderRadius: 8,
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
  disabledButton: {
    opacity: 0.5,
  },
  speedDisplay: {
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  speedDisplayText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#0f172a',
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