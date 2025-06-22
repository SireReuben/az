import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Settings, Zap, TestTube } from 'lucide-react-native';
import { Platform } from 'react-native';

interface BuildProfileIndicatorProps {
  buildProfile: 'development' | 'preview' | 'production' | 'unknown';
  connectionTime?: number;
  successRate?: number;
}

export function BuildProfileIndicator({ 
  buildProfile, 
  connectionTime = 0, 
  successRate = 0 
}: BuildProfileIndicatorProps) {
  const getBuildProfileInfo = () => {
    switch (buildProfile) {
      case 'production':
        return {
          icon: <Zap size={16} color="#22c55e" />,
          label: 'Production Build',
          description: 'Optimized for Arduino communication',
          color: '#22c55e',
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
        };
      case 'preview':
        return {
          icon: <TestTube size={16} color="#f59e0b" />,
          label: 'Preview Build',
          description: 'May have slower Arduino connections',
          color: '#f59e0b',
          bgColor: '#fffbeb',
          borderColor: '#fed7aa',
        };
      case 'development':
        return {
          icon: <Settings size={16} color="#6b7280" />,
          label: 'Development Build',
          description: 'Use production build for Arduino testing',
          color: '#6b7280',
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb',
        };
      default:
        return {
          icon: <Settings size={16} color="#6b7280" />,
          label: 'Unknown Build',
          description: 'Build profile could not be determined',
          color: '#6b7280',
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb',
        };
    }
  };

  const profileInfo = getBuildProfileInfo();

  const getPerformanceRating = () => {
    if (buildProfile === 'production') {
      return 'Excellent';
    } else if (buildProfile === 'preview') {
      return 'Good';
    } else {
      return 'Variable';
    }
  };

  if (Platform.OS === 'web') {
    return null; // Don't show on web
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: profileInfo.bgColor,
        borderColor: profileInfo.borderColor,
      }
    ]}>
      <View style={styles.header}>
        {profileInfo.icon}
        <Text style={[styles.label, { color: profileInfo.color }]}>
          {profileInfo.label}
        </Text>
      </View>
      
      <Text style={styles.description}>
        {profileInfo.description}
      </Text>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Performance:</Text>
          <Text style={[styles.metricValue, { color: profileInfo.color }]}>
            {getPerformanceRating()}
          </Text>
        </View>
        
        {connectionTime > 0 && (
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Last Connection:</Text>
            <Text style={styles.metricValue}>
              {connectionTime}ms
            </Text>
          </View>
        )}
        
        {successRate > 0 && (
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Success Rate:</Text>
            <Text style={styles.metricValue}>
              {successRate}%
            </Text>
          </View>
        )}
      </View>
      
      {buildProfile !== 'production' && (
        <View style={styles.recommendation}>
          <Text style={styles.recommendationText}>
            💡 For best Arduino performance, use: eas build --platform android --profile production
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 12,
  },
  metricsContainer: {
    gap: 6,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  recommendation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  recommendationText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
});