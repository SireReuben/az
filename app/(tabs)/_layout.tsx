import { Tabs } from 'expo-router';
import { 
  Play, 
  Gauge, 
  Settings, 
  Bell,
} from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

export default function TabLayout() {
  const { isTablet, isLandscape } = useDeviceOrientation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e40af',
          borderTopColor: '#3b82f6',
          borderTopWidth: 1,
          height: isTablet ? (isLandscape ? 70 : 90) : 80,
          paddingBottom: isTablet ? (isLandscape ? 12 : 24) : 20,
          paddingTop: isTablet ? (isLandscape ? 8 : 16) : 12,
          paddingHorizontal: isTablet ? 16 : 8,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#93c5fd',
        tabBarLabelStyle: {
          fontSize: isTablet ? 14 : 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ size, color }) => (
            <Play size={isTablet ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Gauge size={isTablet ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={isTablet ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ size, color }) => (
            <Bell size={isTablet ? 26 : 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}