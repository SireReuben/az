import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { DeviceControls } from '@/components/DeviceControls';
import { EnhancedConnectionStatus } from '@/components/EnhancedConnectionStatus';
import { SessionRequiredNotice } from '@/components/SessionRequiredNotice';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

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

  // Enhanced device control handlers with alert integration
  const handleUpdateDeviceState = async (updates: Partial<typeof deviceState>) => {
    await updateDeviceState(updates);
    
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

  const handleEmergencyStop = async () => {
    await emergencyStop();
    addSafetyAlert('Emergency stop activated - All operations halted');
  };

  const handleResetDevice = async () => {
    await resetDevice();
    addOperationAlert('Device reset completed', 'success');
  };

  const handleReleaseBrake = async () => {
    await releaseBrake();
    addOperationAlert('Brake released', 'success');
  };

  const handleRefreshConnection = async () => {
    const success = await refreshConnection();
    if (success) {
      addOperationAlert('Connection refreshed successfully', 'success');
    } else {
      addOperationAlert('Connection refresh failed', 'warning');
    }
  };

  // Check session status
  const hasActiveSession = deviceState.sessionActive === true;
  
  // Show session required notice if no active session
  if (!hasActiveSession) {
    return (
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6']}
        style={[styles.container, { minHeight: height }]}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.tabletScrollContent,
              { minHeight: height - 100 }
            ]}
          >
            <ResponsiveContainer fillScreen={true}>
              <StatusHeader />
              <EnhancedConnectionStatus 
                isConnected={isConnected} 
                networkDetection={networkDetection}
                onRefresh={handleRefreshConnection}
                showDetails={false}
              />
              <SessionRequiredNotice />
            </ResponsiveContainer>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return styles.tabletLandscapeLayout;
    }
    return null;
  };

  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6']}
      style={[styles.container, { minHeight: height }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
            { minHeight: height - 100 }
          ]}
        >
          <ResponsiveContainer fillScreen={true}>
            <View style={getLayoutStyle()}>
              <View style={isTablet && isLandscape ? styles.leftColumn : null}>
                <StatusHeader />
                <EnhancedConnectionStatus 
                  isConnected={isConnected} 
                  networkDetection={networkDetection}
                  onRefresh={handleRefreshConnection}
                  showDetails={false}
                />
                
                <View style={[
                  styles.statusCard,
                  isTablet && styles.tabletStatusCard
                ]}>
                  <Text style={[
                    styles.sectionTitle,
                    isTablet && styles.tabletSectionTitle
                  ]}>
                    Live Device Status
                  </Text>
                  <View style={[
                    styles.statusGrid,
                    isTablet && styles.tabletStatusGrid
                  ]}>
                    <View style={[
                      styles.statusItem,
                      isTablet && styles.tabletStatusItem
                    ]}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Direction
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue,
                        deviceState.direction !== 'None' && styles.statusValueActive
                      ]}>
                        {deviceState.direction}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusItem,
                      isTablet && styles.tabletStatusItem
                    ]}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Brake
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue,
                        deviceState.brake !== 'None' && styles.statusValueActive
                      ]}>
                        {deviceState.brake}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusItem,
                      isTablet && styles.tabletStatusItem
                    ]}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Speed
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue,
                        deviceState.speed > 0 && styles.statusValueActive
                      ]}>
                        {deviceState.speed}%
                      </Text>
                    </View>
                    <View style={[
                      styles.statusItem,
                      isTablet && styles.tabletStatusItem
                    ]}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Session
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue,
                        styles.statusValueActive
                      ]}>
                        Active
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                <DeviceControls 
                  deviceState={deviceState}
                  onUpdateState={handleUpdateDeviceState}
                  onEmergencyStop={handleEmergencyStop}
                  onReset={handleResetDevice}
                  onReleaseBrake={handleReleaseBrake}
                  disabled={!isConnected}
                />

                <View style={[
                  styles.warningCard,
                  isTablet && styles.tabletWarningCard
                ]}>
                  <Text style={[
                    styles.warningTitle,
                    isTablet && styles.tabletWarningTitle
                  ]}>
                    ⚠️ Safety Notice
                  </Text>
                  <Text style={[
                    styles.warningText,
                    isTablet && styles.tabletWarningText
                  ]}>
                    Always ensure proper safety protocols are followed when operating the device. 
                    Monitor all operations and be prepared to use emergency stop if needed.
                    The brake position will be preserved during emergency stops and device resets.
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
    padding: 16,
    paddingBottom: 100,
  },
  tabletScrollContent: {
    padding: 24,
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
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabletStatusCard: {
    padding: 24,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletSectionTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabletStatusGrid: {
    gap: 16,
  },
  statusItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  tabletStatusItem: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  tabletStatusLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#6b7280',
  },
  tabletStatusValue: {
    fontSize: 22,
  },
  statusValueActive: {
    color: '#1e40af',
  },
  warningCard: {
    backgroundColor: 'rgba(254, 242, 242, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  tabletWarningCard: {
    padding: 24,
    borderRadius: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  tabletWarningTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7f1d1d',
    lineHeight: 20,
  },
  tabletWarningText: {
    fontSize: 16,
    lineHeight: 24,
  },
});