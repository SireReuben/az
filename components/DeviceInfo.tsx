import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, MapPin, Activity } from 'lucide-react-native';

export function DeviceInfo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Device Information</Text>
      
      <View style={styles.infoItem}>
        <Wifi size={20} color="#3b82f6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>SSID</Text>
          <Text style={styles.infoValue}>AEROSPIN CONTROL</Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <MapPin size={20} color="#3b82f6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>IP Address</Text>
          <Text style={styles.infoValue}>192.168.4.1</Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Activity size={20} color="#3b82f6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Device Status</Text>
          <Text style={styles.infoValue}>Online</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
});