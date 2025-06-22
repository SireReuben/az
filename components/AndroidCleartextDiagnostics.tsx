import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Shield, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useAndroidCleartextTest } from '@/hooks/useAndroidCleartextTest';

export function AndroidCleartextDiagnostics() {
  const { testResult, runCleartextTest } = useAndroidCleartextTest();

  const getStatusIcon = (status: 'success' | 'failed' | 'testing') => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} color="#22c55e" />;
      case 'failed':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <RefreshCw size={16} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: 'success' | 'failed' | 'testing') => {
    switch (status) {
      case 'success':
        return '#22c55e';
      case 'failed':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Shield size={20} color="#3b82f6" />
        <Text style={styles.title}>Android Cleartext Configuration Test</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Configuration Status:</Text>
        <View style={styles.statusRow}>
          {testResult.isConfigured ? (
            <CheckCircle size={16} color="#22c55e" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <Text style={[
            styles.statusText,
            { color: testResult.isConfigured ? '#22c55e' : '#ef4444' }
          ]}>
            {testResult.isConfigured ? 'Working' : 'Blocked'}
          </Text>
        </View>
      </View>

      <View style={styles.testsContainer}>
        <Text style={styles.testsTitle}>Test Results:</Text>
        
        <View style={styles.testItem}>
          <View style={styles.testRow}>
            {getStatusIcon(testResult.testResults.basicFetch)}
            <Text style={styles.testLabel}>Basic HTTP Fetch</Text>
          </View>
          <Text style={[
            styles.testStatus,
            { color: getStatusColor(testResult.testResults.basicFetch) }
          ]}>
            {testResult.testResults.basicFetch}
          </Text>
        </View>

        <View style={styles.testItem}>
          <View style={styles.testRow}>
            {getStatusIcon(testResult.testResults.withHeaders)}
            <Text style={styles.testLabel}>Fetch with Headers</Text>
          </View>
          <Text style={[
            styles.testStatus,
            { color: getStatusColor(testResult.testResults.withHeaders) }
          ]}>
            {testResult.testResults.withHeaders}
          </Text>
        </View>

        <View style={styles.testItem}>
          <View style={styles.testRow}>
            {getStatusIcon(testResult.testResults.tcpSocket)}
            <Text style={styles.testLabel}>TCP Socket Test</Text>
          </View>
          <Text style={[
            styles.testStatus,
            { color: getStatusColor(testResult.testResults.tcpSocket) }
          ]}>
            {testResult.testResults.tcpSocket}
          </Text>
        </View>
      </View>

      {testResult.errorMessages.length > 0 && (
        <View style={styles.errorsContainer}>
          <Text style={styles.errorsTitle}>Error Messages:</Text>
          <ScrollView style={styles.errorsList} showsVerticalScrollIndicator={false}>
            {testResult.errorMessages.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>Recommendations:</Text>
        <ScrollView style={styles.recommendationsList} showsVerticalScrollIndicator={false}>
          {testResult.recommendations.map((recommendation, index) => (
            <Text key={index} style={styles.recommendationText}>
              {recommendation}
            </Text>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.retestButton} onPress={runCleartextTest}>
        <RefreshCw size={16} color="#ffffff" />
        <Text style={styles.retestButtonText}>Run Test Again</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <AlertTriangle size={16} color="#f59e0b" />
        <Text style={styles.infoText}>
          This test verifies if Android cleartext traffic configuration is working. 
          If tests fail, the APK may be blocking HTTP requests to Arduino.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  testsContainer: {
    marginBottom: 16,
  },
  testsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 12,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 8,
  },
  testStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
  },
  errorsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorsList: {
    maxHeight: 100,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7f1d1d',
    marginBottom: 4,
    lineHeight: 16,
  },
  recommendationsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#92400e',
    marginBottom: 8,
  },
  recommendationsList: {
    maxHeight: 120,
  },
  recommendationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400e',
    marginBottom: 6,
    lineHeight: 16,
  },
  retestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  retestButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});