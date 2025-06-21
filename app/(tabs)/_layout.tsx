import { Tabs } from 'expo-router';
import { 
  Play, 
  Gauge, 
  Settings, 
  Bell,
} from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

export default function TabLayout() {
  const { isTablet, isLandscape, screenType, isWideScreen } = useDeviceOrientation();

  // Enhanced tab bar styling for landscape tablets
  const getTabBarHeight = () => {
    if (screenType === 'desktop') return 80;
    if (isTablet && isLandscape) return isWideScreen ? 70 : 75;
    if (isTablet) return 85;
    return 75;
  };

  const getTabBarPadding = () => {
    if (screenType === 'desktop') return { top: 16, bottom: 20, horizontal: 24 };
    if (isTablet && isLandscape) return { top: 12, bottom: 16, horizontal: 20 };
    if (isTablet) return { top: 16, bottom: 24, horizontal: 16 };
    return { top: 12, bottom: 20, horizontal: 8 };
  };

  const padding = getTabBarPadding();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e40af',
          borderTopColor: '#3b82f6',
          borderTopWidth: 1,
          height: getTabBarHeight(),
          paddingBottom: padding.bottom,
          paddingTop: padding.top,
          paddingHorizontal: padding.horizontal,
          // Ensure tab bar fills width on landscape tablets
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#93c5fd',
        tabBarLabelStyle: {
          fontSize: isTablet ? (isLandscape ? 13 : 14) : 12,
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
            <Play size={isTablet ? (isLandscape ? 24 : 26) : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Gauge size={isTablet ? (isLandscape ? 24 : 26) : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={isTablet ? (isLandscape ? 24 : 26) : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ size, color }) => (
            <Bell size={isTablet ? (isLandscape ? 24 : 26) : 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}