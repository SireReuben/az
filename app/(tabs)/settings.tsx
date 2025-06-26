import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { DeviceInfo } from '@/components/DeviceInfo';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { ContextualHelp } from '@/components/ContextualHelp';
import { VisualFeedback } from '@/components/VisualFeedbackSystem';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useOptimizedTouch } from '@/hooks/useOptimizedTouch';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring
} from 'react-native-reanimated';
import { 
  Settings as SettingsIcon, 
  Wifi, 
  Shield, 
  Bell, 
  Zap, 
  Monitor,
  Smartphone,
  Info,
  ChevronRight
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { isTablet, isLandscape, screenType, height } = useDeviceOrientation();
  const { createOptimizedHandler } = useOptimizedTouch();
  
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Animation values
  const settingsScale = useSharedValue(1);

  const showFeedback = (type: 'success' | 'error' | 'warning' | 'info') => {
    setFeedbackType(type);
    setFeedbackVisible(true);
    settingsScale.value = withSpring(1.02, { damping: 15 }, () => {
      settingsScale.value = withSpring(1, { damping: 15 });
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsScale.value }],
  }));

  const helpContent = {
    title: 'Settings & Configuration',
    description: 'Customize your AEROSPIN Control app experience and device connection preferences.',
    steps: [
      'Adjust network and connection settings',
      'Configure notifications and alerts',
      'Customize user interface preferences',
      'View device and app information'
    ],
    tips: [
      'Auto-connect helps maintain device connection',
      'Haptic feedback improves touch experience',
      'Notifications keep you informed of system status',
      'Settings are saved automatically'
    ]
  };

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return {
        ...styles.tabletLandscapeLayout,
        minHeight: height - 120,
      };
    }
    return {
      minHeight: height - 120,
    };
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    value, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange 
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    value?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <View style={styles.settingValue}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#374151', true: '#3b82f6' }}
            thumbColor={switchValue ? '#ffffff' : '#9ca3af'}
          />
        ) : (
          <>
            {value && <Text style={styles.settingValueText}>{value}</Text>}
            <ChevronRight size={16} color="#6b7280" />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
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
            <Animated.View style={[getLayoutStyle(), animatedStyle]}>
              <View style={isTablet && isLandscape ? styles.leftColumn : null}>
                <StatusHeader />
                
                <View style={styles.headerSection}>
                  <Text style={styles.pageTitle}>Settings</Text>
                  <ContextualHelp content={helpContent} />
                </View>
                
                {/* Network Settings */}
                <View style={styles.settingsPanel}>
                  <Text style={styles.panelTitle}>Network & Connection</Text>
                  
                  <SettingItem
                    icon={<Wifi size={20} color="#3b82f6" />}
                    title="WiFi Network"
                    description="Currently connected network"
                    value="AEROSPIN CONTROL"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                  
                  <SettingItem
                    icon={<Zap size={20} color="#22c55e" />}
                    title="Auto-Connect"
                    description="Automatically connect to AEROSPIN device"
                    showSwitch={true}
                    switchValue={autoConnect}
                    onSwitchChange={(value) => {
                      setAutoConnect(value);
                      showFeedback('success');
                    }}
                  />
                  
                  <SettingItem
                    icon={<Shield size={20} color="#f59e0b" />}
                    title="Connection Type"
                    description="Local network communication"
                    value="Secure"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                </View>

                {/* User Interface */}
                <View style={styles.settingsPanel}>
                  <Text style={styles.panelTitle}>User Interface</Text>
                  
                  <SettingItem
                    icon={<Smartphone size={20} color="#8b5cf6" />}
                    title="Haptic Feedback"
                    description="Touch vibration feedback"
                    showSwitch={true}
                    switchValue={hapticEnabled}
                    onSwitchChange={(value) => {
                      setHapticEnabled(value);
                      showFeedback('success');
                    }}
                  />
                  
                  <SettingItem
                    icon={<Bell size={20} color="#ef4444" />}
                    title="Notifications"
                    description="System and device alerts"
                    showSwitch={true}
                    switchValue={notifications}
                    onSwitchChange={(value) => {
                      setNotifications(value);
                      showFeedback('success');
                    }}
                  />
                  
                  <SettingItem
                    icon={<Monitor size={20} color="#06b6d4" />}
                    title="Theme"
                    description="Dark mode interface"
                    showSwitch={true}
                    switchValue={darkMode}
                    onSwitchChange={(value) => {
                      setDarkMode(value);
                      showFeedback('success');
                    }}
                  />
                </View>

                <DeviceInfo />
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                {/* Application Info */}
                <View style={styles.settingsPanel}>
                  <Text style={styles.panelTitle}>Application</Text>
                  
                  <SettingItem
                    icon={<Info size={20} color="#3b82f6" />}
                    title="App Version"
                    description="Current application version"
                    value="2.0.0 Enterprise"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                  
                  <SettingItem
                    icon={<SettingsIcon size={20} color="#22c55e" />}
                    title="Build"
                    description="Production optimized build"
                    value="2025.01.01"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                  
                  <SettingItem
                    icon={<Zap size={20} color="#f59e0b" />}
                    title="Performance"
                    description="Optimized for offline operation"
                    value="Excellent"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                </View>

                {/* Support & Help */}
                <View style={styles.settingsPanel}>
                  <Text style={styles.panelTitle}>Support & Help</Text>
                  
                  <SettingItem
                    icon={<Info size={20} color="#8b5cf6" />}
                    title="Documentation"
                    description="User guides and tutorials"
                    value="Available"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                  
                  <SettingItem
                    icon={<Shield size={20} color="#22c55e" />}
                    title="Technical Support"
                    description="24/7 assistance available"
                    value="Active"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                  
                  <SettingItem
                    icon={<Bell size={20} color="#ef4444" />}
                    title="Emergency Contact"
                    description="Emergency support hotline"
                    value="Ready"
                    onPress={createOptimizedHandler(() => showFeedback('info'), { haptic: 'light' })}
                  />
                </View>

                {/* System Status */}
                <View style={styles.statusPanel}>
                  <Text style={styles.statusTitle}>System Status</Text>
                  <View style={styles.statusGrid}>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Memory Usage</Text>
                      <Text style={styles.statusValue}>Optimal</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Performance</Text>
                      <Text style={styles.statusValue}>Excellent</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Battery Impact</Text>
                      <Text style={styles.statusValue}>Low</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Network Quality</Text>
                      <Text style={styles.statusValue}>High</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
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
    padding: 20,
    paddingBottom: 140,
  },
  tabletLandscapeLayout: {
    flexDirection: 'row',
    gap: 24,
    minHeight: '100%',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  settingsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  panelTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  statusPanel: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#22c55e',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusGrid: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#86efac',
  },
  statusValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#22c55e',
  },
});