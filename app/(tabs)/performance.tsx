import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { ContextualHelp } from '@/components/ContextualHelp';
import { VisualFeedback } from '@/components/VisualFeedbackSystem';
import { GestureControls } from '@/components/GestureControls';
import OptimizedControl from '@/components/OptimizedDeviceControls';
import { useOptimizedTouch } from '@/hooks/useOptimizedTouch';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { Settings, Zap, Gauge, CircleHelp as HelpCircle } from 'lucide-react-native';

export default function PerformanceScreen() {
  const { height } = useDeviceOrientation();
  const { createOptimizedHandler, triggerHaptic } = useOptimizedTouch();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [testSpeed, setTestSpeed] = useState(50);

  const showFeedback = (type: 'success' | 'error' | 'warning' | 'info') => {
    setFeedbackType(type);
    setFeedbackVisible(true);
  };

  const helpContent = {
    title: 'Performance Optimization',
    description: 'This screen demonstrates various performance optimizations and UI enhancements for your offline Android app.',
    steps: [
      'Monitor real-time performance metrics',
      'Test optimized touch interactions',
      'Experience gesture-based controls',
      'View visual feedback systems'
    ],
    tips: [
      'Use haptic feedback for better user experience',
      'Monitor memory usage to prevent crashes',
      'Implement gesture controls for advanced users',
      'Provide contextual help for complex features'
    ]
  };

  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6']}
      style={[styles.container, { minHeight: height }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <VisualFeedback 
          type={feedbackType}
          visible={feedbackVisible}
          onComplete={() => setFeedbackVisible(false)}
        />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: height - 120 }
          ]}
        >
          <ResponsiveContainer fillScreen={true}>
            <StatusHeader />
            
            <View style={styles.headerSection}>
              <Text style={styles.title}>Performance Optimization</Text>
              <ContextualHelp content={helpContent} />
            </View>

            {/* Performance Monitor */}
            <PerformanceMonitor />

            {/* Optimized Controls Demo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Optimized Touch Controls</Text>
              <Text style={styles.sectionDescription}>
                Experience enhanced touch interactions with haptic feedback
              </Text>
              
              <View style={styles.controlsGrid}>
                <OptimizedControl
                  title="Success"
                  icon={<Zap size={20} color="#ffffff" />}
                  onPress={createOptimizedHandler(() => showFeedback('success'), { haptic: 'light' })}
                  variant="primary"
                />
                
                <OptimizedControl
                  title="Warning"
                  icon={<Settings size={20} color="#ffffff" />}
                  onPress={createOptimizedHandler(() => showFeedback('warning'), { haptic: 'medium' })}
                  variant="secondary"
                />
                
                <OptimizedControl
                  title="Error"
                  icon={<HelpCircle size={20} color="#ffffff" />}
                  onPress={createOptimizedHandler(() => showFeedback('error'), { haptic: 'heavy' })}
                  variant="danger"
                />
              </View>
            </View>

            {/* Gesture Controls Demo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gesture-Based Controls</Text>
              <Text style={styles.sectionDescription}>
                Advanced gesture controls for precise speed adjustment
              </Text>
              
              <GestureControls
                currentSpeed={testSpeed}
                onSpeedChange={setTestSpeed}
              />
            </View>

            {/* Performance Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Optimization Tips</Text>
              
              <View style={styles.tipsList}>
                <View style={styles.tip}>
                  <Text style={styles.tipTitle}>Memory Management</Text>
                  <Text style={styles.tipDescription}>
                    Implement automatic memory cleanup and monitoring to prevent crashes
                  </Text>
                </View>
                
                <View style={styles.tip}>
                  <Text style={styles.tipTitle}>Touch Optimization</Text>
                  <Text style={styles.tipDescription}>
                    Use debounced touch handlers and haptic feedback for better responsiveness
                  </Text>
                </View>
                
                <View style={styles.tip}>
                  <Text style={styles.tipTitle}>Visual Feedback</Text>
                  <Text style={styles.tipDescription}>
                    Provide immediate visual confirmation for all user actions
                  </Text>
                </View>
                
                <View style={styles.tip}>
                  <Text style={styles.tipTitle}>Gesture Support</Text>
                  <Text style={styles.tipDescription}>
                    Implement gesture controls for advanced users and accessibility
                  </Text>
                </View>
              </View>
            </View>

            {/* Test Haptic Feedback */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Haptic Feedback Test</Text>
              <View style={styles.hapticButtons}>
                <TouchableOpacity 
                  style={styles.hapticButton}
                  onPress={() => triggerHaptic('light')}
                >
                  <Text style={styles.hapticButtonText}>Light</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.hapticButton}
                  onPress={() => triggerHaptic('medium')}
                >
                  <Text style={styles.hapticButtonText}>Medium</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.hapticButton}
                  onPress={() => triggerHaptic('heavy')}
                >
                  <Text style={styles.hapticButtonText}>Heavy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 16,
  },
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  tipsList: {
    gap: 16,
  },
  tip: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
  hapticButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  hapticButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  hapticButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
});