import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { SessionControls } from '@/components/SessionControls';
import { SessionReport } from '@/components/SessionReport';
import { EnhancedConnectionStatus } from '@/components/EnhancedConnectionStatus';
import { OfflineNotice } from '@/components/OfflineNotice';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

export default function SessionsScreen() {
  const { 
    deviceState, 
    sessionData, 
    isConnected, 
    startSession, 
    endSession,
    refreshConnection,
    networkDetection
  } = useDeviceState();
  
  const { addSessionAlert } = useAlerts();
  const { isTablet, isLandscape, screenType, height } = useDeviceOrientation();

  const handleStartSession = async () => {
    await startSession();
    addSessionAlert('success', 'Session Started', 'Device control session initiated successfully');
  };

  const handleEndSession = async () => {
    await endSession();
    addSessionAlert('info', 'Session Ended', 'Device control session terminated and data saved');
  };

  const handleRefreshConnection = async () => {
    const success = await refreshConnection();
    if (success) {
      addSessionAlert('success', 'Connection Refreshed', 'Successfully reconnected to AEROSPIN device');
    } else {
      addSessionAlert('warning', 'Connection Failed', 'Unable to establish connection to device');
    }
  };

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return {
        ...styles.tabletLandscapeLayout,
        minHeight: height - 120, // Account for safe areas and tab bar
      };
    }
    return {
      minHeight: height - 120,
    };
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
            { minHeight: height - 120 } // Ensure full height usage
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
                  showDetails={!isConnected}
                />
                
                {!isConnected && <OfflineNotice />}
                
                <View style={[
                  styles.card,
                  isTablet && styles.tabletCard
                ]}>
                  <Text style={[
                    styles.sectionTitle,
                    isTablet && styles.tabletSectionTitle
                  ]}>
                    Session Management
                  </Text>
                  <Text style={[
                    styles.sectionDescription,
                    isTablet && styles.tabletSectionDescription
                  ]}>
                    Start a session to begin device control and monitoring
                  </Text>
                  <SessionControls
                    sessionActive={deviceState.sessionActive}
                    onStartSession={handleStartSession}
                    onEndSession={handleEndSession}
                    isConnected={isConnected}
                  />
                </View>

                {!deviceState.sessionActive && (
                  <View style={[
                    styles.infoCard,
                    isTablet && styles.tabletInfoCard
                  ]}>
                    <Text style={[
                      styles.infoTitle,
                      isTablet && styles.tabletInfoTitle
                    ]}>
                      Ready to Start
                    </Text>
                    <Text style={[
                      styles.infoText,
                      isTablet && styles.tabletInfoText
                    ]}>
                      • Ensure device is powered on{'\n'}
                      • Connect to "AEROSPIN CONTROL" WiFi{'\n'}
                      • Start a session to access controls{'\n'}
                      • Dashboard will be available during active sessions{'\n'}
                      • Brake positions are preserved during operations
                    </Text>
                  </View>
                )}
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                {deviceState.sessionActive && (
                  <SessionReport sessionData={sessionData} />
                )}
                
                {/* Enhanced Connection Diagnostics for Android */}
                {!isConnected && (
                  <View style={[
                    styles.diagnosticsCard,
                    isTablet && styles.tabletDiagnosticsCard
                  ]}>
                    <Text style={[
                      styles.diagnosticsTitle,
                      isTablet && styles.tabletDiagnosticsTitle
                    ]}>
                      Android Connection Diagnostics
                    </Text>
                    
                    <View style={styles.diagnosticItem}>
                      <Text style={[
                        styles.diagnosticLabel,
                        isTablet && styles.tabletDiagnosticLabel
                      ]}>
                        WiFi Network:
                      </Text>
                      <Text style={[
                        styles.diagnosticValue,
                        isTablet && styles.tabletDiagnosticValue,
                        { color: networkDetection.isConnectedToArduinoWifi ? '#22c55e' : '#ef4444' }
                      ]}>
                        {networkDetection.networkInfo.ssid || 'Not connected'}
                      </Text>
                    </View>
                    
                    <View style={styles.diagnosticItem}>
                      <Text style={[
                        styles.diagnosticLabel,
                        isTablet && styles.tabletDiagnosticLabel
                      ]}>
                        IP Address:
                      </Text>
                      <Text style={[
                        styles.diagnosticValue,
                        isTablet && styles.tabletDiagnosticValue
                      ]}>
                        {networkDetection.networkInfo.ipAddress || 'Not assigned'}
                      </Text>
                    </View>
                    
                    <View style={styles.diagnosticItem}>
                      <Text style={[
                        styles.diagnosticLabel,
                        isTablet && styles.tabletDiagnosticLabel
                      ]}>
                        Arduino Reachable:
                      </Text>
                      <Text style={[
                        styles.diagnosticValue,
                        isTablet && styles.tabletDiagnosticValue,
                        { color: networkDetection.isArduinoReachable ? '#22c55e' : '#ef4444' }
                      ]}>
                        {networkDetection.isArduinoReachable ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    
                    <View style={styles.diagnosticItem}>
                      <Text style={[
                        styles.diagnosticLabel,
                        isTablet && styles.tabletDiagnosticLabel
                      ]}>
                        Arduino Response:
                      </Text>
                      <Text style={[
                        styles.diagnosticValue,
                        isTablet && styles.tabletDiagnosticValue,
                        { color: networkDetection.isArduinoResponding ? '#22c55e' : '#ef4444' }
                      ]}>
                        {networkDetection.isArduinoResponding ? 'Active' : 'No Response'}
                      </Text>
                    </View>
                    
                    <View style={styles.diagnosticItem}>
                      <Text style={[
                        styles.diagnosticLabel,
                        isTablet && styles.tabletDiagnosticLabel
                      ]}>
                        Connection Quality:
                      </Text>
                      <Text style={[
                        styles.diagnosticValue,
                        isTablet && styles.tabletDiagnosticValue,
                        { 
                          color: networkDetection.connectionQuality === 'excellent' ? '#22c55e' :
                                 networkDetection.connectionQuality === 'good' ? '#84cc16' :
                                 networkDetection.connectionQuality === 'poor' ? '#f59e0b' : '#ef4444'
                        }
                      ]}>
                        {networkDetection.connectionQuality.charAt(0).toUpperCase() + networkDetection.connectionQuality.slice(1)}
                      </Text>
                    </View>

                    {/* Android-specific troubleshooting */}
                    <View style={styles.troubleshootingSection}>
                      <Text style={[
                        styles.troubleshootingTitle,
                        isTablet && styles.tabletTroubleshootingTitle
                      ]}>
                        Android Troubleshooting:
                      </Text>
                      <Text style={[
                        styles.troubleshootingText,
                        isTablet && styles.tabletTroubleshootingText
                      ]}>
                        • Ensure WiFi is enabled{'\n'}
                        • Connect to "AEROSPIN CONTROL" network{'\n'}
                        • Check if device IP is 192.168.4.1{'\n'}
                        • Try refreshing connection{'\n'}
                        • Restart Arduino if needed
                      </Text>
                    </View>
                  </View>
                )}
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
    paddingBottom: 120, // Extra padding for tab bar
  },
  tabletScrollContent: {
    padding: 24,
    paddingBottom: 140, // Extra padding for tab bar on tablets
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
  card: {
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
  tabletCard: {
    padding: 24,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
  },
  tabletSectionTitle: {
    fontSize: 24,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabletSectionDescription: {
    fontSize: 16,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  tabletInfoCard: {
    padding: 24,
    borderRadius: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabletInfoTitle: {
    fontSize: 22,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
  tabletInfoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  diagnosticsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabletDiagnosticsCard: {
    padding: 24,
    borderRadius: 20,
  },
  diagnosticsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletDiagnosticsTitle: {
    fontSize: 20,
    marginBottom: 20,
  },
  diagnosticItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  diagnosticLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  tabletDiagnosticLabel: {
    fontSize: 16,
  },
  diagnosticValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  tabletDiagnosticValue: {
    fontSize: 16,
  },
  troubleshootingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  tabletTroubleshootingTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  troubleshootingText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7f1d1d',
    lineHeight: 18,
  },
  tabletTroubleshootingText: {
    fontSize: 14,
    lineHeight: 20,
  },
});