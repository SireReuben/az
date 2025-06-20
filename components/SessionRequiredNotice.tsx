import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Lock } from 'lucide-react-native';
import { router } from 'expo-router';

export function SessionRequiredNotice() {
  const handleGoToSessions = () => {
    router.push('/(tabs)/sessions');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock size={48} color="#6b7280" />
      </View>
      
      <Text style={styles.title}>Session Required</Text>
      <Text style={styles.description}>
        Dashboard controls are only available during an active session. 
        Start a session to access device controls and monitoring.
      </Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleGoToSessions}
      >
        <Play size={20} color="#ffffff" />
        <Text style={styles.buttonText}>Go to Session Manager</Text>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Why Sessions?</Text>
        <Text style={styles.infoText}>
          • Ensures safe operation with proper initialization{'\n'}
          • Logs all device operations for safety compliance{'\n'}
          • Prevents accidental device activation{'\n'}
          • Provides structured start/stop procedures
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
});