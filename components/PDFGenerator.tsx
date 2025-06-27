import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Download } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

interface SessionData {
  startTime: string;
  duration: string;
  events: string[];
}

interface SessionStats {
  totalEvents: number;
  controlEvents: number;
  systemEvents: number;
  emergencyEvents: number;
  arduinoEvents: number;
  safetyEvents: number;
}

interface PDFGeneratorProps {
  sessionData: SessionData;
  sessionStats: SessionStats;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: any) => void;
}

export function PDFGenerator({
  sessionData,
  sessionStats,
  onExportStart,
  onExportComplete,
  onExportError
}: PDFGeneratorProps) {
  const viewShotRef = React.useRef<ViewShot>(null);

  const generatePdfContent = () => {
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
  };

  const generateAndSharePdf = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll use a different approach
        console.log('PDF export is not available in web mode');
        return;
      }

      if (onExportStart) onExportStart();
      
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
          if (onExportComplete) onExportComplete();
        } else {
          throw new Error('Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (onExportError) onExportError(error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <View style={styles.reportPreview}>
          <Text style={styles.previewText}>Session Report Preview</Text>
        </View>
      </ViewShot>
      
      <TouchableOpacity
        style={styles.exportButton}
        onPress={generateAndSharePdf}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.buttonGradient}
        >
          <FileText size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Export as PDF</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  reportPreview: {
    height: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 8,
  },
});