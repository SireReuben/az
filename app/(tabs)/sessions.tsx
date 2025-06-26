import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { SessionControls } from '@/components/SessionControls';
import { SessionReport } from '@/components/SessionReport';
import { EnhancedConnectionStatus } from '@/components/EnhancedConnectionStatus';
import { OfflineNotice } from '@/components/OfflineNotice';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { VisualFeedback } from '@/components/VisualFeedbackSystem';
import { ContextualHelp } from '@/components/ContextualHelp';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useOptimizedTouch } from '@/hooks/useOptimizedTouch';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { 
  Play, 
  Square, 
  WifiOff, 
  Info, 
  Activity,
  Clock,
  Shield,
  Zap
} from 'lucide-react-native';

export default function SessionsScreen() {
  const { 
    deviceState, 
    sessionData, 
    isConnected, 
    startSession, 
    endSession,
    refreshConnection,
    networkDetection,
    registerForceUpdateCallback
  } = useDeviceState();
  
  const { addSessionAlert } = useAlerts();
  const { isTablet, isLandscape, screenType, height } = useDeviceOrientation();
  const { createOptimizedHandler } = useOptimizedTouch();

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Animation values
  const sessionPulse = useSharedValue(1);
  const connectionGlow = useSharedValue(0);

  const showFeedback = (type: 'success' | 'error' | 'warning' | 'info') => {
    setFeedbackType(type);
    setFeedbackVisible(true);
  };

  const handleStartSession = createOptimizedHandler(async () => {
    sessionPulse.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
    
    await startSession();
    showFeedback('success');
    addSessionAlert('success', 'Session Started', 'Device control session initiated successfully');
  }, { haptic: 'medium' });

  const handleEndSession = createOptimizedHandler(async () => {
    await endSession();
    showFeedback('info');
    addSessionAlert('info', 'Session Ended', 'Device control session terminated and data saved');
  }, { haptic: 'light' });

  const handleRefreshConnection = async () => {
    connectionGlow.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );
    
    const success = await refreshConnection();
    if (success) {
      showFeedback('success');
      addSessionAlert('success', 'Connection Refreshed', 'Successfully reconnected to AEROSPIN device');
    } else {
      showFeedback('error');
      addSessionAlert('warning', 'Connection Failed', 'Unable to establish connection to device');
    }
  };

  const sessionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sessionPulse.value }],
  }));

  const connectionAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + (connectionGlow.value * 0.4),
    shadowRadius: 8 + (connectionGlow.value * 12),
  }));

  const helpContent = {
    title: 'Session Management',
    description: 'Sessions provide safe operation procedures with complete logging and emergency capabilities.',
    steps: [
      'Ensure device is powered and connected',
      'Start a session to enable device controls',
      'Monitor session data in real-time',
      'End session to save all operation logs'
    ],
    tips: [
      'Sessions can run in offline mode with limited functionality',
      'All operations are logged for safety compliance',
      'Emergency stop is available during active sessions',
      'Brake positions are preserved during all operations'
    ]
  };

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return {
        ...styles.tabletLandscapeLayout,
        minHeight: height - 120,
      };
    }
    return {
      minHeight: height - 120,
    };
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={[styles.container, { minHeight: height }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <VisualFeedback 
          type={feedbackType}
          visible={feedbackVisible}
          onComplete={() => setFeedbackVisible(false)}
        />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: height - 120 }
          ]}
        >
          <ResponsiveContainer fillScreen={true}>
            <View style={getLayoutStyle()}>
              <View style={isTablet && isLandscape ? styles.leftColumn : null}>
                <StatusHeader />
                
                <View style={styles.headerSection}>
                  <Text style={styles.pageTitle}>Session Control</Text>
                  <ContextualHelp content={helpContent} />
                </View>

                <Animated.View style={connectionAnimatedStyle}>
                  <EnhancedConnectionStatus 
                    isConnected={isConnected} 
                    networkDetection={networkDetection}
                    onRefresh={handleRefreshConnection}
                    showDetails={false}
                  />
                </Animated.View>
                
                {!isConnected && <OfflineNotice />}
                
                {/* Session Control Panel */}
                <Animated.View style={[styles.sessionPanel, sessionAnimatedStyle]}>
                  <Text style={styles.panelTitle}>Session Management</Text>
                  <Text style={styles.panelDescription}>
                    Start a session to begin device control and monitoring
                  </Text>
                  
                  <View style={styles.sessionControls}>
                    {!deviceState.sessionActive ? (
                      <Pressable
                        style={[styles.sessionButton, styles.startButton]}
                        onPress={handleStartSession}
                      >
                        <Play size={24} color="#ffffff" />
                        <Text style={styles.sessionButtonText}>Start Session</Text>
                        <View style={styles.buttonGlow} />
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.sessionButton, styles.endButton]}
                        onPress={handleEndSession}
                      >
                        <Square size={24} color="#ffffff" />
                        <Text style={styles.sessionButtonText}>End Session</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Session Status Indicators */}
                  <View style={styles.statusIndicators}>
                    <View style={styles.indicator}>
                      <Activity size={16} color={deviceState.sessionActive ? '#22c55e' : '#6b7280'} />
                      <Text style={[
                        styles.indicatorText,
                        { color: deviceState.sessionActive ? '#22c55e' : '#6b7280' }
                      ]}>
                        Session {deviceState.sessionActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    
                    <View style={styles.indicator}>
                      <Shield size={16} color={isConnected ? '#3b82f6' : '#6b7280'} />
                      <Text style={[
                        styles.indicatorText,
                        { color: isConnected ? '#3b82f6' : '#6b7280' }
                      ]}>
                        Device {isConnected ? 'Connected' : 'Offline'}
                      </Text>
                    </View>
                    
                    <View style={styles.indicator}>
                      <Clock size={16} color={sessionData.duration !== '00:00:00' ? '#f59e0b' : '#6b7280'} />
                      <Text style={[
                        styles.indicatorText,
                        { color: sessionData.duration !== '00:00:00' ? '#f59e0b' : '#6b7280' }
                      ]}>
                        Duration: {sessionData.duration}
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Session Information */}
                {!deviceState.sessionActive && (
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoPanelTitle}>Ready to Start</Text>
                    <View style={styles.infoList}>
                      <View style={styles.infoItem}>
                        <Zap size={16} color="#3b82f6" />
                        <Text style={styles.infoText}>Ensure device is powered on</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <WifiOff size={16} color="#3b82f6" />
                        <Text style={styles.infoText}>Connect to "AEROSPIN CONTROL" WiFi</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Play size={16} color="#3b82f6" />
                        <Text style={styles.infoText}>Start session to access controls</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Activity size={16} color="#3b82f6" />
                        <Text style={styles.infoText}>Dashboard available during sessions</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Shield size={16} color="#3b82f6" />
                        <Text style={styles.infoText}>Brake positions preserved during operations</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                {deviceState.sessionActive && (
                  <SessionReport 
                    sessionData={sessionData} 
                    registerForceUpdateCallback={registerForceUpdateCallback}
                  />
                )}
                
                {/* Connection Quality Panel */}
                {isConnected && (
                  <View style={styles.qualityPanel}>
                    <Text style={styles.qualityTitle}>Connection Quality</Text>
                    
                    <View style={styles.qualityIndicator}>
                      <View style={styles.qualityDot} />
                      <Text style={styles.qualityText}>
                        Excellent - Production Optimized
                      </Text>
                    </View>
                    
                    <Text style={styles.qualityDescription}>
                      Your app is running with production build optimizations for the best Arduino communication performance.
                    </Text>
                    
                    <View style={styles.qualityMetrics}>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>99.9%</Text>
                        <Text style={styles.metricLabel}>Reliability</Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>{'< 5s'}</Text>
                        <Text style={styles.metricLabel}>Response</Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>24/7</Text>
                        <Text style={styles.metricLabel}>Uptime</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Session Info Button */}
                <Pressable
                  style={styles.infoButton}
                  onPress={() => {
                    showFeedback('info');
                    // Show session info modal or alert
                  }}
                >
                  <Info size={20} color="#ffffff" />
                  <Text style={styles.infoButtonText}>Session Information</Text>
                </Pressable>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  tabletLandscapeLayout: {
    flexDirection: 'row',
    gap: 24,
    minHeight: '100%',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  sessionPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  panelTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  panelDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  sessionControls: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  startButton: {
    backgroundColor: '#22c55e',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  sessionButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  statusIndicators: {
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  indicatorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  infoPanel: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoPanelTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#93c5fd',
    flex: 1,
  },
  qualityPanel: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  qualityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#22c55e',
    marginBottom: 12,
    textAlign: 'center',
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  qualityText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
  },
  qualityDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#86efac',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  qualityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#22c55e',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#86efac',
    marginTop: 2,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.4)',
  },
  infoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
});