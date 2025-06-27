import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';

export function StatusHeader() {
  const { isTablet } = useDeviceOrientation();
  
  // Subtle glow animation
  const glowAnimation = useSharedValue(0);
  
  React.useEffect(() => {
    glowAnimation.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, [glowAnimation]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnimation.value, [0, 1], [0.1, 0.3]),
    shadowRadius: interpolate(glowAnimation.value, [0, 1], [8, 16]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoContainer,
        isTablet && styles.tabletLogoContainer,
        animatedGlowStyle
      ]}>
        <Image 
          source={require('@/assets/images/Aerospin-1-300x200.png')}
          style={[
            styles.logo,
            isTablet && styles.tabletLogo
          ]}
          resizeMode="contain"
        />
        <View style={styles.logoGlow} />
      </Animated.View>
      
      <Text style={[
        styles.title,
        isTablet && styles.tabletTitle
      ]}>
        AEROSPIN
      </Text>
      <Text style={[
        styles.subtitle,
        isTablet && styles.tabletSubtitle
      ]}>
        PRECISION CONTROL SYSTEM
      </Text>
      
      <View style={styles.versionBadge}>
        <Text style={styles.versionText}>v2.0 Enterprise</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  logoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    position: 'relative',
    overflow: 'hidden',
  },
  tabletLogoContainer: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
  },
  logo: {
    width: 80,
    height: 53,
    zIndex: 1,
  },
  tabletLogo: {
    width: 100,
    height: 67,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    letterSpacing: 3,
    textShadowColor: 'rgba(59, 130, 246, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tabletTitle: {
    fontSize: 40,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    letterSpacing: 2,
    marginBottom: 12,
  },
  tabletSubtitle: {
    fontSize: 18,
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#166534',
    letterSpacing: 0.5,
  },
});