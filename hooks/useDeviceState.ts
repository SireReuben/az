import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useAndroidArduinoConnection } from './useAndroidArduinoConnection';
import { useIOSNetworkDetection } from './useIOSNetworkDetection';

interface DeviceState {
  direction: string;
  brake: string;
  speed: number;
  sessionActive: boolean;
}

interface SessionData {
  startTime: string;
  duration: string;
  events: string[];
}

export function useDeviceState() {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    direction: 'None',
    brake: 'None',
    speed: 0,
    sessionActive: false,
  });

  const [sessionData, setSessionData] = useState<SessionData>({
    startTime: '',
    duration: '',
    events: [],
  });

  const [previousBrakePosition, setPreviousBrakePosition] = useState<string>('None');
  const sessionStartTimeRef = useRef<Date | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Use platform-specific connection hooks
  const androidConnection = useAndroidArduinoConnection();
  const iosConnection = useIOSNetworkDetection();

  // Select the appropriate connection based on platform
  const connection = Platform.OS === 'ios' ? {
    isConnected: iosConnection.isFullyConnected,
    connectionStatus: iosConnection.detectionStatus,
    lastResponse: null,
    responseTime: 0,
    sendCommand: async (endpoint: string, timeout?: number) => {
      try {
        const response = await fetch(`http://192.168.4.1${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AEROSPIN-iOS/1.0.0',
          },
        });
        
        const data = response.ok ? await response.json() : null;
        return { ok: response.ok, data, status: response.status };
      } catch (error) {
        throw error;
      }
    },
    testConnection: iosConnection.refreshConnection,
  } : androidConnection;

  const {
    isConnected,
    connectionStatus,
    lastResponse,
    responseTime,
    sendCommand,
    testConnection,
  } = connection;

  // Enhanced network detection info for compatibility
  const networkDetection = Platform.OS === 'ios' ? {
    isConnectedToArduinoWifi: iosConnection.isConnectedToArduinoWifi,
    isArduinoReachable: iosConnection.isArduinoReachable,
    isArduinoResponding: iosConnection.isArduinoResponding,
    connectionQuality: iosConnection.connectionQuality,
    networkInfo: iosConnection.networkInfo,
    detectionStatus: iosConnection.detectionStatus,
  } : {
    isConnectedToArduinoWifi: true,
    isArduinoReachable: connectionStatus === 'connected',
    isArduinoResponding: isConnected,
    connectionQuality: isConnected ? 'excellent' : 'none' as const,
    networkInfo: {
      ssid: 'AEROSPIN CONTROL',
      ipAddress: '192.168.4.2',
      isWifiEnabled: true,
      isInternetReachable: false,
    },
    detectionStatus: connectionStatus,
  };

  // Enhanced session event logging with detailed information
  const addSessionEvent = useCallback((event: string, details?: any) => {
    if (!deviceState.sessionActive) return;
    
    const now = new Date();
    const sessionTime = sessionStartTimeRef.current 
      ? Math.floor((now.getTime() - sessionStartTimeRef.current.getTime()) / 1000)
      : 0;
    
    const timestamp = now.toLocaleTimeString();
    const sessionTimeStr = `${Math.floor(sessionTime / 60)}:${(sessionTime % 60).toString().padStart(2, '0')}`;
    
    let eventWithDetails = `[${sessionTimeStr}] ${timestamp}: ${event}`;
    
    // Add response time if available
    if (responseTime > 0) {
      eventWithDetails += ` (${responseTime}ms)`;
    }
    
    // Add device state details for control operations
    if (details) {
      eventWithDetails += ` - ${JSON.stringify(details)}`;
    }
    
    setSessionData(prev => ({
      ...prev,
      events: [...prev.events, eventWithDetails],
    }));
    
    console.log('Session event:', eventWithDetails);
  }, [deviceState.sessionActive, responseTime]);

  // Optimized device state updates with debouncing
  const updateDeviceState = useCallback(async (updates: Partial<DeviceState>) => {
    const now = Date.now();
    
    // Debounce rapid updates (prevent UI lag)
    if (now - lastUpdateRef.current < 100) {
      setTimeout(() => updateDeviceState(updates), 100);
      return;
    }
    lastUpdateRef.current = now;

    // Store previous brake position before updating
    if (updates.brake !== undefined && deviceState.brake !== 'None') {
      setPreviousBrakePosition(deviceState.brake);
    }

    // Update state immediately for responsive UI
    setDeviceState(prev => {
      const newState = { ...prev, ...updates };
      return newState;
    });

    // Log detailed session events for each control operation
    if (deviceState.sessionActive) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'sessionActive') {
          const previousValue = deviceState[key as keyof DeviceState];
          addSessionEvent(
            `${key.toUpperCase()} changed: ${previousValue} → ${value}`,
            { 
              control: key, 
              from: previousValue, 
              to: value,
              timestamp: new Date().toISOString(),
              connectionStatus: isConnected ? 'online' : 'offline'
            }
          );
        }
      });
    }

    // Send commands to Arduino if connected
    if (!isConnected) {
      addSessionEvent('Operating in offline mode - changes saved locally');
      return;
    }

    try {
      const commandPromises = [];
      
      if (updates.direction !== undefined) {
        commandPromises.push(
          sendCommand(`/direction?state=${updates.direction.toLowerCase()}`)
            .then(() => addSessionEvent(`Direction command sent successfully: ${updates.direction}`))
            .catch(() => addSessionEvent(`Direction command failed: ${updates.direction}`))
        );
      }
      
      if (updates.brake !== undefined) {
        const action = updates.brake.toLowerCase();
        const state = updates.brake === 'None' ? 'off' : 'on';
        commandPromises.push(
          sendCommand(`/brake?action=${action}&state=${state}`)
            .then(() => addSessionEvent(`Brake command sent successfully: ${action} ${state}`))
            .catch(() => addSessionEvent(`Brake command failed: ${action} ${state}`))
        );
      }
      
      if (updates.speed !== undefined) {
        commandPromises.push(
          sendCommand(`/speed?value=${updates.speed}`)
            .then(() => addSessionEvent(`Speed command sent successfully: ${updates.speed}%`))
            .catch(() => addSessionEvent(`Speed command failed: ${updates.speed}%`))
        );
      }

      // Execute all commands in parallel for better performance
      await Promise.allSettled(commandPromises);
      
    } catch (error) {
      console.log('Device update failed, continuing in offline mode:', error);
      addSessionEvent('Device communication lost - operating offline', { error: error.message });
    }
  }, [deviceState, isConnected, sendCommand, addSessionEvent]);

  const fetchDeviceStatus = useCallback(async () => {
    if (!isConnected) return;

    try {
      const result = await sendCommand('/status', 5000);
      
      if (result.ok && result.data) {
        parseDeviceStatus(result.data);
      }
    } catch (error) {
      console.log('Failed to fetch device status:', error);
    }
  }, [isConnected, sendCommand]);

  const parseDeviceStatus = useCallback((statusData: any) => {
    try {
      const updates: Partial<DeviceState> = {};

      if (statusData.direction !== undefined) {
        updates.direction = statusData.direction;
      }
      if (statusData.brake !== undefined) {
        updates.brake = statusData.brake;
      }
      if (statusData.speed !== undefined) {
        updates.speed = parseInt(statusData.speed) || 0;
      }
      if (statusData.sessionActive !== undefined) {
        updates.sessionActive = statusData.sessionActive === true || statusData.sessionActive === 'true';
      }

      if (Object.keys(updates).length > 0) {
        setDeviceState(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.log('Failed to parse device status:', error);
    }
  }, []);

  const startSession = useCallback(async () => {
    const sessionStartTime = new Date();
    sessionStartTimeRef.current = sessionStartTime;
    const sessionStartTimeStr = sessionStartTime.toLocaleString();
    
    // Update local state immediately for responsive UI
    setDeviceState(prev => ({ ...prev, sessionActive: true }));
    
    setSessionData({
      startTime: sessionStartTimeStr,
      duration: '00:00:00',
      events: [
        `Session started at ${sessionStartTimeStr}`,
        `Platform: ${Platform.OS}`,
        `Connection: ${isConnected ? 'Online' : 'Offline'}`,
        `Device IP: 192.168.4.1`,
        `Session ID: SES_${Date.now()}`
      ],
    });

    if (!isConnected) {
      addSessionEvent('Operating in offline mode - all controls will be logged locally');
      return;
    }

    try {
      const result = await sendCommand('/startSession');
      if (result.ok) {
        addSessionEvent('Connected to Arduino device successfully');
        // Fetch updated status after starting session
        setTimeout(() => fetchDeviceStatus(), 1000);
      }
    } catch (error) {
      addSessionEvent('Device connection lost - continuing offline', { error: error.message });
    }
  }, [isConnected, sendCommand, addSessionEvent, fetchDeviceStatus]);

  const endSession = useCallback(async () => {
    if (!deviceState.sessionActive) return;

    const sessionEndTime = new Date();
    const duration = sessionStartTimeRef.current 
      ? Math.floor((sessionEndTime.getTime() - sessionStartTimeRef.current.getTime()) / 1000)
      : 0;
    
    const durationStr = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
    
    addSessionEvent(`Session ended at ${sessionEndTime.toLocaleString()}`);
    addSessionEvent(`Total session duration: ${durationStr}`);
    addSessionEvent(`Total events logged: ${sessionData.events.length + 2}`);

    if (isConnected) {
      try {
        const result = await sendCommand('/endSession');
        if (result.ok) {
          addSessionEvent('Session data saved to Arduino device');
        }
      } catch (error) {
        addSessionEvent('Session ended offline - data saved locally only');
      }
    }

    // Reset device state and brake position when ending session
    setTimeout(() => {
      setDeviceState(prev => ({ 
        ...prev, 
        sessionActive: false,
        direction: 'None',
        speed: 0,
        brake: 'None' // Reset brake to None when ending session
      }));
      sessionStartTimeRef.current = null;
    }, 100);
  }, [deviceState.sessionActive, isConnected, sendCommand, addSessionEvent, sessionData.events.length]);

  const resetDevice = useCallback(async () => {
    const currentBrake = deviceState.brake;
    setPreviousBrakePosition(currentBrake);

    if (deviceState.sessionActive) {
      addSessionEvent(`Device reset initiated - preserving brake position: ${currentBrake}`);
      await endSession();
    }

    setDeviceState(prev => ({
      direction: 'None',
      brake: currentBrake, // Preserve brake position during reset
      speed: 0,
      sessionActive: false,
    }));

    if (isConnected) {
      try {
        await sendCommand('/reset', 10000);
        addSessionEvent(`Reset command sent - device restarting. Brake position preserved: ${currentBrake}`);
      } catch (error) {
        addSessionEvent(`Reset command sent - device restarting. Brake position preserved: ${currentBrake}`);
      }
    } else {
      addSessionEvent(`Device reset (offline mode) - brake position preserved: ${currentBrake}`);
    }

    setSessionData({
      startTime: '',
      duration: '',
      events: [],
    });
  }, [deviceState, isConnected, sendCommand, addSessionEvent, endSession]);

  const emergencyStop = useCallback(async () => {
    const currentBrake = deviceState.brake;
    setPreviousBrakePosition(currentBrake);

    if (deviceState.sessionActive) {
      addSessionEvent(`🚨 EMERGENCY STOP ACTIVATED - preserving brake position: ${currentBrake}`);
    }

    const emergencyState = {
      speed: 0,
      direction: 'None',
      brake: currentBrake, // Preserve brake position during emergency stop
    };

    setDeviceState(prev => ({ ...prev, ...emergencyState }));

    if (isConnected) {
      try {
        await Promise.all([
          sendCommand('/speed?value=0', 3000),
          sendCommand('/direction?state=none', 3000)
        ]);
        addSessionEvent(`Emergency stop commands sent to device - brake position maintained: ${currentBrake}`);
      } catch (error) {
        addSessionEvent(`Emergency stop - device communication failed, local stop applied. Brake position preserved: ${currentBrake}`);
      }
    } else {
      addSessionEvent(`Emergency stop applied (offline mode) - brake position preserved: ${currentBrake}`);
    }
  }, [deviceState, isConnected, sendCommand, addSessionEvent]);

  const releaseBrake = useCallback(async () => {
    await updateDeviceState({ brake: 'None' });
    if (deviceState.sessionActive) {
      addSessionEvent('Brake released to None position');
    }
  }, [updateDeviceState, deviceState.sessionActive, addSessionEvent]);

  const refreshConnection = useCallback(async () => {
    const success = await testConnection();
    
    if (success) {
      setTimeout(() => fetchDeviceStatus(), 1000);
    }
    
    return success;
  }, [testConnection, fetchDeviceStatus]);

  // Real-time duration calculation with better performance
  const calculateDuration = useCallback((): string => {
    if (!sessionStartTimeRef.current) return '00:00:00';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - sessionStartTimeRef.current.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Optimized session data updates and periodic status fetching
  useEffect(() => {
    let durationInterval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    // Update duration every second if session is active (optimized)
    if (deviceState.sessionActive && sessionStartTimeRef.current) {
      durationInterval = setInterval(() => {
        if (isComponentMounted) {
          setSessionData(prev => ({
            ...prev,
            duration: calculateDuration(),
          }));
        }
      }, 1000);
    }

    // Fetch device status periodically if connected (reduced frequency for better performance)
    if (isConnected && deviceState.sessionActive) {
      statusInterval = setInterval(() => {
        if (isComponentMounted) {
          fetchDeviceStatus();
        }
      }, 10000); // Reduced to every 10 seconds for better performance
      
      // Initial fetch after a short delay
      setTimeout(() => {
        if (isComponentMounted) {
          fetchDeviceStatus();
        }
      }, 2000);
    }

    return () => {
      isComponentMounted = false;
      if (durationInterval) clearInterval(durationInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [deviceState.sessionActive, isConnected, fetchDeviceStatus, calculateDuration]);

  // Initial status fetch when connection is established
  useEffect(() => {
    if (isConnected && connectionStatus === 'connected') {
      setTimeout(() => fetchDeviceStatus(), 500);
    }
  }, [isConnected, connectionStatus, fetchDeviceStatus]);

  return {
    deviceState,
    isConnected,
    sessionData,
    connectionAttempts: 0,
    lastSuccessfulConnection: null,
    updateDeviceState,
    startSession,
    endSession,
    resetDevice,
    emergencyStop,
    releaseBrake,
    previousBrakePosition,
    refreshConnection,
    networkDetection,
  };
}