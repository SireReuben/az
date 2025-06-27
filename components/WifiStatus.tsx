import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';

interface WifiStatusProps {
  isConnected: boolean;
}

export function WifiStatus({ isConnected }: WifiStatusProps) {
  const pulseAnimation = useSharedValue(0);
  
  React.useEffect(() => {
    if (isConnected) {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
    } else {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [isConnected, pulseAnimation]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ 
      scale: 1 + interpolate(pulseAnimation.value, [0, 1], [0, 0.1]) 
    }],
    shadowOpacity: interpolate(pulseAnimation.value, [0, 1], [0.3, 0.8]),
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulseAnimation.value, [0, 1], [0.2, 0.6]),
    shadowRadius: interpolate(pulseAnimation.value, [0, 1], [8, 16]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.iconContainer, 
        isConnected ? styles.connected : styles.disconnected,
        animatedContainerStyle,
        {
          shadowColor: isConnected ? '#22c55e' : '#ef4444',
        }
      ]}>
        <Animated.View style={animatedIconStyle}>
          {isConnected ? (
            <Wifi size={32} color="#ffffff" />
          ) : (
            <WifiOff size={32} color="#ffffff" />
          )}
        </Animated.View>
        
        {/* Connection rings */}
        {isConnected && (
          <>
            <Animated.View style={[
              styles.connectionRing,
              styles.ring1,
              {
                opacity: interpolate(pulseAnimation.value, [0, 1], [0.3, 0.8]),
                transform: [{ 
                  scale: 1 + interpolate(pulseAnimation.value, [0, 1], [0, 0.3]) 
                }],
              }
            ]} />
            <Animated.View style={[
              styles.connectionRing,
              styles.ring2,
              {
                opacity: interpolate(pulseAnimation.value, [0, 1], [0.2, 0.6]),
                transform: [{ 
                  scale: 1 + interpolate(pulseAnimation.value, [0, 1], [0, 0.5]) 
                }],
              }
            ]} />
          </>
        )}
      </Animated.View>
      
      <Text style={styles.statusText}>
        {isConnected ? 'Connected to AEROSPIN CONTROL' : 'Establishing Connection...'}
      </Text>
      <Text style={styles.subText}>
        {isConnected ? 'Device Ready for Control' : 'Please wait...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 12,
  },
  connected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  disconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  connectionRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 50,
  },
  ring1: {
    width: 120,
    height: 120,
  },
  ring2: {
    width: 140,
    height: 140,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
  },
});