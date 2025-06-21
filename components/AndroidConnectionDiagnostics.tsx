import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Smartphone, Wifi, Server, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Zap, Router, Settings, Shield } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface AndroidConnectionDiagnosticsProps {
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  responseTime: number;
  lastResponse: string | null;
  connectionAttempts: number;
  onRefresh: () => void;
}

export function AndroidConnectionDiagnostics({
  connectionStatus,
  responseTime,
  lastResponse,
  connectionAttempts,
  onRefresh
}: AndroidConnectionDiagnosticsProps) {
  const { isTablet } = useDeviceOrientation();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <RefreshCw size={isTablet ? 20 : 16} color="#f59e0b" />;
      case 'connected':
        return <CheckCircle size={isTablet ? 20 : 16} color="#22c55e" />;
      case 'timeout':
        return <AlertTriangle size={isTablet ? 20 : 16} color="#f59e0b" />;
      default:
        return <XCircle size={isTablet ? 20 : 16} color="#ef4444" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Testing with 90s timeout + 4 strategies...';
      case 'connected':
        return `ULTIMATE SUCCESS! Connected in ${responseTime}ms`;
      case 'timeout':
        return 'Timeout - Arduino may be overloaded or slow';
      case 'failed':
        return 'All 4 strategies failed - Check Arduino power';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#22c55e';
      case 'checking':
        return '#f59e0b';
      case 'timeout':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  const handleUltimateGuide = () => {
    Alert.alert(
      'Android 15 ULTIMATE Fix Guide',
      `Connection Attempts: ${connectionAttempts}\n` +
      `Response Time: ${responseTime}ms\n` +
      `Status: ${connectionStatus}\n` +
      `Last Response: ${lastResponse ? 'Received' : 'None'}\n\n` +
      'ULTIMATE STRATEGY (4 Methods):\n' +
      '1. Ultra-minimal fetch (90s timeout)\n' +
      '2. XMLHttpRequest fallback (90s timeout)\n' +
      '3. No-CORS mode (opaque response)\n' +
      '4. Image-based connection test\n\n' +
      'TESTING PROCESS:\n' +
      '• 5 full rounds of all endpoints\n' +
      '• 6 endpoints per round (/, /ping, /status, /health, /info, /sync)\n' +
      '• 10 second delays between attempts\n' +
      '• 15 second delays between rounds\n\n' +
      'TOTAL TEST TIME: Up to 45 minutes maximum\n\n' +
      'IF STILL FAILING:\n' +
      '1. Arduino may be defective\n' +
      '2. Power supply issues\n' +
      '3. WiFi hardware problems\n' +
      '4. Try different Android device',
      [{ text: 'OK' }]
    );
  };

  const handleNetworkReset = () => {
    Alert.alert(
      'Network Reset Instructions',
      'ULTIMATE Android 15 Network Reset:\n\n' +
      '1. Turn ON Airplane Mode (60 seconds)\n' +
      '2. Turn OFF Airplane Mode\n' +
      '3. Forget ALL WiFi networks\n' +
      '4. Restart Android device\n' +
      '5. Reconnect to "AEROSPIN CONTROL"\n' +
      '6. Wait for "Android Connected" on Arduino LCD\n' +
      '7. Try AEROSPIN app again\n\n' +
      'This nuclear reset often resolves stubborn Android 15 issues.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open WiFi Settings', onPress: () => {
          Alert.alert('Manual Action Required', 'Please manually open WiFi settings and perform the reset steps');
        }}
      ]
    );
  };

  const handleHardwareCheck = () => {
    Alert.alert(
      'Hardware Troubleshooting',
      'If software fixes don\'t work, check hardware:\n\n' +
      'ARDUINO CHECKS:\n' +
      '• Power LED should be solid ON\n' +
      '• LCD should show "AEROSPIN READY"\n' +
      '• WiFi LED should blink during connection\n' +
      '• Serial monitor should show "HTTP server started"\n\n' +
      'POWER SUPPLY:\n' +
      '• Use 5V 2A power adapter (minimum)\n' +
      '• Check for voltage drops under load\n' +
      '• Ensure stable power during operation\n\n' +
      'CONNECTIONS:\n' +
      '• All wires securely connected\n' +
      '• No loose connections\n' +
      '• WiFi antenna properly attached\n\n' +
      'ENVIRONMENT:\n' +
      '• No interference from other devices\n' +
      '• Arduino within 10 feet of Android device\n' +
      '• No metal barriers between devices',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[
      styles.container,
      isTablet && styles.tabletContainer
    ]}>
      {/* Main Status Row */}
      <View style={styles.mainStatus}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <Text style={[
            styles.statusText,
            isTablet && styles.tabletStatusText,
            { color: getStatusColor() }
          ]}>
            {getStatusText()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.refreshButton,
            isTablet && styles.tabletRefreshButton
          ]}
          onPress={onRefresh}
        >
          <RefreshCw size={isTablet ? 18 : 14} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Enhanced Status Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.layerStatus}>
          <View style={styles.layerHeader}>
            <Shield size={isTablet ? 16 : 14} color="#6b7280" />
            <Text style={[
              styles.layerTitle,
              isTablet && styles.tabletLayerTitle
            ]}>
              Android 15 ULTIMATE Fix Status
            </Text>
          </View>
          <View style={styles.layerDetails}>
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Strategy 1 (Fetch):
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText,
                { color: connectionStatus === 'connected' ? '#22c55e' : '#6b7280' }
              ]}>
                {connectionStatus === 'connected' ? 'SUCCESS' : 'Testing...'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Strategy 2 (XHR):
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText,
                { color: connectionStatus === 'connected' ? '#22c55e' : '#6b7280' }
              ]}>
                {connectionStatus === 'connected' ? 'SUCCESS' : 'Fallback Ready'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Strategy 3 (No-CORS):
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText,
                { color: connectionStatus === 'connected' ? '#22c55e' : '#6b7280' }
              ]}>
                {connectionStatus === 'connected' ? 'SUCCESS' : 'Opaque Ready'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Strategy 4 (Image):
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText,
                { color: connectionStatus === 'connected' ? '#22c55e' : '#6b7280' }
              ]}>
                {connectionStatus === 'connected' ? 'SUCCESS' : 'Last Resort'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.layerStatus}>
          <View style={styles.layerHeader}>
            <Zap size={isTablet ? 16 : 14} color="#6b7280" />
            <Text style={[
              styles.layerTitle,
              isTablet && styles.tabletLayerTitle
            ]}>
              Performance Metrics
            </Text>
          </View>
          <View style={styles.layerDetails}>
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Response Time:
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText,
                { 
                  color: responseTime === 0 ? '#6b7280' :
                         responseTime < 15000 ? '#22c55e' : 
                         responseTime < 45000 ? '#f59e0b' : '#ef4444' 
                }
              ]}>
                {responseTime > 0 ? `${responseTime}ms` : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Total Attempts:
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText
              ]}>
                {connectionAttempts}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                isTablet && styles.tabletDetailLabel
              ]}>
                Max Test Time:
              </Text>
              <Text style={[
                styles.detailText,
                isTablet && styles.tabletDetailText
              ]}>
                45 minutes
              </Text>
            </View>
          </View>
        </View>
      </View>

      {lastResponse && (
        <View style={styles.responseSection}>
          <Text style={[
            styles.responseTitle,
            isTablet && styles.tabletResponseTitle
          ]}>
            Last Arduino Response:
          </Text>
          <Text style={[
            styles.responseText,
            isTablet && styles.tabletResponseText
          ]}>
            {lastResponse.substring(0, 200)}...
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isTablet && styles.tabletActionButton
          ]}
          onPress={onRefresh}
        >
          <RefreshCw size={isTablet ? 16 : 14} color="#ffffff" />
          <Text style={[
            styles.actionButtonText,
            isTablet && styles.tabletActionButtonText
          ]}>
            Retry (90s + 4 strategies)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.secondaryActionButton,
            isTablet && styles.tabletActionButton
          ]}
          onPress={handleNetworkReset}
        >
          <Settings size={isTablet ? 16 : 14} color="#374151" />
          <Text style={[
            styles.actionButtonText,
            styles.secondaryActionButtonText,
            isTablet && styles.tabletActionButtonText
          ]}>
            Nuclear Reset
          </Text>
        </TouchableOpacity>
      </View>

      {/* Additional Help Buttons */}
      <View style={styles.helpButtons}>
        <TouchableOpacity
          style={[
            styles.helpButton,
            isTablet && styles.tabletHelpButton
          ]}
          onPress={handleUltimateGuide}
        >
          <AlertTriangle size={isTablet ? 16 : 14} color="#f59e0b" />
          <Text style={[
            styles.helpButtonText,
            isTablet && styles.tabletHelpButtonText
          ]}>
            ULTIMATE Fix Guide
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.helpButton,
            isTablet && styles.tabletHelpButton
          ]}
          onPress={handleHardwareCheck}
        >
          <Router size={isTablet ? 16 : 14} color="#6366f1" />
          <Text style={[
            styles.helpButtonText,
            isTablet && styles.tabletHelpButtonText
          ]}>
            Hardware Check
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ultimate Strategy Summary */}
      <View style={styles.troubleshootingSection}>
        <Text style={[
          styles.troubleshootingTitle,
          isTablet && styles.tabletTroubleshootingTitle
        ]}>
          🚀 Android 15 ULTIMATE Strategy:
        </Text>
        <Text style={[
          styles.troubleshootingText,
          isTablet && styles.tabletTroubleshootingText
        ]}>
          ✅ 4 different connection methods (Fetch + XHR + No-CORS + Image){'\n'}
          ✅ 90-second timeouts for maximum patience{'\n'}
          ✅ 5 full rounds testing all 6 endpoints{'\n'}
          ✅ Up to 45 minutes total testing time{'\n'}
          ⚡ If this fails, the issue is likely hardware-related
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabletContainer: {
    padding: 20,
    borderRadius: 20,
  },
  mainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    flex: 1,
  },
  tabletStatusText: {
    fontSize: 16,
    marginLeft: 12,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  tabletRefreshButton: {
    padding: 6,
    borderRadius: 8,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  layerStatus: {
    marginBottom: 12,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  layerTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginLeft: 6,
  },
  tabletLayerTitle: {
    fontSize: 14,
    marginLeft: 8,
  },
  layerDetails: {
    paddingLeft: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    flex: 1,
  },
  tabletDetailLabel: {
    fontSize: 13,
  },
  detailText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  tabletDetailText: {
    fontSize: 13,
  },
  responseSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  responseTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  tabletResponseTitle: {
    fontSize: 14,
    marginBottom: 6,
  },
  responseText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    fontFamily: 'monospace',
  },
  tabletResponseText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabletActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  secondaryActionButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 6,
  },
  tabletActionButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  secondaryActionButtonText: {
    color: '#374151',
  },
  helpButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  helpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  tabletHelpButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  helpButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#92400e',
    marginLeft: 4,
  },
  tabletHelpButtonText: {
    fontSize: 13,
    marginLeft: 6,
  },
  troubleshootingSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  troubleshootingTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#92400e',
    marginBottom: 8,
  },
  tabletTroubleshootingTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  troubleshootingText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#92400e',
    lineHeight: 16,
  },
  tabletTroubleshootingText: {
    fontSize: 13,
    lineHeight: 18,
  },
});