import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { FileText, Download, Share2 } from 'lucide-react-native';

interface SessionData {
  startTime: string;
  duration: string;
  events: string[];
}

interface SessionReportProps {
  sessionData: SessionData;
}

export function SessionReport({ sessionData }: SessionReportProps) {
  const generateReportText = () => {
    const reportHeader = `AEROSPIN SESSION REPORT
Generated: ${new Date().toLocaleString()}
Session Start: ${sessionData.startTime}
Duration: ${sessionData.duration}
${'='.repeat(50)}

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
        // For web platform, create and download a text file
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
        // For mobile platforms, use the Share API
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session Report</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareReport}
          >
            <Share2 size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={handleDownloadReport}
          >
            <Download size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Started:</Text>
        <Text style={styles.infoValue}>{sessionData.startTime || 'Not started'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Duration:</Text>
        <Text style={styles.infoValue}>{sessionData.duration || '00:00:00'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Events:</Text>
        <Text style={styles.infoValue}>{sessionData.events.length} recorded</Text>
      </View>

      <Text style={styles.eventsTitle}>Session Events</Text>
      <ScrollView style={styles.eventsContainer} showsVerticalScrollIndicator={false}>
        {sessionData.events.length > 0 ? (
          sessionData.events.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <Text style={styles.eventIndex}>{index + 1}.</Text>
              <Text style={styles.eventText}>{event}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <FileText size={24} color="#9ca3af" />
            <Text style={styles.noEventsText}>No events recorded yet</Text>
            <Text style={styles.noEventsSubtext}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
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
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  eventsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
  },
  eventsContainer: {
    maxHeight: 200,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  eventIndex: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    width: 20,
  },
  eventText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});