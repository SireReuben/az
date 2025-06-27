import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { EnhancedConnectionStatus } from '@/components/EnhancedConnectionStatus';
import { SessionRequiredNotice } from '@/components/SessionRequiredNotice';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { VisualFeedback } from '@/components/VisualFeedbackSystem';
import { ContextualHelp } from '@/components/ContextualHelp';
import { PremiumSpeedSlider } from '@/components/PremiumSpeedSlider';
import OptimizedControl from '@/components/OptimizedDeviceControls';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useOptimizedTouch } from '@/hooks/useOptimizedTouch';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { 
  ArrowUp, 
  ArrowDown, 
  Square, 
  TriangleAlert as AlertTriangle, 
  Gauge,
  Shield,
  Activity
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { 
    deviceState, 
    isConnected, 
    updateDeviceState, 
    emergencyStop, 
    resetDevice, 
    releaseBrake,
    refreshConnection,
    networkDetection
  } = useDeviceState();
  
  const { addOperationAlert, addSafetyAlert } = useAlerts();
  const { isTablet, isLandscape, screenType, height } = useDeviceOrientation();
  const { createOptimizedHandler, triggerHaptic } = useOptimizedTouch();

  // Animation values
  const speedProgress = useSharedValue(0);
  const connectionPulse = useSharedValue(1);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Update animations when device state changes
  useEffect(() => {
    speedProgress.value = withSpring(deviceState.speed / 100, {
      damping: 15,
      stiffness: 150,
    });
  }, [deviceState.speed, speedProgress]);

  useEffect(() => {
    if (isConnected) {
      connectionPulse.value = withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
    }
  }, [isConnected, connectionPulse]);

  const showFeedback = (type: 'success' | 'error' | 'warning' | 'info') => {
    setFeedbackType(type);
    setFeedbackVisible(true);
  };

  // Enhanced device control handlers with visual feedback
  const handleUpdateDeviceState = async (updates: Partial<typeof deviceState>) => {
    await updateDeviceState(updates);
    showFeedback('success');
    
    // Add operation alerts
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'direction' && value !== 'None') {
        addOperationAlert(`Motor direction set to ${value}`, 'success');
      } else if (key === 'brake' && value !== 'None') {
        addOperationAlert(`${value} brake applied`, 'success');
      } else if (key === 'speed' && typeof value === 'number') {
        addOperationAlert(`Motor speed set to ${value}%`, 'success');
      }
    });
  };

  const handleSpeedChange = createOptimizedHandler(async (speed: number) => {
    await handleUpdateDeviceState({ speed });
  }, { haptic: 'light' });

  const handleEmergencyStop = createOptimizedHandler(async () => {
    await emergencyStop();
    showFeedback('error');
    addSafetyAlert('Emergency stop activated - All operations halted');
  }, { haptic: 'heavy' });

  const handleResetDevice = createOptimizedHandler(async () => {
    await resetDevice();
    showFeedback('warning');
    addOperationAlert('Device reset completed', 'success');
  }, { haptic: 'medium' });

  const handleReleaseBrake = createOptimizedHandler(async () => {
    await releaseBrake();
    showFeedback('success');
    addOperationAlert('Brake released', 'success');
  }, { haptic: 'light' });

  const handleRefreshConnection = async () => {
    const success = await refreshConnection();
    if (success) {
      showFeedback('success');
      addOperationAlert('Connection refreshed successfully', 'success');
    } else {
      showFeedback('error');
      addOperationAlert('Connection refresh failed', 'warning');
    }
  };

  // Animated styles
  const speedBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(speedProgress.value, [0, 1], [0, 100])}%`,
  }));

  const connectionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: connectionPulse.value }],
  }));

  // Check session status
  const hasActiveSession = deviceState.sessionActive === true;
  
  // Show session required notice if no active session
  if (!hasActiveSession) {
    return (
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe', '#bae6fd']}
        style={[styles.container, { minHeight: height }]}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { minHeight: height - 100 }
            ]}
          >
            <ResponsiveContainer fillScreen={true}>
              <StatusHeader />
              <Animated.View style={connectionStyle}>
                <EnhancedConnectionStatus 
                  isConnected={isConnected} 
                  networkDetection={networkDetection}
                  onRefresh={handleRefreshConnection}
                  showDetails={false}
                />
              </Animated.View>
              <SessionRequiredNotice />
            </ResponsiveContainer>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const helpContent = {
    title: 'Dashboard Controls',
    description: 'Control your AEROSPIN device with precision and safety. All operations are logged and monitored.',
    steps: [
      'Ensure device is connected before making changes',
      'Use the premium speed slider for precise control',
      'Use emergency stop for immediate halt',
      'Monitor speed and direction indicators',
      'Check brake position before operations'
    ],
    tips: [
      'Brake positions are preserved during resets',
      'Emergency stop maintains current brake position',
      'All operations provide haptic feedback',
      'Visual indicators show real-time status',
      'Speed slider provides smooth, precise control'
    ]
  };

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return styles.tabletLandscapeLayout;
    }
    return null;
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
            { minHeight: height - 100 }
          ]}
        >
          <ResponsiveContainer fillScreen={true}>
            <View style={getLayoutStyle()}>
              <View style={isTablet && isLandscape ? styles.leftColumn : null}>
                <StatusHeader />
                
                <View style={styles.headerSection}>
                  <Text style={styles.pageTitle}>Mission Control</Text>
                  <ContextualHelp content={helpContent} />
                </View>

                <Animated.View style={connectionStyle}>
                  <EnhancedConnectionStatus 
                    isConnected={isConnected} 
                    networkDetection={networkDetection}
                    onRefresh={handleRefreshConnection}
                    showDetails={false}
                  />
                </Animated.View>
                
                {/* Live Status Dashboard */}
                <View style={styles.statusDashboard}>
                  <Text style={styles.dashboardTitle}>Live System Status</Text>
                  
                  <View style={styles.statusGrid}>
                    <View style={styles.statusCard}>
                      <View style={styles.statusHeader}>
                        <ArrowUp size={20} color="#3b82f6" />
                        <Text style={styles.statusLabel}>Direction</Text>
                      </View>
                      <Text style={[
                        styles.statusValue,
                        deviceState.direction !== 'None' && styles.statusActive
                      ]}>
                        {deviceState.direction}
                      </Text>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: deviceState.direction !== 'None' ? '#22c55e' : '#6b7280' }
                      ]} />
                    </View>

                    <View style={styles.statusCard}>
                      <View style={styles.statusHeader}>
                        <Shield size={20} color="#f59e0b" />
                        <Text style={styles.statusLabel}>Brake</Text>
                      </View>
                      <Text style={[
                        styles.statusValue,
                        deviceState.brake !== 'None' && styles.statusActive
                      ]}>
                        {deviceState.brake}
                      </Text>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: deviceState.brake !== 'None' ? '#f59e0b' : '#6b7280' }
                      ]} />
                    </View>

                    <View style={styles.statusCard}>
                      <View style={styles.statusHeader}>
                        <Gauge size={20} color="#ef4444" />
                        <Text style={styles.statusLabel}>Speed</Text>
                      </View>
                      <Text style={[
                        styles.statusValue,
                        deviceState.speed > 0 && styles.statusActive
                      ]}>
                        {deviceState.speed}%
                      </Text>
                      <View style={styles.speedBar}>
                        <Animated.View style={[styles.speedFill, speedBarStyle]} />
                      </View>
                    </View>

                    <View style={styles.statusCard}>
                      <View style={styles.statusHeader}>
                        <Activity size={20} color="#22c55e" />
                        <Text style={styles.statusLabel}>Session</Text>
                      </View>
                      <Text style={[styles.statusValue, styles.statusActive]}>
                        Active
                      </Text>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: '#22c55e' }
                      ]} />
                    </View>
                  </View>
                </View>

                {/* Premium Speed Slider */}
                <PremiumSpeedSlider
                  value={deviceState.speed}
                  onValueChange={handleSpeedChange}
                  disabled={!isConnected}
                  min={0}
                  max={100}
                  step={5}
                />
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                {/* Emergency Controls */}
                <View style={styles.emergencySection}>
                  <Text style={styles.sectionTitle}>Emergency Controls</Text>
                  
                  <OptimizedControl
                    title="EMERGENCY STOP"
                    icon={<Square size={24} color="#ffffff" />}
                    onPress={handleEmergencyStop}
                    variant="danger"
                    disabled={!isConnected}
                  />
                  
                  <OptimizedControl
                    title="RESET DEVICE"
                    icon={<AlertTriangle size={20} color="#ffffff" />}
                    onPress={handleResetDevice}
                    variant="secondary"
                    disabled={!isConnected}
                  />
                </View>

                {/* Direction Controls */}
                <View style={styles.controlSection}>
                  <Text style={styles.sectionTitle}>Motor Direction</Text>
                  
                  <View style={styles.controlGrid}>
                    <OptimizedControl
                      title="Forward"
                      icon={<ArrowUp size={20} color="#ffffff" />}
                      onPress={createOptimizedHandler(() => handleUpdateDeviceState({ direction: 'Forward' }), { haptic: 'medium' })}
                      isActive={deviceState.direction === 'Forward'}
                      disabled={!isConnected}
                      variant="primary"
                    />
                    
                    <OptimizedControl
                      title="Reverse"
                      icon={<ArrowDown size={20} color="#ffffff" />}
                      onPress={createOptimizedHandler(() => handleUpdateDeviceState({ direction: 'Reverse' }), { haptic: 'medium' })}
                      isActive={deviceState.direction === 'Reverse'}
                      disabled={!isConnected}
                      variant="primary"
                    />
                  </View>
                </View>

                {/* Brake Controls */}
                <View style={styles.controlSection}>
                  <Text style={styles.sectionTitle}>Brake Control</Text>
                  
                  <View style={styles.controlGrid}>
                    <OptimizedControl
                      title={deviceState.brake === 'Pull' ? 'Release Pull' : 'Pull Brake'}
                      icon={<Shield size={20} color="#ffffff" />}
                      onPress={createOptimizedHandler(() => handleUpdateDeviceState({ brake: deviceState.brake === 'Pull' ? 'None' : 'Pull' }), { haptic: 'medium' })}
                      isActive={deviceState.brake === 'Pull'}
                      disabled={!isConnected}
                      variant="secondary"
                    />
                    
                    <OptimizedControl
                      title={deviceState.brake === 'Push' ? 'Release Push' : 'Push Brake'}
                      icon={<Shield size={20} color="#ffffff" />}
                      onPress={createOptimizedHandler(() => handleUpdateDeviceState({ brake: deviceState.brake === 'Push' ? 'None' : 'Push' }), { haptic: 'medium' })}
                      isActive={deviceState.brake === 'Push'}
                      disabled={!isConnected}
                      variant="secondary"
                    />
                  </View>
                  
                  {deviceState.brake !== 'None' && (
                    <OptimizedControl
                      title="Release Brake"
                      icon={<Shield size={20} color="#ffffff" />}
                      onPress={handleReleaseBrake}
                      disabled={!isConnected}
                      variant="secondary"
                    />
                  )}
                </View>

                {/* Safety Notice */}
                <View style={styles.safetyNotice}>
                  <View style={styles.safetyHeader}>
                    <AlertTriangle size={20} color="#b45309" />
                    <Text style={styles.safetyTitle}>Safety Protocol</Text>
                  </View>
                  <Text style={styles.safetyText}>
                    All operations are monitored and logged. Emergency stop maintains current brake position. 
                    Use the premium speed slider for precise control with haptic feedback.
                  </Text>
                </View>
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
    paddingBottom: 120,
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
  statusDashboard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dashboardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statusCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.8)',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#64748b',
    marginBottom: 8,
  },
  statusActive: {
    color: '#0f172a',
  },
  statusIndicator: {
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
  speedBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(203, 213, 225, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  speedFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },
  emergencySection: {
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  controlSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  controlGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  safetyNotice: {
    backgroundColor: 'rgba(255, 251, 235, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#b45309',
    marginLeft: 8,
  },
  safetyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400e',
    lineHeight: 20,
  },
});