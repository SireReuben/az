import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

export function StatusHeader() {
  const { isTablet } = useDeviceOrientation();

  return (
    <View style={styles.container}>
      <View style={[
        styles.logoContainer,
        isTablet && styles.tabletLogoContainer
      ]}>
        <Image 
          source={require('@/assets/images/Aerospin-1-300x200.png')}
          style={[
            styles.logo,
            isTablet && styles.tabletLogo
          ]}
          resizeMode="contain"
        />
      </View>
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
        GLOBAL CONTROL
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  tabletLogoContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 40,
  },
  tabletLogo: {
    width: 80,
    height: 53,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  tabletTitle: {
    fontSize: 36,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#e0f2fe',
    letterSpacing: 1,
  },
  tabletSubtitle: {
    fontSize: 16,
    letterSpacing: 1.5,
  },
});