import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, Circle, RefreshCw, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';

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

  // Pulse animation for connection status
  const pulseAnimation = useSharedValue(0);
  
  React.useEffect(() => {
    if (isConnected) {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
    } else {
      pulseAnimation.value = 0;
    }
  }, [isConnected, pulseAnimation]);

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
      return 'Establishing Connection...';
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

  const animatedPulseStyle = useAnimatedStyle(() => ({
    shadowOpacity: isConnected ? interpolate(pulseAnimation.value, [0, 1], [0.2, 0.6]) : 0,
    shadowRadius: isConnected ? interpolate(pulseAnimation.value, [0, 1], [8, 16]) : 0,
  }));

  return (
    <Animated.View style={[
      styles.container,
      isTablet && styles.tabletContainer,
      animatedPulseStyle,
      {
        shadowColor: getStatusColor(),
        borderColor: `${getStatusColor()}40`,
      }
    ]}>
      {/* Main Status Row */}
      <View style={styles.mainStatus}>
        <View style={styles.statusRow}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${getStatusColor()}20` }
          ]}>
            {getStatusIcon()}
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[
              styles.statusText,
              isTablet && styles.tabletStatusText,
              { color: getStatusColor() }
            ]}>
              {getStatusText()}
            </Text>
            {isConnected && (
              <Text style={styles.qualityText}>
                Signal strength: {connectionQuality.toUpperCase()}
              </Text>
            )}
          </View>
        </View>
        
        {onRefresh && (
          <TouchableOpacity
            style={[
              styles.refreshButton,
              isTablet && styles.tabletRefreshButton,
              { borderColor: `${getStatusColor()}40` }
            ]}
            onPress={onRefresh}
          >
            <RefreshCw size={isTablet ? 18 : 14} color={getStatusColor()} />
          </TouchableOpacity>
        )}
      </View>

      {/* Connection Details */}
      {showDetails && !isConnected && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Connection Help:</Text>
          <View style={styles.helpSteps}>
            <View style={styles.helpStep}>
              <Circle size={6} color="#64748b" />
              <Text style={styles.helpText}>Ensure Arduino device is powered on</Text>
            </View>
            <View style={styles.helpStep}>
              <Circle size={6} color="#64748b" />
              <Text style={styles.helpText}>Connect to "AEROSPIN CONTROL" WiFi network</Text>
            </View>
            <View style={styles.helpStep}>
              <Circle size={6} color="#64748b" />
              <Text style={styles.helpText}>Wait for automatic connection</Text>
            </View>
            <View style={styles.helpStep}>
              <Circle size={6} color="#64748b" />
              <Text style={styles.helpText}>Try refreshing if connection fails</Text>
            </View>
          </View>
        </View>
      )}

      {/* Connection Quality Indicator */}
      {isConnected && (
        <View style={styles.qualityIndicator}>
          <View style={styles.qualityBars}>
            {[1, 2, 3, 4].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.qualityBar,
                  {
                    height: bar * 4 + 8,
                    backgroundColor: connectionQuality === 'excellent' ? '#22c55e' :
                                   connectionQuality === 'good' ? '#f59e0b' : '#ef4444',
                    opacity: connectionQuality === 'excellent' ? 1 :
                            connectionQuality === 'good' && bar <= 3 ? 1 :
                            connectionQuality === 'poor' && bar <= 2 ? 1 : 0.3,
                  }
                ]}
              />
            ))}
          </View>
          <Text style={styles.qualityLabel}>Signal Quality</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
  },
  tabletContainer: {
    padding: 20,
    borderRadius: 20,
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
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabletStatusText: {
    fontSize: 16,
  },
  qualityText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabletRefreshButton: {
    padding: 10,
    borderRadius: 10,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#94a3b8',
    marginBottom: 12,
  },
  helpSteps: {
    gap: 8,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    flex: 1,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  qualityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  qualityBar: {
    width: 4,
    borderRadius: 2,
  },
  qualityLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
});