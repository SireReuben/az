import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusHeader } from '@/components/StatusHeader';
import { AlertsList } from '@/components/AlertsList';
import { EnhancedConnectionStatus } from '@/components/EnhancedConnectionStatus';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

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

  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6']}
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
                <EnhancedConnectionStatus 
                  isConnected={deviceConnected} 
                  networkDetection={networkDetection}
                  onRefresh={handleRefreshConnection}
                  showDetails={!deviceConnected}
                />
                
                <View style={[
                  styles.card,
                  isTablet && styles.tabletCard
                ]}>
                  <View style={styles.headerContainer}>
                    <Text style={[
                      styles.sectionTitle,
                      isTablet && styles.tabletSectionTitle
                    ]}>
                      System Alerts
                    </Text>
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
                    styles.sectionDescription,
                    isTablet && styles.tabletSectionDescription
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
                </View>
              </View>

              <View style={isTablet && isLandscape ? styles.rightColumn : null}>
                {/* Alert Statistics */}
                <View style={[
                  styles.statsCard,
                  isTablet && styles.tabletStatsCard
                ]}>
                  <Text style={[
                    styles.statsTitle,
                    isTablet && styles.tabletStatsTitle
                  ]}>
                    Alert Statistics
                  </Text>
                  <View style={[
                    styles.statsGrid,
                    isTablet && styles.tabletStatsGrid
                  ]}>
                    <View style={[
                      styles.statItem,
                      isTablet && styles.tabletStatItem
                    ]}>
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
                    <View style={[
                      styles.statItem,
                      isTablet && styles.tabletStatItem
                    ]}>
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
                    <View style={[
                      styles.statItem,
                      isTablet && styles.tabletStatItem
                    ]}>
                      <Text style={[
                        styles.statValue,
                        isTablet && styles.tabletStatValue
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
                    <View style={[
                      styles.statItem,
                      isTablet && styles.tabletStatItem
                    ]}>
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

                {/* Connection Status Info */}
                <View style={[
                  styles.infoCard,
                  isTablet && styles.tabletInfoCard
                ]}>
                  <Text style={[
                    styles.infoTitle,
                    isTablet && styles.tabletInfoTitle
                  ]}>
                    Alert System Status
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={[
                      styles.infoLabel,
                      isTablet && styles.tabletInfoLabel
                    ]}>
                      Device Connection:
                    </Text>
                    <Text style={[
                      styles.infoValue,
                      isTablet && styles.tabletInfoValue,
                      { color: deviceConnected ? '#22c55e' : '#ef4444' }
                    ]}>
                      {deviceConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[
                      styles.infoLabel,
                      isTablet && styles.tabletInfoLabel
                    ]}>
                      Alert Monitoring:
                    </Text>
                    <Text style={[
                      styles.infoValue,
                      isTablet && styles.tabletInfoValue,
                      { color: '#22c55e' }
                    ]}>
                      Active
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[
                      styles.infoLabel,
                      isTablet && styles.tabletInfoLabel
                    ]}>
                      Update Frequency:
                    </Text>
                    <Text style={[
                      styles.infoValue,
                      isTablet && styles.tabletInfoValue
                    ]}>
                      Every 10 seconds
                    </Text>
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
    padding: 16,
    paddingBottom: 120,
  },
  tabletScrollContent: {
    padding: 24,
    paddingBottom: 140,
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
  card: {
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
  tabletCard: {
    padding: 24,
    borderRadius: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
  },
  tabletSectionTitle: {
    fontSize: 24,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  tabletUnreadBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 16,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabletUnreadBadgeText: {
    fontSize: 14,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabletSectionDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  statsCard: {
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
  tabletStatsCard: {
    padding: 24,
    borderRadius: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletStatsTitle: {
    fontSize: 22,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabletStatsGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  tabletStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 4,
  },
  tabletStatValue: {
    fontSize: 28,
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  tabletStatLabel: {
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabletInfoCard: {
    padding: 20,
    borderRadius: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabletInfoTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  tabletInfoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  tabletInfoValue: {
    fontSize: 16,
  },
});