import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, Circle, RefreshCw, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface NetworkInfo {
  ssid: string | null;
  ipAddress: string | null;
  isWifiEnabled: boolean;
  isInternetReachable: boolean;
}

interface EnhancedConnectionStatusProps {
  isConnected: boolean;
  networkDetection: {
    isConnectedToArduinoWifi: boolean;
    isArduinoReachable: boolean;
    isArduinoResponding: boolean;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'none';
    networkInfo: NetworkInfo;
    detectionStatus: 'checking' | 'connected' | 'disconnected' | 'error';
  };
  onRefresh?: () => void;
  showDetails?: boolean;
}

export function EnhancedConnectionStatus({ 
  isConnected, 
  networkDetection, 
  onRefresh,
  showDetails = false 
}: EnhancedConnectionStatusProps) {
  const { isTablet } = useDeviceOrientation();
  
  const {
    isConnectedToArduinoWifi,
    isArduinoReachable,
    isArduinoResponding,
    connectionQuality,
    networkInfo,
    detectionStatus
  } = networkDetection;

  const getStatusIcon = () => {
    if (detectionStatus === 'checking') {
      return <RefreshCw size={isTablet ? 20 : 16} color="#f59e0b" />;
    }
    
    if (isConnected) {
      return <CheckCircle size={isTablet ? 20 : 16} color="#22c55e" />;
    }
    
    if (isConnectedToArduinoWifi && isArduinoReachable) {
      return <AlertTriangle size={isTablet ? 20 : 16} color="#f59e0b" />;
    }
    
    return <XCircle size={isTablet ? 20 : 16} color="#ef4444" />;
  };

  const getStatusText = () => {
    if (detectionStatus === 'checking') {
      return 'Connecting to Arduino...';
    }
    
    if (isConnected) {
      return `Arduino Connected (${connectionQuality})`;
    }
    
    if (!isConnectedToArduinoWifi) {
      return 'Connect to AEROSPIN CONTROL WiFi';
    }
    
    if (!isArduinoReachable) {
      return 'Arduino not reachable - Check device power';
    }
    
    if (!isArduinoResponding) {
      return 'Arduino not responding - Device may be starting';
    }
    
    return 'Connection failed - Try refreshing';
  };

  const getStatusColor = () => {
    if (detectionStatus === 'checking') return '#f59e0b';
    if (isConnected) return '#22c55e';
    if (isConnectedToArduinoWifi) return '#f59e0b';
    return '#ef4444';
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
        
        {onRefresh && (
          <TouchableOpacity
            style={[
              styles.refreshButton,
              isTablet && styles.tabletRefreshButton
            ]}
            onPress={onRefresh}
          >
            <RefreshCw size={isTablet ? 18 : 14} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Simple connection help for non-connected states */}
      {!isConnected && showDetails && (
        <View style={[
          styles.helpContainer,
          isTablet && styles.tabletHelpContainer
        ]}>
          <Text style={[
            styles.helpTitle,
            isTablet && styles.tabletHelpTitle
          ]}>
            Connection Help:
          </Text>
          <Text style={[
            styles.helpText,
            isTablet && styles.tabletHelpText
          ]}>
            1. Ensure Arduino device is powered on{'\n'}
            2. Connect to "AEROSPIN CONTROL" WiFi network{'\n'}
            3. Wait for automatic connection{'\n'}
            4. Try refreshing if connection fails
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  tabletContainer: {
    padding: 16,
    borderRadius: 16,
  },
  mainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
  tabletStatusText: {
    fontSize: 16,
    marginLeft: 12,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabletRefreshButton: {
    padding: 6,
    borderRadius: 8,
  },
  helpContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabletHelpContainer: {
    marginTop: 20,
    paddingTop: 20,
  },
  helpTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#e0f2fe',
    marginBottom: 8,
  },
  tabletHelpTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#e0f2fe',
    lineHeight: 16,
  },
  tabletHelpText: {
    fontSize: 13,
    lineHeight: 18,
  },
});