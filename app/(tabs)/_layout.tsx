import { Tabs } from 'expo-router';
import { 
  Play, 
  Gauge, 
  Settings, 
  Bell,
} from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { isTablet, isLandscape, screenType, width, height } = useDeviceOrientation();

  // Enhanced tab bar styling for landscape tablets
  const getTabBarHeight = () => {
    if (isTablet && isLandscape) return 70;
    if (isTablet) return 85;
    return 75;
  };

  const getTabBarPadding = () => {
    if (isTablet && isLandscape) return { top: 8, bottom: 12, horizontal: 16 };
    if (isTablet) return { top: 16, bottom: 24, horizontal: 16 };
    return { top: 12, bottom: 20, horizontal: 8 };
  };

  const padding = getTabBarPadding();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: getTabBarHeight(),
          paddingBottom: padding.bottom,
          paddingTop: padding.top,
          paddingHorizontal: padding.horizontal,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 20,
          // Ensure tab bar fills width on landscape tablets
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          // Force full width on Android tablets
          ...(Platform.OS === 'android' && isTablet && isLandscape && {
            minWidth: width,
            maxWidth: width,
          }),
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: isTablet ? (isLandscape ? 12 : 14) : 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        // Ensure content doesn't get hidden behind tab bar
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ size, color }) => (
            <Play size={isTablet ? (isLandscape ? 22 : 26) : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Gauge size={isTablet ? (isLandscape ? 22 : 26) : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={isTablet ? (isLandscape ? 22 : 26) : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ size, color }) => (
            <Bell size={isTablet ? (isLandscape ? 22 : 26) : 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}