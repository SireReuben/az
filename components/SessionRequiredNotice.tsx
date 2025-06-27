import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Lock } from 'lucide-react-native';
import { router } from 'expo-router';

export function SessionRequiredNotice() {
  const handleGoToSessions = () => {
    router.push('/(tabs)/sessions');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock size={48} color="#1e40af" />
      </View>
      
      <Text style={styles.title}>Session Required</Text>
      <Text style={styles.description}>
        Dashboard controls are only available during an active session. 
        Start a session to access device controls and monitoring.
      </Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleGoToSessions}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.buttonGradient}
        >
          <Play size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Go to Session Manager</Text>
        </LinearGradient>
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    lineHeight: 20,
  },
});