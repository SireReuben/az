import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Square, WifiOff, Info } from 'lucide-react-native';
import { router } from 'expo-router';

interface SessionControlsProps {
  sessionActive: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  isConnected: boolean;
}

export function SessionControls({ sessionActive, onStartSession, onEndSession, isConnected }: SessionControlsProps) {
  const handleStartSession = () => {
    Alert.alert(
      'Start Session',
      'Starting a session will enable device controls and begin logging all operations. You will be automatically taken to the dashboard. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Session', 
          onPress: () => {
            onStartSession();
            // Navigate to dashboard after starting session with a delay
            setTimeout(() => {
              router.push('/(tabs)');
            }, 1000);
          }
        },
      ]
    );
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Ending the session will stop all device operations and disable controls. All session data will be saved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', onPress: onEndSession, style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.primaryButtonRow}>
        {!sessionActive ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartSession}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.buttonGradient}
            >
              <Play size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Start Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.endButton]}
            onPress={handleEndSession}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.buttonGradient}
            >
              <Square size={20} color="#ffffff" />
              <Text style={styles.buttonText}>End Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {!isConnected && (
        <View style={styles.offlineNotice}>
          <WifiOff size={16} color="#ef4444" />
          <Text style={styles.offlineText}>
            Device offline - Sessions can run in offline mode with limited functionality
          </Text>
        </View>
      )}

      <View style={styles.secondaryButtonRow}>
        <TouchableOpacity
          style={[styles.button, styles.infoButton, styles.secondaryButton]}
          onPress={() => Alert.alert(
            'Session Info',
            'Sessions provide:\n• Safe operation procedures\n• Complete operation logging\n• Emergency stop capabilities\n• Device state management\n• Automatic dashboard access'
          )}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6b7280', '#4b5563']}
            style={styles.secondaryButtonGradient}
          >
            <Info size={16} color="#ffffff" />
            <Text style={styles.secondaryButtonText}>Info</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  primaryButtonRow: {
    alignItems: 'center',
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  startButton: {
    minWidth: 200,
    shadowColor: '#22c55e',
  },
  endButton: {
    minWidth: 200,
    shadowColor: '#ef4444',
  },
  infoButton: {
    shadowColor: '#6b7280',
  },
  secondaryButton: {
    minWidth: 100,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 6,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  offlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
  },
});