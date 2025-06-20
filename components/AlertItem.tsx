import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle, Info, Trash2, Eye, EyeOff } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source: 'local' | 'device';
}

interface AlertItemProps {
  alert: Alert;
  onMarkAsRead: (alertId: string) => void;
  onDeleteAlert: (alertId: string) => void;
}

export function AlertItem({ alert, onMarkAsRead, onDeleteAlert }: AlertItemProps) {
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value }],
  }));

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#22c55e" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'error':
        return <XCircle size={20} color="#ef4444" />;
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return { bg: '#f0fdf4', border: '#22c55e' };
      case 'warning':
        return { bg: '#fffbeb', border: '#f59e0b' };
      case 'error':
        return { bg: '#fef2f2', border: '#ef4444' };
      default:
        return { bg: '#eff6ff', border: '#3b82f6' };
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleDeleteAlert = (alertId: string, alertTitle: string) => {
    RNAlert.alert(
      'Delete Alert',
      `Are you sure you want to delete "${alertTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteAlert(alertId)
        },
      ]
    );
  };

  const colors = getAlertColor(alert.type);

  return (
    <Animated.View
      style={[
        styles.alertItem,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
          opacity: alert.read ? 0.7 : 1,
        },
        animatedStyle,
      ]}
    >
      {/* Unread Indicator */}
      {!alert.read && <View style={styles.unreadIndicator} />}
      
      {/* Alert Content */}
      <TouchableOpacity
        style={styles.alertContent}
        onPress={() => onMarkAsRead(alert.id)}
        activeOpacity={0.7}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertIconTitle}>
            {getAlertIcon(alert.type)}
            <View style={styles.alertTitleContainer}>
              <Text style={[
                styles.alertTitle,
                !alert.read && styles.unreadTitle
              ]}>
                {alert.title}
              </Text>
              <View style={styles.alertMeta}>
                <Text style={styles.alertSource}>
                  {alert.source === 'device' ? '🔧 Device' : '📱 App'}
                </Text>
                <Text style={styles.alertTimestamp}>
                  {formatTimestamp(alert.timestamp)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Alert Actions */}
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.alertActionButton}
              onPress={() => onMarkAsRead(alert.id)}
            >
              {alert.read ? (
                <EyeOff size={16} color="#6b7280" />
              ) : (
                <Eye size={16} color="#3b82f6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertActionButton}
              onPress={() => handleDeleteAlert(alert.id, alert.title)}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.alertMessage}>{alert.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  alertItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    zIndex: 1,
  },
  alertContent: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertIconTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  alertTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertSource: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  alertTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertActionButton: {
    padding: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4b5563',
    lineHeight: 20,
  },
});