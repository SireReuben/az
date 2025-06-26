import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface OptimizedControlProps {
  onPress: () => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

const OptimizedControl = memo(({ 
  onPress, 
  title, 
  icon, 
  isActive = false, 
  disabled = false,
  variant = 'primary' 
}: OptimizedControlProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHapticFeedback = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    runOnJS(triggerHapticFeedback)();
  }, [scale, triggerHapticFeedback]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [onPress, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const buttonStyle = useMemo(() => [
    styles.controlButton,
    styles[variant],
    isActive && styles.active,
    disabled && styles.disabled,
  ], [variant, isActive, disabled]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={buttonStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={[styles.buttonText, isActive && styles.activeText]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

OptimizedControl.displayName = 'OptimizedControl';

const styles = StyleSheet.create({
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primary: {
    backgroundColor: '#3b82f6',
  },
  secondary: {
    backgroundColor: '#6b7280',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  active: {
    backgroundColor: '#1e40af',
  },
  disabled: {
    backgroundColor: '#9ca3af',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  activeText: {
    fontFamily: 'Inter-Bold',
  },
});

export default OptimizedControl;