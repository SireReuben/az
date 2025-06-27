import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { WifiStatus } from '@/components/WifiStatus';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { NetworkPermissionGuard } from '@/components/NetworkPermissionGuard';
import { useEnhancedNetworkDetection } from '@/hooks/useEnhancedNetworkDetection';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useNetworkPermissions } from '@/hooks/useNetworkPermissions';

export default function WelcomeScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [logoAnim] = useState(new Animated.Value(0));
  const [particleAnim] = useState(new Animated.Value(0));
  const { hasLocationPermission, hasNetworkAccess } = useNetworkPermissions();
  const [showManualConnect, setShowManualConnect] = useState(false);
  const { isTablet, isLandscape, screenType, width, height, isWideScreen } = useDeviceOrientation();

  // Use enhanced network detection
  const {
    isFullyConnected,
    isConnectedToArduinoWifi,
    isArduinoReachable,
    isArduinoResponding,
    connectionQuality,
    networkInfo,
    detectionStatus,
  } = useEnhancedNetworkDetection();

  const canProceed = Platform.OS === 'web' || (hasLocationPermission && hasNetworkAccess);

  useEffect(() => {
    // Start premium animation sequence
    Animated.sequence([
      // Particle animation
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Logo animation with spring effect
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Content fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Show manual connect option after appropriate time
    const delay = Platform.OS === 'web' ? 5000 : 8000;
    const timer = setTimeout(() => {
      if (!isFullyConnected && canProceed) {
        setShowManualConnect(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isFullyConnected, canProceed]);

  // Auto-navigate when connected
  useEffect(() => {
    if (isFullyConnected && canProceed) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)/sessions');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFullyConnected, canProceed]);

  const handleManualConnect = () => {
    if (!canProceed) {
      return;
    }
    router.replace('/(tabs)/sessions');
  };

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return {
        ...styles.tabletLandscapeLayout,
        minHeight: height,
        paddingHorizontal: isWideScreen ? 60 : 40,
      };
    }
    return {
      minHeight: height,
    };
  };

  const getConnectionMessage = () => {
    if (Platform.OS === 'web') {
      return 'Make sure you\'re connected to "AEROSPIN CONTROL" WiFi network';
    }
    
    if (!hasLocationPermission) {
      return 'Location permission required to scan for Wi-Fi networks';
    }
    
    if (!hasNetworkAccess) {
      return 'Please connect to "AEROSPIN CONTROL" WiFi network';
    }

    if (!networkInfo.isWifiEnabled) {
      return 'WiFi is disabled - Please enable WiFi and connect to "AEROSPIN CONTROL"';
    }
    
    if (!isConnectedToArduinoWifi) {
      return `Currently connected to: ${networkInfo.ssid || 'Unknown'} - Please connect to "AEROSPIN CONTROL"`;
    }
    
    if (!isArduinoReachable) {
      return 'Connected to AEROSPIN CONTROL but device not reachable - Check device power';
    }
    
    if (!isArduinoResponding) {
      return 'Device reachable but not responding - Device may be starting up';
    }
    
    return 'Ensure your device WiFi is connected to "AEROSPIN CONTROL" network';
  };

  const getDetailedStatus = () => {
    if (detectionStatus === 'checking') {
      return 'Establishing secure connection...';
    }
    
    if (isFullyConnected) {
      return `Connected with ${connectionQuality} signal quality`;
    }
    
    const layers = [];
    if (isConnectedToArduinoWifi) layers.push('✓ Network Layer');
    if (isArduinoReachable) layers.push('✓ Transport Layer');
    if (isArduinoResponding) layers.push('✓ Application Layer');
    
    if (layers.length === 0) {
      return 'Initializing connection protocols...';
    }
    
    return `Establishing: ${layers.join(', ')}`;
  };

  return (
    <NetworkPermissionGuard>
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe', '#bae6fd', '#93c5fd']}
        style={[styles.container, { minHeight: height }]}
      >
        {/* Animated background particles */}
        <Animated.View style={[
          styles.particleContainer,
          {
            opacity: particleAnim,
            transform: [{
              translateY: particleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  opacity: Math.random() * 0.5 + 0.3,
                }
              ]}
            />
          ))}
        </Animated.View>

        <ResponsiveContainer style={styles.responsiveContainer} fillScreen={true}>
          <Animated.View
            style={[
              styles.content,
              getLayoutStyle(),
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[
              styles.header,
              isTablet && isLandscape && styles.tabletLandscapeHeader
            ]}>
              <Animated.View 
                style={[
                  styles.logoContainer,
                  isTablet && styles.tabletLogoContainer,
                  {
                    opacity: logoAnim,
                    transform: [{
                      scale: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      })
                    }, {
                      rotateY: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['180deg', '0deg'],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.logoGlow} />
                <Image 
                  source={require('@/assets/images/Aerospin-1-300x200.png')}
                  style={[
                    styles.logo,
                    isTablet && styles.tabletLogo,
                    isLandscape && isTablet && styles.landscapeLogo
                  ]}
                  resizeMode="contain"
                />
                <View style={styles.logoReflection} />
              </Animated.View>
              
              <Animated.Text style={[
                styles.title,
                isTablet && styles.tabletTitle,
                isLandscape && isTablet && styles.landscapeTitle,
                {
                  opacity: logoAnim,
                  transform: [{
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}>
                Welcome to
              </Animated.Text>
              
              <Animated.Text style={[
                styles.brand,
                isTablet && styles.tabletBrand,
                isLandscape && isTablet && styles.landscapeBrand,
                {
                  opacity: logoAnim,
                  transform: [{
                    scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}>
                AEROSPIN
              </Animated.Text>
              
              <Animated.Text style={[
                styles.subtitle,
                isTablet && styles.tabletSubtitle,
                isLandscape && isTablet && styles.landscapeSubtitle,
                {
                  opacity: logoAnim,
                  transform: [{
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }
              ]}>
                PRECISION CONTROL SYSTEM
              </Animated.Text>
            </View>

            <View style={[
              styles.middle,
              isTablet && isLandscape && styles.tabletLandscapeMiddle
            ]}>
              <WifiStatus isConnected={isFullyConnected} />
              
              {/* Enhanced status display */}
              <View style={styles.statusContainer}>
                <Animated.Text style={[
                  styles.statusText,
                  isTablet && styles.tabletStatusText,
                  {
                    opacity: fadeAnim,
                  }
                ]}>
                  {getDetailedStatus()}
                </Animated.Text>
                
                {detectionStatus === 'checking' && (
                  <Animated.Text style={[
                    styles.statusSubtext,
                    isTablet && styles.tabletStatusSubtext,
                    {
                      opacity: fadeAnim,
                    }
                  ]}>
                    Verifying network protocols and device authentication...
                  </Animated.Text>
                )}
              </View>
              
              {!isFullyConnected && !showManualConnect && canProceed && (
                <LoadingSpinner isVisible={true} />
              )}
              
              {isFullyConnected && (
                <Animated.View style={[
                  styles.successMessage,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      })
                    }]
                  }
                ]}>
                  <Text style={[
                    styles.successText,
                    isTablet && styles.tabletSuccessText
                  ]}>
                    ✓ Connection Established
                  </Text>
                  <Text style={[
                    styles.loadingText,
                    isTablet && styles.tabletLoadingText
                  ]}>
                    Initializing Control Interface...
                  </Text>
                </Animated.View>
              )}

              {!isFullyConnected && showManualConnect && canProceed && (
                <Animated.View style={[
                  styles.manualConnectContainer,
                  {
                    opacity: fadeAnim,
                  }
                ]}>
                  <Text style={[
                    styles.manualConnectText,
                    isTablet && styles.tabletManualConnectText
                  ]}>
                    Unable to establish automatic connection
                  </Text>
                  <Text style={[
                    styles.manualConnectSubtext,
                    isTablet && styles.tabletManualConnectSubtext
                  ]}>
                    {getConnectionMessage()}
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.manualConnectButton,
                      isTablet && styles.tabletManualConnectButton
                    ]}
                    onPress={handleManualConnect}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      style={styles.buttonGradient}
                    >
                      <Text style={[
                        styles.manualConnectButtonText,
                        isTablet && styles.tabletManualConnectButtonText
                      ]}>
                        Continue to Control Center
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            <View style={[
              styles.footer,
              isTablet && isLandscape && styles.tabletLandscapeFooter
            ]}>
              <Animated.Text style={[
                styles.tagline,
                isTablet && styles.tabletTagline,
                {
                  opacity: fadeAnim,
                }
              ]}>
                REVOLUTIONIZING PRECISION CONTROL,
              </Animated.Text>
              <Animated.Text style={[
                styles.tagline,
                isTablet && styles.tabletTagline,
                {
                  opacity: fadeAnim,
                }
              ]}>
                ONE INNOVATION AT A TIME.
              </Animated.Text>
            </View>
          </Animated.View>
        </ResponsiveContainer>
      </LinearGradient>
    </NetworkPermissionGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#3b82f6',
    borderRadius: 1,
  },
  responsiveContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: '100%',
  },
  tabletLandscapeLayout: {
    flexDirection: 'row',
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    flex: 1,
  },
  tabletLandscapeHeader: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 40,
  },
  logoContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  tabletLogoContainer: {
    marginBottom: 28,
    borderRadius: 32,
    padding: 28,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#3b82f6',
    borderRadius: 34,
    opacity: 0.2,
  },
  logoReflection: {
    position: 'absolute',
    top: '50%',
    left: '20%',
    width: '30%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    transform: [{ rotate: '-45deg' }],
  },
  logo: {
    width: 140,
    height: 93,
    zIndex: 1,
  },
  tabletLogo: {
    width: 180,
    height: 120,
  },
  landscapeLogo: {
    width: 160,
    height: 107,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  tabletTitle: {
    fontSize: 32,
    marginBottom: 12,
  },
  landscapeTitle: {
    fontSize: 28,
    marginBottom: 10,
  },
  brand: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 6,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tabletBrand: {
    fontSize: 64,
    letterSpacing: 6,
    marginBottom: 10,
  },
  landscapeBrand: {
    fontSize: 56,
    letterSpacing: 5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 2,
  },
  tabletSubtitle: {
    fontSize: 24,
    letterSpacing: 3,
  },
  landscapeSubtitle: {
    fontSize: 20,
    letterSpacing: 2.5,
  },
  middle: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    width: '100%',
  },
  tabletLandscapeMiddle: {
    flex: 1.5,
    marginHorizontal: 40,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 6,
  },
  tabletStatusText: {
    fontSize: 18,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  tabletStatusSubtext: {
    fontSize: 15,
  },
  successMessage: {
    alignItems: 'center',
    marginTop: 28,
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#166534',
    marginBottom: 8,
  },
  tabletSuccessText: {
    fontSize: 26,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#22c55e',
  },
  tabletLoadingText: {
    fontSize: 19,
  },
  manualConnectContainer: {
    alignItems: 'center',
    marginTop: 28,
    width: '100%',
  },
  manualConnectText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
  },
  tabletManualConnectText: {
    fontSize: 22,
    marginBottom: 14,
  },
  manualConnectSubtext: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  tabletManualConnectSubtext: {
    fontSize: 19,
    marginBottom: 36,
    paddingHorizontal: 40,
  },
  manualConnectButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabletManualConnectButton: {
    borderRadius: 20,
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  manualConnectButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabletManualConnectButtonText: {
    fontSize: 21,
  },
  footer: {
    alignItems: 'center',
    flex: 0.5,
  },
  tabletLandscapeFooter: {
    flex: 0.5,
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#475569',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  tabletTagline: {
    fontSize: 18,
    letterSpacing: 2,
  },
});