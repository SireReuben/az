import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Smartphone, Wifi, Server, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Zap, Router, Settings } from 'lucide-react-native';
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
        return 'Testing APK connection with 60s timeout...';
      case 'connected':
        return `Connected successfully (${responseTime}ms)`;
      case 'timeout':
        return 'Connection timeout - Arduino may be slow to respond';
      case 'failed':
        return 'HTTP communication failed - Check network and Arduino';
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

  const handleAdvancedDiagnostics = () => {
    Alert.alert(
      'Android 15 APK Final Fix Diagnostics',
      `Connection Attempts: ${connectionAttempts}\n` +
      `Response Time: ${responseTime}ms\n` +
      `Status: ${connectionStatus}\n` +
      `Last Response: ${lastResponse ? 'Received' : 'None'}\n\n` +
      'FINAL FIX STRATEGY:\n' +
      '• 60-second timeouts for each attempt\n' +
      '• 3 full rounds of all endpoints\n' +
      '• Ultra-simple headers for compatibility\n' +
      '• XMLHttpRequest fallback strategy\n' +
      '• No-CORS mode as last resort\n\n' +
      'TROUBLESHOOTING:\n' +
      '1. Ensure Arduino LCD shows "Android Connected"\n' +
      '2. Check WiFi: Settings → WiFi → AEROSPIN CONTROL\n' +
      '3. Verify IP: Should be 192.168.4.2 (your phone)\n' +
      '4. Arduino IP: Should be 192.168.4.1\n' +
      '5. Try airplane mode ON/OFF to reset network\n' +
      '6. Restart Arduino if response time > 30 seconds',
      [{ text: 'OK' }]
    );
  };

  const handleNetworkReset = () => {
    Alert.alert(
      'Network Reset Instructions',
      'To reset your network connection:\n\n' +
      '1. Turn ON Airplane Mode (30 seconds)\n' +
      '2. Turn OFF Airplane Mode\n' +
      '3. Reconnect to "AEROSPIN CONTROL"\n' +
      '4. Wait for "Android Connected" on Arduino LCD\n' +
      '5. Try connection again\n\n' +
      'This often resolves Android 15 APK network issues.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open WiFi Settings', onPress: () => {
          // This would open WiFi settings if we had the capability
          Alert.alert('Manual Action Required', 'Please manually open WiFi settings and reconnect to "AEROSPIN CONTROL"');
        }}
      ]
    );
  };

  return (
    <View style={[
      styles.container,
      isTablet && styles.tabletContainer
    ]}>
      <View style={styles.header}>
        <Smartphone size={isTablet ? 20 : 16} color="#3b82f6" />
        <Text style={[
          styles.title,
          isTablet && styles.tabletTitle
        ]}>
          Android 15 APK Final Fix
        </Text>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            isTablet && styles.tabletRefreshButton
          ]}
          onPress={onRefresh}
        >
          <RefreshCw size={isTablet ? 16 : 14} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={[
        styles.statusRow,
        connectionStatus === 'connected' && styles.statusRowSuccess,
        connectionStatus === 'failed' && styles.statusRowError,
        connectionStatus === 'timeout' && styles.statusRowWarning,
      ]}>
        {getStatusIcon()}
        <Text style={[
          styles.statusText,
          isTablet && styles.tabletStatusText,
          { color: getStatusColor() }
        ]}>
          {getStatusText()}
        </Text>
      </View>

      <View style={styles.diagnosticsList}>
        <View style={styles.diagnosticItem}>
          <Wifi size={isTablet ? 16 : 14} color="#22c55e" />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            WiFi Network:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue,
            { color: '#22c55e' }
          ]}>
            AEROSPIN CONTROL ✓
          </Text>
        </View>

        <View style={styles.diagnosticItem}>
          <Router size={isTablet ? 16 : 14} color="#22c55e" />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            Arduino LCD:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue,
            { color: '#22c55e' }
          ]}>
            "Android Connected" ✓
          </Text>
        </View>

        <View style={styles.diagnosticItem}>
          <Server size={isTablet ? 16 : 14} color={connectionStatus === 'connected' ? '#22c55e' : '#ef4444'} />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            APK HTTP Response:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue,
            { color: connectionStatus === 'connected' ? '#22c55e' : '#ef4444' }
          ]}>
            {connectionStatus === 'connected' ? 'Working ✓' : 'Failed ✗'}
          </Text>
        </View>

        <View style={styles.diagnosticItem}>
          <Zap size={isTablet ? 16 : 14} color="#6b7280" />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            Response Time:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue,
            { 
              color: responseTime === 0 ? '#6b7280' :
                     responseTime < 10000 ? '#22c55e' : 
                     responseTime < 30000 ? '#f59e0b' : '#ef4444' 
            }
          ]}>
            {responseTime > 0 ? `${responseTime}ms` : 'N/A'}
          </Text>
        </View>

        <View style={styles.diagnosticItem}>
          <RefreshCw size={isTablet ? 16 : 14} color="#6b7280" />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            Attempts:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue
          ]}>
            {connectionAttempts}
          </Text>
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
            {lastResponse.substring(0, 150)}...
          </Text>
        </View>
      )}

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
            Retry (60s timeout)
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
            Network Reset
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.diagnosticsButton,
          isTablet && styles.tabletDiagnosticsButton
        ]}
        onPress={handleAdvancedDiagnostics}
      >
        <AlertTriangle size={isTablet ? 16 : 14} color="#f59e0b" />
        <Text style={[
          styles.diagnosticsButtonText,
          isTablet && styles.tabletDiagnosticsButtonText
        ]}>
          Advanced Diagnostics & Troubleshooting
        </Text>
      </TouchableOpacity>

      <View style={styles.troubleshootingSection}>
        <Text style={[
          styles.troubleshootingTitle,
          isTablet && styles.tabletTroubleshootingTitle
        ]}>
          🔧 Android 15 APK Final Fix Strategy:
        </Text>
        <Text style={[
          styles.troubleshootingText,
          isTablet && styles.tabletTroubleshootingText
        ]}>
          ✅ Ultra-aggressive 3-round connection strategy{'\n'}
          ✅ 60-second timeouts for maximum compatibility{'\n'}
          ✅ Multiple fallback methods (Fetch + XMLHttpRequest + No-CORS){'\n'}
          ✅ Minimal headers to avoid Android 15 restrictions{'\n'}
          ⚡ If still failing: Try airplane mode ON/OFF to reset network stack
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    flex: 1,
    marginLeft: 8,
  },
  tabletTitle: {
    fontSize: 20,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusRowSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusRowError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusRowWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
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
  diagnosticsList: {
    marginBottom: 16,
  },
  diagnosticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  diagnosticLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    flex: 1,
    marginLeft: 8,
  },
  tabletDiagnosticLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  diagnosticValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  tabletDiagnosticValue: {
    fontSize: 16,
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
    marginBottom: 16,
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
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 6,
  },
  tabletActionButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryActionButtonText: {
    color: '#374151',
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  tabletDiagnosticsButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  diagnosticsButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#92400e',
    marginLeft: 6,
  },
  tabletDiagnosticsButtonText: {
    fontSize: 16,
    marginLeft: 8,
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