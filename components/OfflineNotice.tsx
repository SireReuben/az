import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export function OfflineNotice() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <WifiOff size={20} color="#ef4444" />
        <Text style={styles.title}>Offline Mode</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <AlertTriangle size={16} color="#f59e0b" />
          <Text style={styles.infoText}>
            Device not connected - Operating in offline mode
          </Text>
        </View>
        
        <Text style={styles.instructions}>
          To connect to your AEROSPIN device:
        </Text>
        
        <Text style={styles.stepText}>
          1. Ensure device is powered on{'\n'}
          2. Connect to "AEROSPIN CONTROL" WiFi network{'\n'}
          3. Wait for automatic connection{'\n'}
          4. Session controls will be enabled when connected
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#dc2626',
    marginLeft: 8,
  },
  content: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#b45309',
    marginLeft: 8,
    flex: 1,
  },
  instructions: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#475569',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    lineHeight: 18,
  },
});