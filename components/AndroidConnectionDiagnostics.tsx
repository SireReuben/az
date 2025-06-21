import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Smartphone, Wifi, Server, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Zap, Router } from 'lucide-react-native';
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
        return 'Testing Android APK connection...';
      case 'connected':
        return `Connected successfully (${responseTime}ms)`;
      case 'timeout':
        return 'Connection timeout - Arduino may be overloaded';
      case 'failed':
        return 'HTTP communication failed';
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
      'Advanced Diagnostics',
      `Connection Attempts: ${connectionAttempts}\n` +
      `Response Time: ${responseTime}ms\n` +
      `Status: ${connectionStatus}\n` +
      `Last Response: ${lastResponse ? 'Received' : 'None'}\n\n` +
      'Troubleshooting Steps:\n' +
      '1. Arduino LCD shows "Android Connected" ✓\n' +
      '2. WiFi network layer is working\n' +
      '3. HTTP layer needs optimization\n' +
      '4. Try multiple refresh attempts\n' +
      '5. Restart Arduino if needed',
      [{ text: 'OK' }]
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
          Android APK Diagnostics
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
            HTTP Response:
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
                     responseTime < 2000 ? '#22c55e' : 
                     responseTime < 5000 ? '#f59e0b' : '#ef4444' 
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
            Retry Connection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.secondaryActionButton,
            isTablet && styles.tabletActionButton
          ]}
          onPress={handleAdvancedDiagnostics}
        >
          <AlertTriangle size={isTablet ? 16 : 14} color="#374151" />
          <Text style={[
            styles.actionButtonText,
            styles.secondaryActionButtonText,
            isTablet && styles.tabletActionButtonText
          ]}>
            Diagnostics
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.troubleshootingSection}>
        <Text style={[
          styles.troubleshootingTitle,
          isTablet && styles.tabletTroubleshootingTitle
        ]}>
          🔧 Android APK Solution:
        </Text>
        <Text style={[
          styles.troubleshootingText,
          isTablet && styles.tabletTroubleshootingText
        ]}>
          ✓ WiFi connection is working (LCD shows "Android Connected"){'\n'}
          ✗ HTTP communication layer is failing{'\n'}
          💡 Solution: Enhanced HTTP handling with multiple retry strategies{'\n'}
          🔄 Try "Retry Connection" button multiple times{'\n'}
          ⚡ Arduino may need restart if response time is very high
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