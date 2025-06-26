import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TouchConfig {
  hapticFeedback?: boolean;
  debounceMs?: number;
  longPressMs?: number;
}

export function useOptimizedTouch(config: TouchConfig = {}) {
  const {
    hapticFeedback = true,
    debounceMs = 100,
    longPressMs = 500
  } = config;

  const lastTouchTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (Platform.OS !== 'web' && hapticFeedback) {
      const feedbackType = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      
      Haptics.impactAsync(feedbackType[intensity]);
    }
  }, [hapticFeedback]);

  const createOptimizedHandler = useCallback((
    handler: () => void,
    options: { haptic?: 'light' | 'medium' | 'heavy'; debounce?: boolean } = {}
  ) => {
    return () => {
      const now = Date.now();
      
      // Debounce protection
      if (options.debounce !== false && now - lastTouchTime.current < debounceMs) {
        return;
      }
      
      lastTouchTime.current = now;
      
      // Trigger haptic feedback
      if (options.haptic) {
        triggerHaptic(options.haptic);
      }
      
      // Execute handler
      handler();
    };
  }, [debounceMs, triggerHaptic]);

  const createLongPressHandler = useCallback((
    handler: () => void,
    onLongPress: () => void
  ) => {
    const onPressIn = () => {
      longPressTimer.current = setTimeout(() => {
        triggerHaptic('heavy');
        onLongPress();
      }, longPressMs);
    };

    const onPressOut = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const onPress = createOptimizedHandler(handler, { haptic: 'medium' });

    return { onPress, onPressIn, onPressOut };
  }, [createOptimizedHandler, longPressMs, triggerHaptic]);

  return {
    createOptimizedHandler,
    createLongPressHandler,
    triggerHaptic,
  };
}