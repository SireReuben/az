import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { AlertsList } from '@/components/AlertsList';
import { EnhancedConnectionStatus } from '@/components/EnhancedConnectionStatus';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { ContextualHelp } from '@/components/ContextualHelp';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { Bell, Activity, Shield, Zap, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function AlertsScreen() {
  const { 
    alerts, 
    unreadCount, 
    isConnected: alertsConnected,
    markAsRead, 
    deleteAlert, 
    clearAllAlerts, 
    markAllAsRead 
  } = useAlerts();
  
  const { 
    isConnected: deviceConnected, 
    refreshConnection,
    networkDetection 
  } = useDeviceState();
  
  const { isTablet, isLandscape, screenType, height } = useDeviceOrientation();

  // Notification pulse animation
  const notificationPulse = useSharedValue(0);
  
  React.useEffect(() => {
    if (unreadCount > 0) {
      notificationPulse.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      notificationPulse.value = 0;
    }
  }, [unreadCount, notificationPulse]);

  const handleRefreshConnection = async () => {
    await refreshConnection();
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

  const animatedNotificationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + interpolate(notificationPulse.value, [0, 1], [0, 0.1]) }],
    shadowOpacity: interpolate(notificationPulse.value, [0, 1], [0.2, 0.6]),
  }));

  const helpContent = {
    title: 'System Alerts',
    description: 'Monitor real-time notifications from your AEROSPIN device and application.',
    steps: [
      'View all system and device alerts',
      'Mark alerts as read or delete them',
      'Monitor connection status',
      'Check alert statistics and trends'
    ],
    tips: [
      'Unread alerts are highlighted with indicators',
      'Emergency alerts require immediate attention',
      'Device alerts show hardware status',
      'App alerts show software notifications'
    ]
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={[styles.container, { minHeight: height }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
            { minHeight: height - 120 }
          ]}
        >
          <ResponsiveContainer fillScreen={true}>
            <View style={getLayoutStyle()}>
              <View style={isTablet && isLandscape ? styles.leftColumn : null}>
                <StatusHeader />
                
                <View style={styles.headerSection}>
                  <Text style={styles.pageTitle}>System Alerts</Text>
                  <ContextualHelp content={helpContent} />
                </View>

                <EnhancedConnectionStatus 
                  isConnected={deviceConnected} 
                  networkDetection={networkDetection}
                  onRefresh={handleRefreshConnection}
                  showDetails={!deviceConnected}
                />
                
                <Animated.View style={[
                  styles.alertsPanel,
                  isTablet && styles.tabletAlertsPanel,
                  animatedNotificationStyle,
                  {
                    shadowColor: unreadCount > 0 ? '#ef4444' : '#3b82f6',
                  }
                ]}>
                  <View style={styles.panelHeader}>
                    <View style={styles.headerLeft}>
                      <Bell size={24} color="#ffffff" />
                      <Text style={[
                        styles.panelTitle,
                        isTablet && styles.tabletPanelTitle
                      ]}>
                        Notifications
                      </Text>
                    </View>
                    {unreadCount > 0 && (
                      <View style={[
                        styles.unreadBadge,
                        isTablet && styles.tabletUnreadBadge
                      ]}>
                        <Text style={[
                          styles.unreadBadgeText,
                          isTablet && styles.tabletUnreadBadgeText
                        ]}>
                          {unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.panelDescription,
                    isTablet && styles.tabletPanelDescription
                  ]}>
                    Real-time notifications from your AEROSPIN device and app
                  </Text>
                  
                  <AlertsList 
                    alerts={alerts}
                    onMarkAsRead={markAsRead}
                    onDeleteAlert={deleteAlert}
                    onClearAll={clearAllAlerts}
                    onMarkAllAsRead={markAllAsRead}
                  />
                </Animated.View>
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                {/* Alert Statistics */}
                <View style={[
                  styles.statsPanel,
                  isTablet && styles.tabletStatsPanel
                ]}>
                  <Text style={[
                    styles.statsTitle,
                    isTablet && styles.tabletStatsTitle
                  ]}>
                    Alert Analytics
                  </Text>
                  <View style={[
                    styles.statsGrid,
                    isTablet && styles.tabletStatsGrid
                  ]}>
                    <View style={styles.statCard}>
                      <Activity size={20} color="#3b82f6" />
                      <Text style={[
                        styles.statValue,
                        isTablet && styles.tabletStatValue
                      ]}>
                        {alerts.length}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isTablet && styles.tabletStatLabel
                      ]}>
                        Total
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Bell size={20} color="#f59e0b" />
                      <Text style={[
                        styles.statValue,
                        isTablet && styles.tabletStatValue
                      ]}>
                        {unreadCount}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isTablet && styles.tabletStatLabel
                      ]}>
                        Unread
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <AlertTriangle size={20} color="#ef4444" />
                      <Text style={[
                        styles.statValue,
                        isTablet && styles.tabletStatValue,
                        { color: alerts.filter(a => a.type === 'error').length > 0 ? '#ef4444' : '#64748b' }
                      ]}>
                        {alerts.filter(a => a.type === 'error').length}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isTablet && styles.tabletStatLabel
                      ]}>
                        Errors
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Shield size={20} color="#22c55e" />
                      <Text style={[
                        styles.statValue,
                        isTablet && styles.tabletStatValue
                      ]}>
                        {alerts.filter(a => a.source === 'device').length}
                      </Text>
                      <Text style={[
                        styles.statLabel,
                        isTablet && styles.tabletStatLabel
                      ]}>
                        Device
                      </Text>
                    </View>
                  </View>
                </View>

                {/* System Status */}
                <View style={[
                  styles.statusPanel,
                  isTablet && styles.tabletStatusPanel
                ]}>
                  <Text style={[
                    styles.statusTitle,
                    isTablet && styles.tabletStatusTitle
                  ]}>
                    System Status
                  </Text>
                  
                  <View style={styles.statusItems}>
                    <View style={styles.statusItem}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Device Connection:
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue,
                        { color: deviceConnected ? '#22c55e' : '#ef4444' }
                      ]}>
                        {deviceConnected ? 'Connected' : 'Disconnected'}
                      </Text>
                    </View>
                    
                    <View style={styles.statusItem}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Alert Monitoring:
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue,
                        { color: '#22c55e' }
                      ]}>
                        Active
                      </Text>
                    </View>
                    
                    <View style={styles.statusItem}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Update Frequency:
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue
                      ]}>
                        Every 10 seconds
                      </Text>
                    </View>
                    
                    <View style={styles.statusItem}>
                      <Text style={[
                        styles.statusLabel,
                        isTablet && styles.tabletStatusLabel
                      ]}>
                        Last Update:
                      </Text>
                      <Text style={[
                        styles.statusValue,
                        isTablet && styles.tabletStatusValue
                      ]}>
                        {new Date().toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Alert Types Legend */}
                <View style={[
                  styles.legendPanel,
                  isTablet && styles.tabletLegendPanel
                ]}>
                  <Text style={[
                    styles.legendTitle,
                    isTablet && styles.tabletLegendTitle
                  ]}>
                    Alert Types
                  </Text>
                  
                  <View style={styles.legendItems}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                      <Text style={styles.legendText}>Success</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={styles.legendText}>Warning</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={styles.legendText}>Error</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                      <Text style={styles.legendText}>Info</Text>
                    </View>
                  </View>
                </View>
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
    padding: 20,
    paddingBottom: 140,
  },
  tabletScrollContent: {
    padding: 24,
    paddingBottom: 160,
  },
  tabletLandscapeLayout: {
    flexDirection: 'row',
    gap: 24,
    minHeight: '100%',
  },
  leftColumn: {
    flex: 2,
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
  alertsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  tabletAlertsPanel: {
    padding: 28,
    borderRadius: 24,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  tabletPanelTitle: {
    fontSize: 24,
    marginLeft: 16,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  tabletUnreadBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabletUnreadBadgeText: {
    fontSize: 14,
  },
  panelDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  tabletPanelDescription: {
    fontSize: 16,
    marginBottom: 28,
  },
  statsPanel: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tabletStatsPanel: {
    padding: 24,
    borderRadius: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletStatsTitle: {
    fontSize: 22,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  tabletStatsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '45%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  tabletStatValue: {
    fontSize: 28,
    marginVertical: 10,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  tabletStatLabel: {
    fontSize: 14,
  },
  statusPanel: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  tabletStatusPanel: {
    padding: 24,
    borderRadius: 24,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#22c55e',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletStatusTitle: {
    fontSize: 20,
    marginBottom: 20,
  },
  statusItems: {
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
  tabletStatusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabletStatusValue: {
    fontSize: 16,
  },
  legendPanel: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  tabletLegendPanel: {
    padding: 20,
    borderRadius: 20,
  },
  legendTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabletLegendTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
});