import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAndroidArduinoConnection } from './useAndroidArduinoConnection';

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

  // Use the Android-optimized Arduino connection
  const {
    isConnected,
    connectionStatus,
    lastResponse,
    responseTime,
    sendCommand,
    testConnection,
  } = useAndroidArduinoConnection();

  // Enhanced network detection info for compatibility
  const networkDetection = {
    isConnectedToArduinoWifi: true, // Assume true since Arduino LCD shows connection
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

  const addSessionEvent = useCallback((event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventWithTime = `${timestamp}: ${event} (${responseTime}ms)`;
    
    setSessionData(prev => ({
      ...prev,
      events: [...prev.events, eventWithTime],
    }));
    
    console.log('Session event added:', eventWithTime);
  }, [responseTime]);

  const fetchDeviceStatus = useCallback(async () => {
    if (!isConnected) return;

    try {
      console.log('Fetching device status...');
      const result = await sendCommand('/status', 8000);
      
      if (result.ok && result.text) {
        console.log('Device status received:', result.text);
        parseDeviceStatus(result.text);
      } else {
        console.log('Device status request failed:', result.status);
      }
    } catch (error) {
      console.log('Failed to fetch device status:', error);
    }
  }, [isConnected, sendCommand]);

  const parseDeviceStatus = useCallback((statusText: string) => {
    try {
      console.log('Parsing device status:', statusText);
      const lines = statusText.split('\n');
      const updates: Partial<DeviceState> = {};

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('Direction: ')) {
          updates.direction = trimmedLine.replace('Direction: ', '');
        } else if (trimmedLine.startsWith('Brake: ')) {
          updates.brake = trimmedLine.replace('Brake: ', '');
        } else if (trimmedLine.startsWith('Speed: ')) {
          updates.speed = parseInt(trimmedLine.replace('Speed: ', '')) || 0;
        } else if (trimmedLine.startsWith('Session: ')) {
          const sessionStatus = trimmedLine.replace('Session: ', '');
          updates.sessionActive = sessionStatus === 'Active';
          console.log('Parsed session status from Arduino:', sessionStatus, '-> sessionActive:', updates.sessionActive);
        }
      });

      if (Object.keys(updates).length > 0) {
        console.log('Updating device state with parsed data:', updates);
        setDeviceState(prev => {
          const newState = { ...prev, ...updates };
          console.log('New device state:', newState);
          return newState;
        });
      }
    } catch (error) {
      console.log('Failed to parse device status:', error);
    }
  }, []);

  const updateDeviceState = useCallback(async (updates: Partial<DeviceState>) => {
    if (updates.brake !== undefined && deviceState.brake !== 'None') {
      setPreviousBrakePosition(deviceState.brake);
    }

    console.log('Updating device state:', updates);
    setDeviceState(prev => {
      const newState = { ...prev, ...updates };
      console.log('Device state updated to:', newState);
      return newState;
    });

    if (deviceState.sessionActive) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'sessionActive') {
          addSessionEvent(`${key} changed to ${value}`);
        }
      });
    }

    if (!isConnected) {
      addSessionEvent('Operating in offline mode - changes saved locally');
      return;
    }

    try {
      if (updates.direction !== undefined) {
        await sendCommand(`/direction?state=${updates.direction.toLowerCase()}`);
        addSessionEvent(`Direction command sent: ${updates.direction}`);
      }
      
      if (updates.brake !== undefined) {
        const action = updates.brake.toLowerCase();
        const state = updates.brake === 'None' ? 'off' : 'on';
        await sendCommand(`/brake?action=${action}&state=${state}`);
        addSessionEvent(`Brake command sent: ${action} ${state}`);
      }
      
      if (updates.speed !== undefined) {
        await sendCommand(`/speed?value=${updates.speed}`);
        addSessionEvent(`Speed command sent: ${updates.speed}%`);
      }
    } catch (error) {
      console.log('Device update failed, continuing in offline mode:', error);
      addSessionEvent('Device communication lost - operating offline');
    }
  }, [deviceState, isConnected, sendCommand, addSessionEvent]);

  const startSession = useCallback(async () => {
    const sessionStartTime = new Date().toLocaleString();
    
    console.log('Starting session...');
    
    // Update local state first
    setDeviceState(prev => {
      const newState = { ...prev, sessionActive: true };
      console.log('Session started - device state:', newState);
      return newState;
    });
    
    setSessionData({
      startTime: sessionStartTime,
      duration: '00:00:00',
      events: [`Session started at ${sessionStartTime}`],
    });

    if (!isConnected) {
      addSessionEvent('Operating in offline mode');
      return;
    }

    try {
      const result = await sendCommand('/startSession');
      if (result.ok) {
        addSessionEvent('Connected to device successfully');
        // Fetch updated status after starting session
        setTimeout(() => {
          fetchDeviceStatus();
        }, 2000);
      }
    } catch (error) {
      addSessionEvent('Device connection lost - continuing offline');
    }
  }, [isConnected, sendCommand, addSessionEvent, fetchDeviceStatus]);

  const endSession = useCallback(async () => {
    console.log('Ending session...');
    addSessionEvent(`Session ended at ${new Date().toLocaleString()}`);

    if (isConnected) {
      try {
        const result = await sendCommand('/endSession');
        if (result.ok) {
          console.log('Session ended. Final log:', result.text);
          addSessionEvent('Session data saved to device');
        }
      } catch (error) {
        console.log('Session ended offline');
        addSessionEvent('Session ended offline - data saved locally');
      }
    }

    setTimeout(() => {
      setDeviceState(prev => {
        const newState = { 
          ...prev, 
          sessionActive: false,
          direction: 'None',
          speed: 0,
        };
        console.log('Session ended - device state:', newState);
        return newState;
      });
    }, 100);
  }, [isConnected, sendCommand, addSessionEvent]);

  const resetDevice = useCallback(async () => {
    const currentBrake = deviceState.brake;
    setPreviousBrakePosition(currentBrake);

    if (deviceState.sessionActive) {
      addSessionEvent(`Device reset initiated - preserving brake position: ${currentBrake}`);
      await endSession();
    }

    setDeviceState(prev => ({
      direction: 'None',
      brake: currentBrake,
      speed: 0,
      sessionActive: false,
    }));

    if (isConnected) {
      try {
        await sendCommand('/reset', 15000);
        addSessionEvent(`Reset command sent - device restarting. Brake position preserved: ${currentBrake}`);
      } catch (error) {
        console.log('Reset command failed, device may have restarted');
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
      addSessionEvent(`EMERGENCY STOP ACTIVATED - preserving brake position: ${currentBrake}`);
    }

    const emergencyState = {
      speed: 0,
      direction: 'None',
      brake: currentBrake,
    };

    setDeviceState(prev => ({ ...prev, ...emergencyState }));

    if (isConnected) {
      try {
        await sendCommand('/speed?value=0', 3000);
        await sendCommand('/direction?state=none', 3000);
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
      addSessionEvent('Brake released');
    }
  }, [updateDeviceState, deviceState.sessionActive, addSessionEvent]);

  const refreshConnection = useCallback(async () => {
    console.log('Manual connection refresh for Android APK...');
    const success = await testConnection();
    
    // After successful connection, fetch device status to sync session state
    if (success) {
      setTimeout(() => {
        fetchDeviceStatus();
      }, 2000);
    }
    
    return success;
  }, [testConnection, fetchDeviceStatus]);

  const calculateDuration = useCallback((startTime: string): string => {
    if (!startTime) return '00:00:00';
    
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Session data updates and periodic status fetching
  useEffect(() => {
    let durationInterval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    const updateSessionData = () => {
      if (!isComponentMounted) return;
      
      setSessionData(prev => ({
        ...prev,
        duration: calculateDuration(prev.startTime),
      }));
    };

    // Update duration every second if session is active
    if (deviceState.sessionActive) {
      durationInterval = setInterval(updateSessionData, 1000);
    }

    // Fetch device status periodically if connected
    if (isConnected) {
      statusInterval = setInterval(() => {
        if (isComponentMounted) {
          fetchDeviceStatus();
        }
      }, 15000); // Check every 15 seconds
      
      // Initial fetch after a short delay
      setTimeout(() => {
        if (isComponentMounted) {
          fetchDeviceStatus();
        }
      }, 3000);
    }

    return () => {
      isComponentMounted = false;
      if (durationInterval) clearInterval(durationInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [deviceState.sessionActive, isConnected, fetchDeviceStatus, calculateDuration]);

  // Debug logging for session state
  useEffect(() => {
    console.log('Device state changed:', deviceState);
  }, [deviceState]);

  // Initial status fetch when connection is established
  useEffect(() => {
    if (isConnected && connectionStatus === 'connected') {
      console.log('Connection established, fetching initial device status...');
      setTimeout(() => {
        fetchDeviceStatus();
      }, 1000);
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