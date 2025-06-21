import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useEnhancedNetworkDetection } from './useEnhancedNetworkDetection';

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

// Enhanced connection logic for Android
const ARDUINO_BASE_URL = Platform.OS === 'web' ? '/api' : 'http://192.168.4.1';
const CONNECTION_TIMEOUT = 5000;
const MAX_RETRY_ATTEMPTS = 3;

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

  // Store brake position before reset/emergency stop
  const [previousBrakePosition, setPreviousBrakePosition] = useState<string>('None');

  // Use enhanced network detection
  const {
    isFullyConnected,
    isConnectedToArduinoWifi,
    isArduinoReachable,
    isArduinoResponding,
    connectionQuality,
    networkInfo,
    detectionStatus,
    connectionAttempts,
    lastSuccessfulConnection,
    refreshConnection,
  } = useEnhancedNetworkDetection({
    arduinoIP: '192.168.4.1',
    arduinoPort: 80,
    expectedSSID: 'AEROSPIN CONTROL',
    connectionTimeout: 5000,
    retryAttempts: 3,
    retryDelay: 2000,
  });

  // Use the enhanced connection status
  const isConnected = isFullyConnected;

  const fetchDeviceStatus = useCallback(async () => {
    if (!isConnected) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
      
      const response = await fetch(`${ARDUINO_BASE_URL}/status`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const statusText = await response.text();
        parseDeviceStatus(statusText);
      }
    } catch (error) {
      console.log('Failed to fetch device status:', error);
    }
  }, [isConnected]);

  // Session data updates with optimized intervals
  useEffect(() => {
    if (!deviceState.sessionActive) return;

    let durationInterval: NodeJS.Timeout;
    let sessionInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    const updateSessionData = () => {
      if (!isComponentMounted) return;
      
      setSessionData(prev => ({
        ...prev,
        duration: calculateDuration(prev.startTime),
      }));
    };

    durationInterval = setInterval(updateSessionData, 1000);

    if (isConnected) {
      const fetchSessionLog = async () => {
        if (!isComponentMounted) return;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
          
          const response = await fetch(`${ARDUINO_BASE_URL}/getSessionLog`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok && isComponentMounted) {
            const logData = await response.text();
            const events = logData.split('\n').filter(line => line.trim());
            
            setSessionData(prev => ({
              ...prev,
              events,
            }));
          }
        } catch (error) {
          console.log('Failed to fetch session log:', error);
        }
      };

      sessionInterval = setInterval(fetchSessionLog, 15000);
    }

    return () => {
      isComponentMounted = false;
      if (durationInterval) clearInterval(durationInterval);
      if (sessionInterval) clearInterval(sessionInterval);
    };
  }, [deviceState.sessionActive, isConnected]);

  const parseDeviceStatus = useCallback((statusText: string) => {
    const lines = statusText.split('\n');
    const updates: Partial<DeviceState> = {};

    lines.forEach(line => {
      if (line.startsWith('Direction: ')) {
        updates.direction = line.replace('Direction: ', '');
      } else if (line.startsWith('Brake: ')) {
        updates.brake = line.replace('Brake: ', '');
      } else if (line.startsWith('Speed: ')) {
        updates.speed = parseInt(line.replace('Speed: ', '')) || 0;
      } else if (line.startsWith('Session: ')) {
        updates.sessionActive = line.replace('Session: ', '') === 'Active';
      }
    });

    setDeviceState(prev => ({ ...prev, ...updates }));
  }, []);

  const addSessionEvent = useCallback((event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventWithTime = `${timestamp}: ${event}`;
    
    setSessionData(prev => ({
      ...prev,
      events: [...prev.events, eventWithTime],
    }));
  }, []);

  const sendArduinoCommand = useCallback(async (endpoint: string, timeout: number = CONNECTION_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${ARDUINO_BASE_URL}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Arduino command failed: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, []);

  const updateDeviceState = useCallback(async (updates: Partial<DeviceState>) => {
    // Store previous brake position before any changes
    if (updates.brake !== undefined && deviceState.brake !== 'None') {
      setPreviousBrakePosition(deviceState.brake);
    }

    // Update local state immediately for smooth UI
    setDeviceState(prev => ({ ...prev, ...updates }));

    // Log the change if session is active
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
        await sendArduinoCommand(`/direction?state=${updates.direction.toLowerCase()}`);
      }
      
      if (updates.brake !== undefined) {
        const action = updates.brake.toLowerCase();
        const state = updates.brake === 'None' ? 'off' : 'on';
        await sendArduinoCommand(`/brake?action=${action}&state=${state}`);
      }
      
      if (updates.speed !== undefined) {
        await sendArduinoCommand(`/speed?value=${updates.speed}`);
      }
    } catch (error) {
      console.log('Device update failed, continuing in offline mode:', error);
      addSessionEvent('Device communication lost - operating offline');
    }
  }, [deviceState, isConnected, sendArduinoCommand, addSessionEvent]);

  const startSession = useCallback(async () => {
    const sessionStartTime = new Date().toLocaleString();
    
    setDeviceState(prev => ({ ...prev, sessionActive: true }));
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
      await sendArduinoCommand('/startSession');
      addSessionEvent('Connected to device successfully');
    } catch (error) {
      addSessionEvent('Device connection lost - continuing offline');
    }
  }, [isConnected, sendArduinoCommand, addSessionEvent]);

  const endSession = useCallback(async () => {
    addSessionEvent(`Session ended at ${new Date().toLocaleString()}`);

    if (isConnected) {
      try {
        const response = await sendArduinoCommand('/endSession');
        if (response.ok) {
          const logData = await response.text();
          console.log('Session ended. Final log:', logData);
          addSessionEvent('Session data saved to device');
        }
      } catch (error) {
        console.log('Session ended offline');
        addSessionEvent('Session ended offline - data saved locally');
      }
    }

    setTimeout(() => {
      setDeviceState(prev => ({ 
        ...prev, 
        sessionActive: false,
        direction: 'None',
        speed: 0,
        // Keep brake position as is when ending session
      }));
    }, 100);
  }, [isConnected, sendArduinoCommand, addSessionEvent]);

  const resetDevice = useCallback(async () => {
    // Store current brake position before reset
    const currentBrake = deviceState.brake;
    setPreviousBrakePosition(currentBrake);

    if (deviceState.sessionActive) {
      addSessionEvent(`Device reset initiated - preserving brake position: ${currentBrake}`);
      await endSession();
    }

    // Reset state but preserve brake position
    setDeviceState(prev => ({
      direction: 'None',
      brake: currentBrake, // Preserve brake position during reset
      speed: 0,
      sessionActive: false,
    }));

    if (isConnected) {
      try {
        await sendArduinoCommand('/reset', 8000);
        
        // After reset, restore the brake position
        setTimeout(async () => {
          let reconnectAttempts = 0;
          const maxAttempts = 8;
          
          const attemptReconnectAndRestore = async () => {
            try {
              const response = await sendArduinoCommand('/ping', 2000);
              if (response.ok) {
                // Restore brake position after successful reconnection
                if (currentBrake !== 'None') {
                  try {
                    const action = currentBrake.toLowerCase();
                    await sendArduinoCommand(`/brake?action=${action}&state=on`, 3000);
                    addSessionEvent(`Device reset completed - brake position restored to: ${currentBrake}`);
                  } catch (brakeError) {
                    addSessionEvent(`Device reset completed - failed to restore brake position: ${currentBrake}`);
                  }
                } else {
                  addSessionEvent('Device reset completed - reconnected');
                }
                return;
              }
            } catch (error) {
              // Continue trying
            }
            
            reconnectAttempts++;
            if (reconnectAttempts < maxAttempts) {
              setTimeout(attemptReconnectAndRestore, 3000);
            } else {
              addSessionEvent(`Device reset completed - manual reconnection required. Brake position preserved locally: ${currentBrake}`);
            }
          };
          
          attemptReconnectAndRestore();
        }, 5000);
        
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
  }, [deviceState, isConnected, sendArduinoCommand, addSessionEvent, endSession]);

  const emergencyStop = useCallback(async () => {
    // Store current brake position before emergency stop
    const currentBrake = deviceState.brake;
    setPreviousBrakePosition(currentBrake);

    if (deviceState.sessionActive) {
      addSessionEvent(`EMERGENCY STOP ACTIVATED - preserving brake position: ${currentBrake}`);
    }

    // Emergency stop: set speed to 0, direction to None, but preserve brake position
    const emergencyState = {
      speed: 0,
      direction: 'None',
      // Keep current brake position instead of forcing pull
      brake: currentBrake,
    };

    setDeviceState(prev => ({ ...prev, ...emergencyState }));

    if (isConnected) {
      try {
        await sendArduinoCommand('/speed?value=0', 1500);
        await sendArduinoCommand('/direction?state=none', 1500);
        // Don't change brake position during emergency stop
        
        addSessionEvent(`Emergency stop commands sent to device - brake position maintained: ${currentBrake}`);
      } catch (error) {
        addSessionEvent(`Emergency stop - device communication failed, local stop applied. Brake position preserved: ${currentBrake}`);
      }
    } else {
      addSessionEvent(`Emergency stop applied (offline mode) - brake position preserved: ${currentBrake}`);
    }
  }, [deviceState, isConnected, sendArduinoCommand, addSessionEvent]);

  const releaseBrake = useCallback(async () => {
    await updateDeviceState({ brake: 'None' });
    if (deviceState.sessionActive) {
      addSessionEvent('Brake released');
    }
  }, [updateDeviceState, deviceState.sessionActive, addSessionEvent]);

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

  return {
    deviceState,
    isConnected,
    sessionData,
    connectionAttempts,
    lastSuccessfulConnection,
    updateDeviceState,
    startSession,
    endSession,
    resetDevice,
    emergencyStop,
    releaseBrake,
    previousBrakePosition,
    refreshConnection,
    // Enhanced network detection info
    networkDetection: {
      isConnectedToArduinoWifi,
      isArduinoReachable,
      isArduinoResponding,
      connectionQuality,
      networkInfo,
      detectionStatus,
    },
  };
}