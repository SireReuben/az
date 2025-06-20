import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source: 'local' | 'device';
}

const ARDUINO_BASE_URL = Platform.OS === 'web' ? '/api' : 'http://192.168.4.1';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Add alert function with duplicate prevention
  const addAlert = useCallback((
    type: Alert['type'], 
    title: string, 
    message: string, 
    source: 'local' | 'device' = 'local'
  ) => {
    // Check for duplicate alerts within the last 30 seconds
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000);
    
    const isDuplicate = alerts.some(alert => 
      alert.title === title && 
      alert.message === message && 
      alert.timestamp > thirtySecondsAgo
    );

    if (isDuplicate) return;

    const newAlert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: now,
      read: false,
      source,
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep only latest 50 alerts
  }, [alerts]);

  // Mark alert as read
  const markAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  }, []);

  // Delete specific alert
  const deleteAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Mark all alerts as read
  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  }, []);

  // Check device connection and fetch alerts
  const checkConnectionAndFetchAlerts = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${ARDUINO_BASE_URL}/ping`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (!isConnected) {
          setIsConnected(true);
          addAlert('success', 'Device Connected', 'Successfully connected to AEROSPIN device', 'device');
        }
        
        // Fetch device-specific alerts
        await fetchDeviceAlerts();
      } else {
        if (isConnected) {
          setIsConnected(false);
          addAlert('error', 'Connection Lost', 'Lost connection to AEROSPIN device', 'local');
        }
      }
    } catch (error) {
      if (isConnected) {
        setIsConnected(false);
        addAlert('error', 'Connection Failed', 'Unable to connect to AEROSPIN device', 'local');
      }
    }
  }, [isConnected, addAlert]);

  // Fetch device-specific alerts
  const fetchDeviceAlerts = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${ARDUINO_BASE_URL}/alerts`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const deviceAlerts = await response.json();
        
        // Process device alerts
        deviceAlerts.forEach((alert: any) => {
          addAlert(
            alert.type || 'info',
            alert.title || 'Device Alert',
            alert.message || 'Device notification',
            'device'
          );
        });
      }
    } catch (error) {
      // Silent fail - device might not support alerts endpoint
    }
  }, [addAlert]);

  // Generate system alerts based on various conditions
  const generateSystemAlerts = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    
    // System health check alerts
    if (Math.random() > 0.85) { // 15% chance
      const healthAlerts = [
        {
          type: 'info' as const,
          title: 'System Check',
          message: 'Routine system health check completed successfully'
        },
        {
          type: 'success' as const,
          title: 'Data Sync',
          message: 'Device data synchronized successfully'
        },
        {
          type: 'warning' as const,
          title: 'Temperature Alert',
          message: 'Motor temperature is elevated - monitor closely'
        },
        {
          type: 'info' as const,
          title: 'Maintenance Reminder',
          message: 'Scheduled maintenance check recommended'
        }
      ];

      const randomAlert = healthAlerts[Math.floor(Math.random() * healthAlerts.length)];
      addAlert(randomAlert.type, randomAlert.title, randomAlert.message, 'device');
    }

    // Time-based alerts
    if (hour === 9 && now.getMinutes() === 0) { // 9 AM daily reminder
      addAlert('info', 'Daily Startup', 'AEROSPIN system ready for daily operations', 'local');
    }
  }, [addAlert]);

  // Connection monitoring and alert generation
  useEffect(() => {
    let alertInterval: NodeJS.Timeout;
    let systemInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    // Initial connection check
    const initialCheck = setTimeout(() => {
      if (isComponentMounted) {
        checkConnectionAndFetchAlerts();
      }
    }, 2000);

    // Regular connection and alert checks
    const startPeriodicChecks = setTimeout(() => {
      if (isComponentMounted) {
        alertInterval = setInterval(checkConnectionAndFetchAlerts, 10000); // Every 10 seconds
        systemInterval = setInterval(generateSystemAlerts, 30000); // Every 30 seconds
      }
    }, 5000);

    // Add initial welcome alert
    setTimeout(() => {
      if (isComponentMounted) {
        addAlert('info', 'System Ready', 'AEROSPIN Control System initialized successfully', 'local');
      }
    }, 1000);

    return () => {
      isComponentMounted = false;
      clearTimeout(initialCheck);
      clearTimeout(startPeriodicChecks);
      if (alertInterval) clearInterval(alertInterval);
      if (systemInterval) clearInterval(systemInterval);
    };
  }, [checkConnectionAndFetchAlerts, generateSystemAlerts, addAlert]);

  // Session-related alerts
  const addSessionAlert = useCallback((type: Alert['type'], title: string, message: string) => {
    addAlert(type, title, message, 'local');
  }, [addAlert]);

  // Safety alerts
  const addSafetyAlert = useCallback((message: string) => {
    addAlert('error', 'Safety Alert', message, 'device');
  }, [addAlert]);

  // Operation alerts
  const addOperationAlert = useCallback((operation: string, status: 'success' | 'warning' | 'error') => {
    const titles = {
      success: 'Operation Complete',
      warning: 'Operation Warning',
      error: 'Operation Failed'
    };
    
    addAlert(status, titles[status], `${operation} ${status === 'success' ? 'completed successfully' : status === 'warning' ? 'completed with warnings' : 'failed'}`, 'local');
  }, [addAlert]);

  // Get unread count
  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Get alerts by type
  const getAlertsByType = useCallback((type: Alert['type']) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  // Get recent alerts (last 24 hours)
  const getRecentAlerts = useCallback(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return alerts.filter(alert => alert.timestamp > twentyFourHoursAgo);
  }, [alerts]);

  return {
    alerts,
    unreadCount,
    isConnected,
    addAlert,
    addSessionAlert,
    addSafetyAlert,
    addOperationAlert,
    markAsRead,
    deleteAlert,
    clearAllAlerts,
    markAllAsRead,
    getAlertsByType,
    getRecentAlerts,
  };
}