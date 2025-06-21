import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Circle, RefreshCw } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface ConnectionStatusProps {
  isConnected: boolean;
  onRefresh?: () => void;
  showRefresh?: boolean;
}

export function ConnectionStatus({ isConnected, onRefresh, showRefresh = false }: ConnectionStatusProps) {
  const { isTablet } = useDeviceOrientation();

  return (
    <View style={[
      styles.container,
      isTablet && styles.tabletContainer
    ]}>
      <View style={styles.statusRow}>
        <Circle 
          size={isTablet ? 14 : 12} 
          color={isConnected ? '#22c55e' : '#ef4444'} 
          fill={isConnected ? '#22c55e' : '#ef4444'}
        />
        <Text style={[
          styles.statusText,
          isTablet && styles.tabletStatusText
        ]}>
          {isConnected ? 'Device Connected' : 'Device Disconnected'}
        </Text>
        
        {showRefresh && onRefresh && (
          <TouchableOpacity
            style={[
              styles.refreshButton,
              isTablet && styles.tabletRefreshButton
            ]}
            onPress={onRefresh}
          >
            <RefreshCw size={isTablet ? 16 : 14} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  tabletStatusText: {
    fontSize: 16,
    marginLeft: 12,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 8,
  },
  tabletRefreshButton: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
});