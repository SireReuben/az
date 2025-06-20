import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { Info, Trash2, Eye } from 'lucide-react-native';
import { AlertItem } from './AlertItem';

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source: 'local' | 'device';
}

interface AlertsListProps {
  alerts: Alert[];
  onMarkAsRead: (alertId: string) => void;
  onDeleteAlert: (alertId: string) => void;
  onClearAll: () => void;
  onMarkAllAsRead: () => void;
}

export function AlertsList({ 
  alerts, 
  onMarkAsRead, 
  onDeleteAlert, 
  onClearAll, 
  onMarkAllAsRead 
}: AlertsListProps) {
  const handleClearAll = () => {
    if (alerts.length === 0) return;
    
    RNAlert.alert(
      'Clear All Alerts',
      `Are you sure you want to delete all ${alerts.length} alerts? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: onClearAll
        },
      ]
    );
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  if (alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Info size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>No alerts at this time</Text>
        <Text style={styles.emptySubtext}>System is operating normally</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Alert Actions Header */}
      <View style={styles.actionsHeader}>
        <View style={styles.alertCount}>
          <Text style={styles.alertCountText}>
            {alerts.length} alerts {unreadCount > 0 && `(${unreadCount} unread)`}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMarkAllAsRead}
            >
              <Eye size={16} color="#6b7280" />
              <Text style={styles.actionButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleClearAll}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerts List */}
      <ScrollView 
        style={styles.alertsList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.alertsContent}
      >
        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onMarkAsRead={onMarkAsRead}
            onDeleteAlert={onDeleteAlert}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  alertCount: {
    flex: 1,
  },
  alertCountText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  alertsList: {
    flex: 1,
    maxHeight: 500,
  },
  alertsContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
});