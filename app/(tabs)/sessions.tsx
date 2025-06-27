import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
    registerForceUpdateCallback,
    generateAndSharePdf
  } = useDeviceState();
  
  const { addSessionAlert } = useAlerts();
  const { isTablet, isLandscape, screenType, height } = useDeviceOrientation();
  const { createOptimizedHandler } = useOptimizedTouch();

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [showReportModal, setShowReportModal] = useState(false);

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
    
    // Navigate to dashboard after starting session
    setTimeout(() => {
      router.push('/(tabs)');
    }, 1500);
  }, { haptic: 'medium' });

  const handleEndSession = createOptimizedHandler(async () => {
    await endSession();
    showFeedback('info');
    addSessionAlert('info', 'Session Ended', 'Device control session terminated and data saved');
    
    // PDF is automatically generated and shared in endSession
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
      colors={['#f0f9ff', '#e0f2fe', '#bae6fd']}
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
                    <SessionControls 
                      sessionActive={deviceState.sessionActive}
                      onStartSession={handleStartSession}
                      onEndSession={handleEndSession}
                      isConnected={isConnected}
                    />
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
                        <Activity size={16} color="#3b82f6" />
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
                    setShowReportModal(true);
                  }}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={styles.infoButtonGradient}
                  >
                    <Info size={20} color="#ffffff" />
                    <Text style={styles.infoButtonText}>Session Information</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>

        {/* Session Report Modal */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Session Information</Text>
              
              <Text style={styles.modalSubtitle}>Current Session</Text>
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Status:</Text>
                <Text style={[
                  styles.modalInfoValue,
                  { color: deviceState.sessionActive ? '#22c55e' : '#6b7280' }
                ]}>
                  {deviceState.sessionActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Start Time:</Text>
                <Text style={styles.modalInfoValue}>
                  {sessionData.startTime || 'Not started'}
                </Text>
              </View>
              
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Duration:</Text>
                <Text style={styles.modalInfoValue}>
                  {sessionData.duration || '00:00:00'}
                </Text>
              </View>
              
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Events Logged:</Text>
                <Text style={styles.modalInfoValue}>
                  {sessionData.events.length}
                </Text>
              </View>
              
              <Text style={styles.modalSubtitle}>Device Status</Text>
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Connection:</Text>
                <Text style={[
                  styles.modalInfoValue,
                  { color: isConnected ? '#22c55e' : '#ef4444' }
                ]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
              
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Direction:</Text>
                <Text style={styles.modalInfoValue}>
                  {deviceState.direction}
                </Text>
              </View>
              
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Brake:</Text>
                <Text style={styles.modalInfoValue}>
                  {deviceState.brake}
                </Text>
              </View>
              
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Speed:</Text>
                <Text style={styles.modalInfoValue}>
                  {deviceState.speed}%
                </Text>
              </View>
              
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowReportModal(false)}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={styles.modalCloseButtonGradient}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Modal>
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
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  sessionPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  panelTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
  },
  panelDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  sessionControls: {
    alignItems: 'center',
    marginBottom: 24,
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
    backgroundColor: 'rgba(239, 246, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoPanelTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
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
    color: '#1e40af',
    flex: 1,
  },
  qualityPanel: {
    backgroundColor: 'rgba(240, 253, 244, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qualityTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#166534',
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
    color: '#166534',
  },
  qualityDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#166534',
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
    color: '#166534',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
    marginTop: 2,
  },
  infoButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  infoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  modalInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalInfoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  modalInfoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#0f172a',
  },
  modalCloseButton: {
    marginTop: 24,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  modalCloseButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
});