import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { FileText, Download, Share2, Clock, Activity, Zap, TriangleAlert as AlertTriangle, Settings, Shield, RefreshCw } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface SessionData {
  startTime: string;
  duration: string;
  events: string[];
  _updateTrigger?: number; // Internal trigger for forcing updates
}

interface SessionReportProps {
  sessionData: SessionData;
}

export function SessionReport({ sessionData }: SessionReportProps) {
  const { isTablet } = useDeviceOrientation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [lastEventCount, setLastEventCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered for Session Report');
    
    // Force immediate update
    setForceUpdate(prev => prev + 1);
    setLastEventCount(sessionData.events.length);
    
    // Visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [sessionData.events.length]);

  // CRITICAL FIX: Multiple triggers for real-time updates
  useEffect(() => {
    console.log('🔄 SessionReport: Events updated, count:', sessionData.events.length);
    console.log('🎯 SessionReport: Duration:', sessionData.duration);
    console.log('📊 SessionReport: Update trigger:', (sessionData as any)._updateTrigger);
    
    // Force re-render on any change
    setForceUpdate(prev => prev + 1);
    setLastEventCount(sessionData.events.length);
  }, [
    sessionData.events.length, 
    sessionData.duration, 
    sessionData.startTime,
    (sessionData as any)._updateTrigger // Internal trigger from useDeviceState
  ]);

  // CRITICAL FIX: Additional trigger for event content changes
  useEffect(() => {
    if (sessionData.events.length > 0) {
      const latestEvent = sessionData.events[sessionData.events.length - 1];
      console.log('🆕 SessionReport: Latest event:', latestEvent);
      setForceUpdate(prev => prev + 1);
    }
  }, [sessionData.events]);

  // CRITICAL FIX: Force update every second during active sessions
  useEffect(() => {
    let updateInterval: NodeJS.Timeout;
    
    if (sessionData.events.length > 0 && sessionData.duration !== '00:00:00') {
      updateInterval = setInterval(() => {
        console.log('⏰ SessionReport: Periodic update trigger');
        setForceUpdate(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [sessionData.events.length, sessionData.duration]);

  // Enhanced session statistics with real-time updates and comprehensive pattern matching
  const sessionStats = useMemo(() => {
    const events = sessionData.events;
    console.log('📈 SessionReport: Calculating stats for', events.length, 'events');
    console.log('🔍 SessionReport: Force update counter:', forceUpdate);
    
    // Control operations - comprehensive pattern matching
    const controlEvents = events.filter(event => 
      event.includes('🎮 DIRECTION changed') ||
      event.includes('🎮 BRAKE changed') ||
      event.includes('🎮 SPEED changed') ||
      event.includes('🎮 BRAKE RELEASE') ||
      event.includes('DIRECTION changed') ||
      event.includes('BRAKE changed') ||
      event.includes('SPEED changed') ||
      event.includes('Brake release') ||
      event.includes('Direction set') ||
      event.includes('Speed set') ||
      event.includes('control_operation')
    ).length;
    
    // System events - comprehensive pattern matching
    const systemEvents = events.filter(event => 
      event.includes('🚀 SESSION STARTED') ||
      event.includes('🏁 SESSION ENDED') ||
      event.includes('📱 Platform:') ||
      event.includes('🌐 Connection:') ||
      event.includes('🔧 Device IP:') ||
      event.includes('🆔 Session ID:') ||
      event.includes('⚡ System initialized') ||
      event.includes('✅ Connected to Arduino') ||
      event.includes('⚠️ Operating in offline mode') ||
      event.includes('💾 Session data saved') ||
      event.includes('system_event') ||
      event.includes('SESSION')
    ).length;
    
    // Emergency events - comprehensive pattern matching
    const emergencyEvents = events.filter(event => 
      event.includes('🚨 EMERGENCY STOP ACTIVATED') ||
      event.includes('🚨 DEVICE RESET initiated') ||
      event.includes('⛔ Emergency action:') ||
      event.includes('⏰ Emergency stop time:') ||
      event.includes('🔄 DEVICE RESET') ||
      event.includes('Emergency') ||
      event.includes('emergency_event') ||
      event.includes('EMERGENCY')
    ).length;

    // Arduino communication events
    const arduinoEvents = events.filter(event =>
      event.includes('✅ Arduino command sent') ||
      event.includes('❌ Arduino command failed') ||
      event.includes('📡 Device response:') ||
      event.includes('Arduino') ||
      event.includes('device communication') ||
      event.includes('arduino_command') ||
      event.includes('arduino_error')
    ).length;

    // Safety events - comprehensive pattern matching
    const safetyEvents = events.filter(event =>
      event.includes('🛡️ Safety protocol:') ||
      event.includes('🔒 Brake position reset') ||
      event.includes('🔓 Brake operation:') ||
      event.includes('Brake position preserved') ||
      event.includes('Brake position maintained') ||
      event.includes('Safety protocol') ||
      event.includes('safety') ||
      event.includes('safety_event')
    ).length;

    const stats = {
      totalEvents: events.length,
      controlEvents,
      systemEvents,
      emergencyEvents,
      arduinoEvents,
      safetyEvents
    };

    console.log('📊 SessionReport: Stats calculated -', stats);
    return stats;
  }, [sessionData.events, forceUpdate, lastEventCount]); // Include all triggers

  // CRITICAL FIX: Memoize with proper dependencies to force recalculation
  const memoizedEvents = useMemo(() => {
    console.log('🔄 SessionReport: Memoizing events, count:', sessionData.events.length);
    return sessionData.events.map((event, index) => ({
      id: `event-${index}-${forceUpdate}-${Date.now()}`, // Unique key for each render
      index,
      content: event,
      timestamp: Date.now()
    }));
  }, [sessionData.events, forceUpdate]);

  const generateReportText = useCallback(() => {
    const reportHeader = `AEROSPIN SESSION REPORT
Generated: ${new Date().toLocaleString()}
Session Start: ${sessionData.startTime}
Duration: ${sessionData.duration}
${'='.repeat(50)}

SESSION STATISTICS:
Total Events: ${sessionStats.totalEvents}
Control Operations: ${sessionStats.controlEvents}
System Events: ${sessionStats.systemEvents}
Emergency Events: ${sessionStats.emergencyEvents}
Arduino Communications: ${sessionStats.arduinoEvents}
Safety Events: ${sessionStats.safetyEvents}

DETAILED SESSION EVENTS:
`;

    const eventsText = sessionData.events.length > 0 
      ? sessionData.events.map((event, index) => `${index + 1}. ${event}`).join('\n')
      : 'No events recorded';

    const reportFooter = `
${'='.repeat(50)}
SUMMARY:
- Session Duration: ${sessionData.duration}
- Total Operations: ${sessionStats.controlEvents}
- Emergency Actions: ${sessionStats.emergencyEvents}
- System Status: ${sessionStats.systemEvents > 0 ? 'Active' : 'Inactive'}
- Arduino Communication: ${sessionStats.arduinoEvents > 0 ? 'Successful' : 'No Communication'}
- Safety Protocols: ${sessionStats.safetyEvents > 0 ? 'Engaged' : 'Standard'}

End of Report
AEROSPIN Global Control System`;

    return reportHeader + eventsText + reportFooter;
  }, [sessionData, sessionStats]);

  const handleDownloadReport = async () => {
    try {
      const reportText = generateReportText();
      
      if (Platform.OS === 'web') {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AEROSPIN_Session_Report_${new Date().toISOString().split('T')[0]}_${sessionData.duration.replace(/:/g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', 'Session report downloaded successfully!');
      } else {
        await Share.share({
          message: reportText,
          title: 'AEROSPIN Session Report',
        });
      }
    } catch (error) {
      console.error('Failed to download/share report:', error);
      Alert.alert(
        'Download Failed', 
        'Unable to download report. You can copy the session data manually from the events list.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShareReport = async () => {
    try {
      const reportText = generateReportText();
      
      await Share.share({
        message: reportText,
        title: 'AEROSPIN Session Report',
      });
    } catch (error) {
      console.error('Failed to share report:', error);
      Alert.alert('Share Failed', 'Unable to share report at this time.');
    }
  };

  return (
    <View style={[
      styles.container,
      isTablet && styles.tabletContainer
    ]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          isTablet && styles.tabletTitle
        ]}>
          Live Session Report
        </Text>
        <View style={styles.buttonGroup}>
          {/* Manual Refresh Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.refreshButton,
              isTablet && styles.tabletActionButton,
              isRefreshing && styles.refreshingButton
            ]}
            onPress={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={isTablet ? 18 : 16} 
              color="#ffffff" 
              style={[
                isRefreshing && styles.spinning
              ]}
            />
            <Text style={[
              styles.actionButtonText,
              isTablet && styles.tabletActionButtonText
            ]}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isTablet && styles.tabletActionButton
            ]}
            onPress={handleShareReport}
          >
            <Share2 size={isTablet ? 18 : 16} color="#ffffff" />
            <Text style={[
              styles.actionButtonText,
              isTablet && styles.tabletActionButtonText
            ]}>
              Share
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.downloadButton,
              isTablet && styles.tabletActionButton
            ]}
            onPress={handleDownloadReport}
          >
            <Download size={isTablet ? 18 : 16} color="#ffffff" />
            <Text style={[
              styles.actionButtonText,
              isTablet && styles.tabletActionButtonText
            ]}>
              Export
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Session Info */}
      <View style={[
        styles.infoGrid,
        isTablet && styles.tabletInfoGrid
      ]}>
        <View style={[
          styles.infoItem,
          isTablet && styles.tabletInfoItem
        ]}>
          <Clock size={isTablet ? 20 : 16} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={[
              styles.infoLabel,
              isTablet && styles.tabletInfoLabel
            ]}>
              Duration
            </Text>
            <Text style={[
              styles.infoValue,
              isTablet && styles.tabletInfoValue
            ]}>
              {sessionData.duration || '00:00:00'}
            </Text>
          </View>
        </View>

        <View style={[
          styles.infoItem,
          isTablet && styles.tabletInfoItem
        ]}>
          <Activity size={isTablet ? 20 : 16} color="#22c55e" />
          <View style={styles.infoContent}>
            <Text style={[
              styles.infoLabel,
              isTablet && styles.tabletInfoLabel
            ]}>
              Total Events
            </Text>
            <Text style={[
              styles.infoValue,
              isTablet && styles.tabletInfoValue
            ]}>
              {sessionStats.totalEvents}
            </Text>
          </View>
        </View>

        <View style={[
          styles.infoItem,
          isTablet && styles.tabletInfoItem
        ]}>
          <Zap size={isTablet ? 20 : 16} color="#f59e0b" />
          <View style={styles.infoContent}>
            <Text style={[
              styles.infoLabel,
              isTablet && styles.tabletInfoLabel
            ]}>
              Controls
            </Text>
            <Text style={[
              styles.infoValue,
              isTablet && styles.tabletInfoValue
            ]}>
              {sessionStats.controlEvents}
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Session Statistics */}
      <View style={[
        styles.statsContainer,
        isTablet && styles.tabletStatsContainer
      ]}>
        <Text style={[
          styles.statsTitle,
          isTablet && styles.tabletStatsTitle
        ]}>
          Real-Time Session Statistics
        </Text>
        <View style={[
          styles.statsGrid,
          isTablet && styles.tabletStatsGrid
        ]}>
          <View style={styles.statItem}>
            <Zap size={16} color="#3b82f6" />
            <Text style={[
              styles.statValue,
              isTablet && styles.tabletStatValue
            ]}>
              {sessionStats.controlEvents}
            </Text>
            <Text style={[
              styles.statLabel,
              isTablet && styles.tabletStatLabel
            ]}>
              Control Operations
            </Text>
          </View>
          <View style={styles.statItem}>
            <Settings size={16} color="#22c55e" />
            <Text style={[
              styles.statValue,
              isTablet && styles.tabletStatValue
            ]}>
              {sessionStats.systemEvents}
            </Text>
            <Text style={[
              styles.statLabel,
              isTablet && styles.tabletStatLabel
            ]}>
              System Events
            </Text>
          </View>
          <View style={styles.statItem}>
            <AlertTriangle size={16} color="#ef4444" />
            <Text style={[
              styles.statValue,
              isTablet && styles.tabletStatValue,
              sessionStats.emergencyEvents > 0 && { color: '#ef4444' }
            ]}>
              {sessionStats.emergencyEvents}
            </Text>
            <Text style={[
              styles.statLabel,
              isTablet && styles.tabletStatLabel
            ]}>
              Emergency Events
            </Text>
          </View>
          <View style={styles.statItem}>
            <Activity size={16} color="#8b5cf6" />
            <Text style={[
              styles.statValue,
              isTablet && styles.tabletStatValue
            ]}>
              {sessionStats.arduinoEvents}
            </Text>
            <Text style={[
              styles.statLabel,
              isTablet && styles.tabletStatLabel
            ]}>
              Arduino Comms
            </Text>
          </View>
          <View style={styles.statItem}>
            <Shield size={16} color="#06b6d4" />
            <Text style={[
              styles.statValue,
              isTablet && styles.tabletStatValue
            ]}>
              {sessionStats.safetyEvents}
            </Text>
            <Text style={[
              styles.statLabel,
              isTablet && styles.tabletStatLabel
            ]}>
              Safety Events
            </Text>
          </View>
        </View>
      </View>

      {/* Live Events Log */}
      <View style={styles.eventsHeader}>
        <Text style={[
          styles.eventsTitle,
          isTablet && styles.tabletEventsTitle
        ]}>
          Live Events Log ({sessionStats.totalEvents} events)
        </Text>
        <Text style={[
          styles.updateIndicator,
          isTablet && styles.tabletUpdateIndicator
        ]}>
          Update #{forceUpdate}
        </Text>
      </View>
      
      <ScrollView 
        style={[
          styles.eventsContainer,
          isTablet && styles.tabletEventsContainer
        ]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsContent}
      >
        {memoizedEvents.length > 0 ? (
          memoizedEvents.map((eventItem) => (
            <View key={eventItem.id} style={[
              styles.eventItem,
              isTablet && styles.tabletEventItem
            ]}>
              <Text style={[
                styles.eventIndex,
                isTablet && styles.tabletEventIndex
              ]}>
                {eventItem.index + 1}.
              </Text>
              <Text style={[
                styles.eventText,
                isTablet && styles.tabletEventText,
                // Enhanced event styling based on actual content patterns
                (eventItem.content.includes('🚨') || eventItem.content.includes('EMERGENCY')) && styles.emergencyEvent,
                (eventItem.content.includes('🎮') || eventItem.content.includes('changed:') || eventItem.content.includes('BRAKE RELEASE')) && styles.controlEvent,
                (eventItem.content.includes('✅ Arduino') || eventItem.content.includes('❌ Arduino') || eventItem.content.includes('📡')) && styles.arduinoEvent,
                (eventItem.content.includes('🛡️') || eventItem.content.includes('🔒') || eventItem.content.includes('🔓') || eventItem.content.includes('Safety')) && styles.safetyEvent,
                (eventItem.content.includes('🚀') || eventItem.content.includes('🏁') || eventItem.content.includes('SESSION')) && styles.sessionEvent,
              ]}>
                {eventItem.content}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <FileText size={isTablet ? 32 : 24} color="#9ca3af" />
            <Text style={[
              styles.noEventsText,
              isTablet && styles.tabletNoEventsText
            ]}>
              No events recorded yet
            </Text>
            <Text style={[
              styles.noEventsSubtext,
              isTablet && styles.tabletNoEventsSubtext
            ]}>
              Device operations will be logged here during the session
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  tabletContainer: {
    padding: 24,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
  },
  tabletTitle: {
    fontSize: 24,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabletActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshButton: {
    backgroundColor: '#22c55e',
  },
  refreshingButton: {
    backgroundColor: '#16a34a',
    opacity: 0.8,
  },
  downloadButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 6,
  },
  tabletActionButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabletInfoGrid: {
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabletInfoItem: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoContent: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 2,
  },
  tabletInfoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#374151',
  },
  tabletInfoValue: {
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tabletStatsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabletStatsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  tabletStatsGrid: {
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 4,
    marginTop: 4,
  },
  tabletStatValue: {
    fontSize: 22,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  tabletStatLabel: {
    fontSize: 12,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
  },
  tabletEventsTitle: {
    fontSize: 18,
  },
  updateIndicator: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabletUpdateIndicator: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  eventsContainer: {
    maxHeight: 300,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  tabletEventsContainer: {
    maxHeight: 400,
    borderRadius: 12,
  },
  eventsContent: {
    padding: 12,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabletEventItem: {
    paddingVertical: 10,
  },
  eventIndex: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    width: 24,
    marginRight: 8,
  },
  tabletEventIndex: {
    fontSize: 13,
    width: 28,
    marginRight: 12,
  },
  eventText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
    lineHeight: 16,
  },
  tabletEventText: {
    fontSize: 13,
    lineHeight: 18,
  },
  controlEvent: {
    color: '#1e40af',
    fontFamily: 'Inter-Medium',
  },
  emergencyEvent: {
    color: '#dc2626',
    fontFamily: 'Inter-Bold',
  },
  arduinoEvent: {
    color: '#8b5cf6',
    fontFamily: 'Inter-Medium',
  },
  safetyEvent: {
    color: '#06b6d4',
    fontFamily: 'Inter-Medium',
  },
  sessionEvent: {
    color: '#22c55e',
    fontFamily: 'Inter-Bold',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 6,
  },
  tabletNoEventsText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  tabletNoEventsSubtext: {
    fontSize: 14,
  },
});