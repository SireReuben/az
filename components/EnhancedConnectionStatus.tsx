import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Wifi, 
  WifiOff, 
  Circle, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Router,
  Smartphone,
  Server
} from 'lucide-react-native';
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
      return 'Checking connection...';
    }
    
    if (isConnected) {
      return `Connected (${connectionQuality})`;
    }
    
    if (!networkInfo.isWifiEnabled) {
      return 'WiFi disabled';
    }
    
    if (!isConnectedToArduinoWifi) {
      return 'Not connected to AEROSPIN CONTROL';
    }
    
    if (!isArduinoReachable) {
      return 'Arduino not reachable';
    }
    
    if (!isArduinoResponding) {
      return 'Arduino not responding';
    }
    
    return 'Connection failed';
  };

  const getStatusColor = () => {
    if (detectionStatus === 'checking') return '#f59e0b';
    if (isConnected) return '#22c55e';
    if (isConnectedToArduinoWifi) return '#f59e0b';
    return '#ef4444';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'poor': return '#f59e0b';
      default: return '#ef4444';
    }
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

      {/* Detailed Status (when showDetails is true) */}
      {showDetails && (
        <View style={[
          styles.detailsContainer,
          isTablet && styles.tabletDetailsContainer
        ]}>
          {/* Network Layer */}
          <View style={styles.layerStatus}>
            <View style={styles.layerHeader}>
              <Smartphone size={isTablet ? 16 : 14} color="#6b7280" />
              <Text style={[
                styles.layerTitle,
                isTablet && styles.tabletLayerTitle
              ]}>
                Network Layer
              </Text>
            </View>
            <View style={styles.layerDetails}>
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  isTablet && styles.tabletDetailLabel
                ]}>
                  WiFi:
                </Text>
                <View style={styles.detailValue}>
                  <Circle 
                    size={8} 
                    color={networkInfo.isWifiEnabled ? '#22c55e' : '#ef4444'} 
                    fill={networkInfo.isWifiEnabled ? '#22c55e' : '#ef4444'}
                  />
                  <Text style={[
                    styles.detailText,
                    isTablet && styles.tabletDetailText
                  ]}>
                    {networkInfo.isWifiEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  isTablet && styles.tabletDetailLabel
                ]}>
                  SSID:
                </Text>
                <Text style={[
                  styles.detailText,
                  isTablet && styles.tabletDetailText,
                  { color: networkInfo.ssid === 'AEROSPIN CONTROL' ? '#22c55e' : '#ef4444' }
                ]}>
                  {networkInfo.ssid || 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  isTablet && styles.tabletDetailLabel
                ]}>
                  IP:
                </Text>
                <Text style={[
                  styles.detailText,
                  isTablet && styles.tabletDetailText
                ]}>
                  {networkInfo.ipAddress || 'Not assigned'}
                </Text>
              </View>
            </View>
          </View>

          {/* Transport Layer */}
          <View style={styles.layerStatus}>
            <View style={styles.layerHeader}>
              <Router size={isTablet ? 16 : 14} color="#6b7280" />
              <Text style={[
                styles.layerTitle,
                isTablet && styles.tabletLayerTitle
              ]}>
                Transport Layer
              </Text>
            </View>
            <View style={styles.layerDetails}>
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  isTablet && styles.tabletDetailLabel
                ]}>
                  TCP Connection:
                </Text>
                <View style={styles.detailValue}>
                  <Circle 
                    size={8} 
                    color={isArduinoReachable ? '#22c55e' : '#ef4444'} 
                    fill={isArduinoReachable ? '#22c55e' : '#ef4444'}
                  />
                  <Text style={[
                    styles.detailText,
                    isTablet && styles.tabletDetailText
                  ]}>
                    {isArduinoReachable ? 'Established' : 'Failed'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Application Layer */}
          <View style={styles.layerStatus}>
            <View style={styles.layerHeader}>
              <Server size={isTablet ? 16 : 14} color="#6b7280" />
              <Text style={[
                styles.layerTitle,
                isTablet && styles.tabletLayerTitle
              ]}>
                Application Layer
              </Text>
            </View>
            <View style={styles.layerDetails}>
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  isTablet && styles.tabletDetailLabel
                ]}>
                  Arduino Response:
                </Text>
                <View style={styles.detailValue}>
                  <Circle 
                    size={8} 
                    color={isArduinoResponding ? '#22c55e' : '#ef4444'} 
                    fill={isArduinoResponding ? '#22c55e' : '#ef4444'}
                  />
                  <Text style={[
                    styles.detailText,
                    isTablet && styles.tabletDetailText
                  ]}>
                    {isArduinoResponding ? 'Active' : 'No response'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  isTablet && styles.tabletDetailLabel
                ]}>
                  Quality:
                </Text>
                <View style={styles.detailValue}>
                  <Circle 
                    size={8} 
                    color={getQualityColor(connectionQuality)} 
                    fill={getQualityColor(connectionQuality)}
                  />
                  <Text style={[
                    styles.detailText,
                    isTablet && styles.tabletDetailText,
                    { color: getQualityColor(connectionQuality) }
                  ]}>
                    {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
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
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabletDetailsContainer: {
    marginTop: 20,
    paddingTop: 20,
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
    color: '#e0f2fe',
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
    color: '#b0c4de',
    flex: 1,
  },
  tabletDetailLabel: {
    fontSize: 13,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    marginLeft: 4,
  },
  tabletDetailText: {
    fontSize: 13,
    marginLeft: 6,
  },
});