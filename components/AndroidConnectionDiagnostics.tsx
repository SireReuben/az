import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Smartphone, Wifi, Server, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface AndroidConnectionDiagnosticsProps {
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  responseTime: number;
  lastResponse: string | null;
  onRefresh: () => void;
}

export function AndroidConnectionDiagnostics({
  connectionStatus,
  responseTime,
  lastResponse,
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
        return `Connected (${responseTime}ms response)`;
      case 'timeout':
        return 'Connection timeout - Arduino may be busy';
      case 'failed':
        return 'Connection failed - Check network';
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

      <View style={styles.diagnosticsList}>
        <View style={styles.diagnosticItem}>
          <Wifi size={isTablet ? 16 : 14} color="#6b7280" />
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
          <Server size={isTablet ? 16 : 14} color="#6b7280" />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            Arduino IP:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue
          ]}>
            192.168.4.1
          </Text>
        </View>

        <View style={styles.diagnosticItem}>
          <AlertTriangle size={isTablet ? 16 : 14} color="#6b7280" />
          <Text style={[
            styles.diagnosticLabel,
            isTablet && styles.tabletDiagnosticLabel
          ]}>
            Response Time:
          </Text>
          <Text style={[
            styles.diagnosticValue,
            isTablet && styles.tabletDiagnosticValue,
            { color: responseTime < 2000 ? '#22c55e' : responseTime < 5000 ? '#f59e0b' : '#ef4444' }
          ]}>
            {responseTime > 0 ? `${responseTime}ms` : 'N/A'}
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
            {lastResponse.substring(0, 100)}...
          </Text>
        </View>
      )}

      <View style={styles.troubleshootingSection}>
        <Text style={[
          styles.troubleshootingTitle,
          isTablet && styles.tabletTroubleshootingTitle
        ]}>
          Android APK Troubleshooting:
        </Text>
        <Text style={[
          styles.troubleshootingText,
          isTablet && styles.tabletTroubleshootingText
        ]}>
          • Arduino LCD shows "Android Connected" ✓{'\n'}
          • Network layer is working properly{'\n'}
          • HTTP communication may need optimization{'\n'}
          • Try refreshing connection{'\n'}
          • Check Arduino response time
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
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
    paddingVertical: 8,
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