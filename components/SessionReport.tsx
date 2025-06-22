import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { FileText, Download, Share2, Clock, Activity, Zap } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface SessionData {
  startTime: string;
  duration: string;
  events: string[];
}

interface SessionReportProps {
  sessionData: SessionData;
}

export function SessionReport({ sessionData }: SessionReportProps) {
  const { isTablet } = useDeviceOrientation();

  // Memoize session statistics for better performance
  const sessionStats = useMemo(() => {
    const events = sessionData.events;
    const controlEvents = events.filter(event => 
      event.includes('DIRECTION') || 
      event.includes('BRAKE') || 
      event.includes('SPEED')
    ).length;
    
    const systemEvents = events.filter(event => 
      event.includes('Session') || 
      event.includes('Connected') || 
      event.includes('Operating')
    ).length;
    
    const emergencyEvents = events.filter(event => 
      event.includes('EMERGENCY') || 
      event.includes('🚨')
    ).length;

    return {
      totalEvents: events.length,
      controlEvents,
      systemEvents,
      emergencyEvents
    };
  }, [sessionData.events]);

  const generateReportText = () => {
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

SESSION EVENTS:
`;

    const eventsText = sessionData.events.length > 0 
      ? sessionData.events.map((event, index) => `${index + 1}. ${event}`).join('\n')
      : 'No events recorded';

    const reportFooter = `
${'='.repeat(50)}
End of Report
AEROSPIN Global Control System`;

    return reportHeader + eventsText + reportFooter;
  };

  const handleDownloadReport = async () => {
    try {
      const reportText = generateReportText();
      
      if (Platform.OS === 'web') {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AEROSPIN_Session_Report_${new Date().toISOString().split('T')[0]}.txt`;
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

      {/* Session Statistics */}
      <View style={[
        styles.statsContainer,
        isTablet && styles.tabletStatsContainer
      ]}>
        <Text style={[
          styles.statsTitle,
          isTablet && styles.tabletStatsTitle
        ]}>
          Session Statistics
        </Text>
        <View style={[
          styles.statsGrid,
          isTablet && styles.tabletStatsGrid
        ]}>
          <View style={styles.statItem}>
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
        </View>
      </View>

      {/* Live Events Log */}
      <Text style={[
        styles.eventsTitle,
        isTablet && styles.tabletEventsTitle
      ]}>
        Live Events Log
      </Text>
      <ScrollView 
        style={[
          styles.eventsContainer,
          isTablet && styles.tabletEventsContainer
        ]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsContent}
      >
        {sessionData.events.length > 0 ? (
          sessionData.events.map((event, index) => (
            <View key={index} style={[
              styles.eventItem,
              isTablet && styles.tabletEventItem
            ]}>
              <Text style={[
                styles.eventIndex,
                isTablet && styles.tabletEventIndex
              ]}>
                {index + 1}.
              </Text>
              <Text style={[
                styles.eventText,
                isTablet && styles.tabletEventText,
                event.includes('🚨') && styles.emergencyEvent,
                event.includes('DIRECTION') && styles.controlEvent,
                event.includes('BRAKE') && styles.controlEvent,
                event.includes('SPEED') && styles.controlEvent,
              ]}>
                {event}
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
    justifyContent: 'space-around',
  },
  tabletStatsGrid: {
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  tabletStatValue: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  tabletStatLabel: {
    fontSize: 13,
  },
  eventsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 12,
  },
  tabletEventsTitle: {
    fontSize: 18,
    marginBottom: 16,
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