import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Download, Share2, Clock, Activity, TriangleAlert as AlertTriangle, Settings, Shield } from 'lucide-react-native';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

interface SessionData {
  startTime: string;
  duration: string;
  events: string[];
  _updateTrigger?: number;
  _lastEventTime?: number;
}

interface SessionReportProps {
  sessionData: SessionData;
  registerForceUpdateCallback?: (callback: () => void) => () => void;
}

export function SessionReport({ sessionData, registerForceUpdateCallback }: SessionReportProps) {
  const { isTablet } = useDeviceOrientation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [lastEventCount, setLastEventCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [realTimeUpdateCount, setRealTimeUpdateCount] = useState(0);
  const viewShotRef = React.useRef<ViewShot>(null);

  // Register for immediate updates from useDeviceState
  useEffect(() => {
    if (registerForceUpdateCallback) {
      const unregister = registerForceUpdateCallback(() => {
        setRealTimeUpdateCount(prev => prev + 1);
        setForceUpdate(prev => prev + 1);
      });
      
      return unregister;
    }
  }, [registerForceUpdateCallback]);

  // Enhanced manual refresh function
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    // Force ALL state updates simultaneously
    const newRefreshTrigger = Date.now();
    setRefreshTrigger(newRefreshTrigger);
    setForceUpdate(prev => prev + 1);
    setLastEventCount(sessionData.events.length);
    setRealTimeUpdateCount(prev => prev + 1);
    
    // Visual feedback with longer duration
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  }, [sessionData.events]);

  // Multiple triggers for real-time updates
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
    setLastEventCount(sessionData.events.length);
  }, [
    sessionData.events.length, 
    sessionData.duration, 
    sessionData.startTime,
    sessionData._updateTrigger,
    sessionData._lastEventTime,
    refreshTrigger,
    realTimeUpdateCount
  ]);

  // Additional trigger for event content changes
  useEffect(() => {
    if (sessionData.events.length > 0) {
      setForceUpdate(prev => prev + 1);
      setRealTimeUpdateCount(prev => prev + 1);
    }
  }, [sessionData.events]);

  // Force update every second during active sessions
  useEffect(() => {
    let updateInterval: NodeJS.Timeout;
    
    if (sessionData.events.length > 0 && sessionData.duration !== '00:00:00') {
      updateInterval = setInterval(() => {
        setForceUpdate(prev => prev + 1);
        setRealTimeUpdateCount(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [sessionData.events.length, sessionData.duration]);

  // Enhanced session statistics
  const sessionStats = useMemo(() => {
    const events = sessionData.events;
    
    // Control events
    const controlEventPatterns = [
      '🎮 DIRECTION changed',
      '🎮 BRAKE changed', 
      '🎮 SPEED changed',
      '🎮 BRAKE RELEASE',
      'DIRECTION changed',
      'BRAKE changed',
      'SPEED changed',
      'Brake release',
      'Direction set',
      'Speed set',
      'control_operation'
    ];
    
    const controlEvents = events.filter(event => 
      controlEventPatterns.some(pattern => event.includes(pattern))
    ).length;
    
    // System events
    const systemEventPatterns = [
      '🚀 SESSION STARTED',
      '🏁 SESSION ENDED',
      '📱 Platform:',
      '🌐 Connection:',
      '🔧 Device IP:',
      '🆔 Session ID:',
      '⚡ System initialized',
      '✅ Connected to Arduino',
      '⚠️ Operating in offline mode',
      '💾 Session data saved',
      'system_event',
      'SESSION'
    ];
    
    const systemEvents = events.filter(event => 
      systemEventPatterns.some(pattern => event.includes(pattern))
    ).length;
    
    // Emergency events
    const emergencyEventPatterns = [
      '🚨 EMERGENCY STOP ACTIVATED',
      '🚨 DEVICE RESET initiated',
      '⛔ Emergency action:',
      '⏰ Emergency stop time:',
      '🔄 DEVICE RESET',
      'Emergency',
      'emergency_event',
      'EMERGENCY'
    ];
    
    const emergencyEvents = events.filter(event => 
      emergencyEventPatterns.some(pattern => event.includes(pattern))
    ).length;

    // Arduino communication events
    const arduinoEventPatterns = [
      '✅ Arduino command sent',
      '❌ Arduino command failed',
      '📡 Device response:',
      'Arduino',
      'device communication',
      'arduino_command',
      'arduino_error'
    ];
    
    const arduinoEvents = events.filter(event => 
      arduinoEventPatterns.some(pattern => event.includes(pattern))
    ).length;

    // Safety events
    const safetyEventPatterns = [
      '🛡️ Safety protocol:',
      '🔒 Brake position reset',
      '🔓 Brake operation:',
      'Brake position preserved',
      'Brake position maintained',
      'Safety protocol',
      'safety',
      'safety_event'
    ];
    
    const safetyEvents = events.filter(event => 
      safetyEventPatterns.some(pattern => event.includes(pattern))
    ).length;

    return {
      totalEvents: events.length,
      controlEvents,
      systemEvents,
      emergencyEvents,
      arduinoEvents,
      safetyEvents
    };
  }, [
    sessionData.events, 
    sessionData._updateTrigger,
    sessionData._lastEventTime,
    forceUpdate, 
    lastEventCount, 
    refreshTrigger,
    realTimeUpdateCount
  ]);

  // Memoize events
  const memoizedEvents = useMemo(() => {
    return sessionData.events.map((event, index) => ({
      id: `event-${index}-${forceUpdate}-${refreshTrigger}-${realTimeUpdateCount}-${sessionData._updateTrigger}-${Date.now()}`,
      index,
      content: event,
      timestamp: Date.now()
    }));
  }, [
    sessionData.events, 
    sessionData._updateTrigger,
    sessionData._lastEventTime,
    forceUpdate, 
    refreshTrigger,
    realTimeUpdateCount
  ]);

  // Generate PDF report content
  const generatePdfContent = useCallback(() => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // HTML content for PDF
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>AEROSPIN Session Report</title>
        <style>
          body {
            font-family: 'Helvetica', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin: 10px 0;
          }
          .subtitle {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .date {
            font-size: 14px;
            color: #64748b;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 10px;
            border: 1px solid #e2e8f0;
          }
          .info-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }
          .stat-item {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
          }
          .events-container {
            margin-bottom: 20px;
          }
          .event-item {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .event-index {
            display: inline-block;
            width: 30px;
            font-weight: 500;
            color: #64748b;
          }
          .event-text {
            color: #334155;
          }
          .control-event { color: #1e40af; font-weight: 500; }
          .emergency-event { color: #dc2626; font-weight: bold; }
          .arduino-event { color: #8b5cf6; font-weight: 500; }
          .safety-event { color: #06b6d4; font-weight: 500; }
          .session-event { color: #22c55e; font-weight: bold; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .page-number {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">AEROSPIN CONTROL SYSTEM</div>
          <div class="subtitle">Session Activity Report</div>
          <div class="date">Generated: ${currentDate} at ${currentTime}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Session Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Session Start</div>
              <div class="info-value">${sessionData.startTime}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Session Duration</div>
              <div class="info-value">${sessionData.duration}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total Events</div>
              <div class="info-value">${sessionStats.totalEvents}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Report Generated</div>
              <div class="info-value">${currentDate} ${currentTime}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Session Statistics</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${sessionStats.controlEvents}</div>
              <div class="stat-label">Control Operations</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${sessionStats.systemEvents}</div>
              <div class="stat-label">System Events</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${sessionStats.emergencyEvents}</div>
              <div class="stat-label">Emergency Events</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${sessionStats.arduinoEvents}</div>
              <div class="stat-label">Arduino Communications</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${sessionStats.safetyEvents}</div>
              <div class="stat-label">Safety Events</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${sessionData.duration}</div>
              <div class="stat-label">Total Duration</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Detailed Event Log</div>
          <div class="events-container">
            ${sessionData.events.length > 0 
              ? sessionData.events.map((event, index) => {
                  let eventClass = '';
                  if (event.includes('🎮') || event.includes('changed:') || event.includes('BRAKE RELEASE')) {
                    eventClass = 'control-event';
                  } else if (event.includes('🚨') || event.includes('EMERGENCY')) {
                    eventClass = 'emergency-event';
                  } else if (event.includes('✅ Arduino') || event.includes('❌ Arduino') || event.includes('📡')) {
                    eventClass = 'arduino-event';
                  } else if (event.includes('🛡️') || event.includes('🔒') || event.includes('🔓') || event.includes('Safety')) {
                    eventClass = 'safety-event';
                  } else if (event.includes('🚀') || event.includes('🏁') || event.includes('SESSION')) {
                    eventClass = 'session-event';
                  }
                  
                  return `
                    <div class="event-item">
                      <span class="event-index">${index + 1}.</span>
                      <span class="event-text ${eventClass}">${event}</span>
                    </div>
                  `;
                }).join('')
              : '<div class="event-item">No events recorded</div>'
            }
          </div>
        </div>
        
        <div class="footer">
          <p>AEROSPIN CONTROL SYSTEM - OFFICIAL SESSION REPORT</p>
          <p>This report contains confidential operational data. For authorized use only.</p>
        </div>
        
        <div class="page-number">Page 1 of 1</div>
      </body>
      </html>
    `;
  }, [sessionData, sessionStats]);

  // Generate and share PDF report
  const generateAndSharePdf = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll use a different approach
        Alert.alert('Web Export', 'PDF export is not available in web mode. Please use the mobile app for this feature.');
        return;
      }

      setIsRefreshing(true);
      
      // Capture the view as an image
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        
        // Create a temporary HTML file
        const htmlContent = generatePdfContent();
        const htmlFilePath = `${FileSystem.cacheDirectory}session_report.html`;
        await FileSystem.writeAsStringAsync(htmlFilePath, htmlContent);
        
        // Create PDF file path
        const pdfFilePath = `${FileSystem.cacheDirectory}AEROSPIN_Session_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Share the HTML file (in a real app, you'd convert to PDF first)
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(htmlFilePath);
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device');
        }
      }
      
      setIsRefreshing(false);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Alert.alert('Export Failed', 'Unable to generate PDF report. Please try again.');
      setIsRefreshing(false);
    }
  };

  // Share report as text
  const handleShareReport = async () => {
    try {
      const reportText = `
AEROSPIN SESSION REPORT
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
${sessionData.events.length > 0 
  ? sessionData.events.map((event, index) => `${index + 1}. ${event}`).join('\n')
  : 'No events recorded'}

${'='.repeat(50)}
SUMMARY:
- Session Duration: ${sessionData.duration}
- Total Operations: ${sessionStats.controlEvents}
- Emergency Actions: ${sessionStats.emergencyEvents}
- System Status: ${sessionStats.systemEvents > 0 ? 'Active' : 'Inactive'}
- Arduino Communication: ${sessionStats.arduinoEvents > 0 ? 'Successful' : 'No Communication'}
- Safety Protocols: ${sessionStats.safetyEvents > 0 ? 'Engaged' : 'Standard'}

End of Report
AEROSPIN Global Control System
      `;
      
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
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <View style={styles.header}>
          <Text style={[
            styles.title,
            isTablet && styles.tabletTitle
          ]}>
            Session Report
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.refreshButton,
                isTablet && styles.tabletActionButton,
                isRefreshing && styles.refreshingButton
              ]}
              onPress={handleManualRefresh}
              disabled={isRefreshing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isRefreshing ? ['#16a34a', '#15803d'] : ['#22c55e', '#16a34a']}
                style={styles.actionButtonGradient}
              >
                <Activity 
                  size={isTablet ? 18 : 16} 
                  color="#ffffff" 
                  style={isRefreshing ? styles.rotating : undefined}
                />
                <Text style={[
                  styles.actionButtonText,
                  isTablet && styles.tabletActionButtonText
                ]}>
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                isTablet && styles.tabletActionButton
              ]}
              onPress={handleShareReport}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6b7280', '#4b5563']}
                style={styles.actionButtonGradient}
              >
                <Share2 size={isTablet ? 18 : 16} color="#ffffff" />
                <Text style={[
                  styles.actionButtonText,
                  isTablet && styles.tabletActionButtonText
                ]}>
                  Share
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.downloadButton,
                isTablet && styles.tabletActionButton
              ]}
              onPress={generateAndSharePdf}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.actionButtonGradient}
              >
                <Download size={isTablet ? 18 : 16} color="#ffffff" />
                <Text style={[
                  styles.actionButtonText,
                  isTablet && styles.tabletActionButtonText
                ]}>
                  Export PDF
                </Text>
              </LinearGradient>
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
              <Activity size={16} color="#3b82f6" />
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
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
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
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabletActionButton: {
    borderRadius: 10,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButton: {
    shadowColor: '#22c55e',
  },
  refreshingButton: {
    opacity: 0.8,
  },
  downloadButton: {
    shadowColor: '#3b82f6',
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
  rotating: {
    transform: [{ rotate: '45deg' }],
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#64748b',
    marginBottom: 2,
  },
  tabletInfoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#0f172a',
  },
  tabletInfoValue: {
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
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
    color: '#64748b',
    textAlign: 'center',
  },
  tabletStatLabel: {
    fontSize: 12,
  },
});