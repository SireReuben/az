import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react-native';

interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  storageUsage: number;
  networkLatency: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    cpuUsage: 0,
    storageUsage: 0,
    networkLatency: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate performance metrics (replace with actual monitoring)
      setMetrics({
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100,
        storageUsage: Math.random() * 100,
        networkLatency: Math.random() * 200,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, threshold: number) => {
    if (value < threshold * 0.6) return '#22c55e';
    if (value < threshold * 0.8) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Monitor</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Activity size={20} color={getStatusColor(metrics.memoryUsage, 100)} />
          <Text style={styles.metricLabel}>Memory</Text>
          <Text style={[styles.metricValue, { color: getStatusColor(metrics.memoryUsage, 100) }]}>
            {metrics.memoryUsage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metric}>
          <Cpu size={20} color={getStatusColor(metrics.cpuUsage, 100)} />
          <Text style={styles.metricLabel}>CPU</Text>
          <Text style={[styles.metricValue, { color: getStatusColor(metrics.cpuUsage, 100) }]}>
            {metrics.cpuUsage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metric}>
          <HardDrive size={20} color={getStatusColor(metrics.storageUsage, 100)} />
          <Text style={styles.metricLabel}>Storage</Text>
          <Text style={[styles.metricValue, { color: getStatusColor(metrics.storageUsage, 100) }]}>
            {metrics.storageUsage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metric}>
          <Wifi size={20} color={getStatusColor(metrics.networkLatency, 200)} />
          <Text style={styles.metricLabel}>Latency</Text>
          <Text style={[styles.metricValue, { color: getStatusColor(metrics.networkLatency, 200) }]}>
            {metrics.networkLatency.toFixed(0)}ms
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginTop: 2,
  },
});