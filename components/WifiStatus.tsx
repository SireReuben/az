import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';

interface WifiStatusProps {
  isConnected: boolean;
}

export function WifiStatus({ isConnected }: WifiStatusProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, isConnected ? styles.connected : styles.disconnected]}>
        {isConnected ? (
          <Wifi size={32} color="#ffffff" />
        ) : (
          <WifiOff size={32} color="#ffffff" />
        )}
      </View>
      <Text style={styles.statusText}>
        {isConnected ? 'Connected to AEROSPIN CONTROL' : 'Connecting to AEROSPIN CONTROL...'}
      </Text>
      <Text style={styles.subText}>
        {isConnected ? 'Device Ready' : 'Please wait...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  connected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  disconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e0f2fe',
    textAlign: 'center',
  },
});