import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Circle } from 'lucide-react-native';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Circle 
          size={12} 
          color={isConnected ? '#22c55e' : '#ef4444'} 
          fill={isConnected ? '#22c55e' : '#ef4444'}
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Device Connected' : 'Device Disconnected'}
        </Text>
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
  },
});