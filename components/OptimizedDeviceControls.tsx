import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    if (Platform.OS !== 'web') {
      runOnJS(triggerHapticFeedback)();
    }
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

  const getGradientColors = () => {
    if (disabled) {
      return ['#94a3b8', '#64748b'];
    }
    
    if (isActive) {
      switch (variant) {
        case 'primary':
          return ['#1d4ed8', '#1e40af'];
        case 'secondary':
          return ['#ea580c', '#c2410c'];
        case 'danger':
          return ['#dc2626', '#b91c1c'];
        default:
          return ['#1d4ed8', '#1e40af'];
      }
    }
    
    switch (variant) {
      case 'primary':
        return ['#3b82f6', '#2563eb'];
      case 'secondary':
        return ['#6b7280', '#4b5563'];
      case 'danger':
        return ['#ef4444', '#dc2626'];
      default:
        return ['#3b82f6', '#2563eb'];
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        style={styles.pressable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={[
            styles.button,
            isActive && styles.activeButton
          ]}
        >
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Text style={[styles.buttonText, isActive && styles.activeText]}>
            {title}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

OptimizedControl.displayName = 'OptimizedControl';

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pressable: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  activeButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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