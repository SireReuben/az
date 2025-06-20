import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { DeviceInfo } from '@/components/DeviceInfo';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

export default function SettingsScreen() {
  const { isTablet, isLandscape, screenType } = useDeviceOrientation();

  const getLayoutStyle = () => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return styles.tabletLandscapeLayout;
    }
    return null;
  };

  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent
          ]}
        >
          <ResponsiveContainer>
            <View style={getLayoutStyle()}>
              <View style={isTablet && isLandscape ? styles.leftColumn : null}>
                <StatusHeader />
                
                <SettingsSection 
                  title="Network Settings"
                  items={[
                    { label: 'WiFi Network', value: 'AEROSPIN CONTROL' },
                    { label: 'Connection Type', value: 'Local Network' },
                    { label: 'Auto-Connect', value: 'Enabled' },
                  ]}
                />

                <DeviceInfo />
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                <SettingsSection 
                  title="Application"
                  items={[
                    { label: 'App Version', value: '1.0.0' },
                    { label: 'Build', value: '2025.01.01' },
                    { label: 'Last Updated', value: 'Today' },
                  ]}
                />

                <SettingsSection 
                  title="Support"
                  items={[
                    { label: 'Help & Documentation', value: 'Available' },
                    { label: 'Technical Support', value: '24/7' },
                    { label: 'Emergency Contact', value: 'Active' },
                  ]}
                />
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
  },
  tabletScrollContent: {
    padding: 24,
  },
  tabletLandscapeLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
});