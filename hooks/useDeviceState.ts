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

// Enhanced connection logic specifically for Android APK
const ARDUINO_BASE_URL = Platform.OS === 'web' ? '/api' : 'http://192.168.4.1';
const CONNECTION_TIMEOUT = 8000; // Increased for Android
const MAX_RETRY_ATTEMPTS = 5; // More retries for Android

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

  // Use enhanced network detection with Android-optimized settings
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
    connectionTimeout: 8000, // Increased timeout for Android
    retryAttempts: 5, // More retries for Android
    retryDelay: 1500, // Shorter delay between retries
  });

  // Use the enhanced connection status
  const isConnected = isFullyConnected;

  // Enhanced Arduino command sending with better error handling
  const sendArduinoCommand = useCallback(async (endpoint: string, timeout: number = CONNECTION_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      console.log(`Sending Arduino command: ${endpoint}`);
      
      const response = await fetch(`${ARDUINO_BASE_URL}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept': 'text/plain, */*',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Arduino command failed: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log(`Arduino response for ${endpoint}:`, responseText);
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.log(`Arduino command failed for ${endpoint}:`, error);
      throw error;
    }
  }, []);

  // Enhanced device status fetching
  const fetchDeviceStatus = useCallback(async () => {
    if (!isConnected) {
      console.log('Skipping status fetch - device not connected');
      return;
    }

    try {
      const response = await sendArduinoCommand('/status', 6000);
      
      if (response.ok) {
        const statusText = await response.text();
        console.log('Device status received:', statusText);
        parseDeviceStatus(statusText);
      }
    } catch (error) {
      console.log('Failed to fetch device status:', error);
    }
  }, [isConnected, sendArduinoCommand]);

  // Parse device status with better error handling
  const parseDeviceStatus = useCallback((statusText: string) => {
    try {
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
          updates.sessionActive = trimmedLine.replace('Session: ', '') === 'Active';
        }
      });

      if (Object.keys(updates).length > 0) {
        setDeviceState(prev => ({ ...prev, ...updates }));
        console.log('Device state updated:', updates);
      }
    } catch (error) {
      console.log('Failed to parse device status:', error);
    }
  }, []);

  // Enhanced session data updates
  useEffect(() => {
    if (!deviceState.sessionActive) return;

    let durationInterval: NodeJS.Timeout;
    let sessionInterval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    const updateSessionData = () => {
      if (!isComponentMounted) return;
      
      setSessionData(prev => ({
        ...prev,
        duration: calculateDuration(prev.startTime),
      }));
    };

    // Update duration every second
    durationInterval = setInterval(updateSessionData, 1000);

    // Fetch session log and device status when connected
    if (isConnected) {
      const fetchSessionLog = async () => {
        if (!isComponentMounted) return;

        try {
          const response = await sendArduinoCommand('/getSessionLog', 5000);
          
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

      // Fetch session log every 20 seconds
      sessionInterval = setInterval(fetchSessionLog, 20000);
      
      // Fetch device status every 15 seconds
      statusInterval = setInterval(fetchDeviceStatus, 15000);
      
      // Initial fetch
      setTimeout(fetchSessionLog, 2000);
      setTimeout(fetchDeviceStatus, 3000);
    }

    return () => {
      isComponentMounted = false;
      if (durationInterval) clearInterval(durationInterval);
      if (sessionInterval) clearInterval(sessionInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [deviceState.sessionActive, isConnected, sendArduinoCommand, fetchDeviceStatus]);

  const addSessionEvent = useCallback((event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventWithTime = `${timestamp}: ${event}`;
    
    setSessionData(prev => ({
      ...prev,
      events: [...prev.events, eventWithTime],
    }));
    
    console.log('Session event added:', eventWithTime);
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
        addSessionEvent(`Direction command sent: ${updates.direction}`);
      }
      
      if (updates.brake !== undefined) {
        const action = updates.brake.toLowerCase();
        const state = updates.brake === 'None' ? 'off' : 'on';
        await sendArduinoCommand(`/brake?action=${action}&state=${state}`);
        addSessionEvent(`Brake command sent: ${action} ${state}`);
      }
      
      if (updates.speed !== undefined) {
        await sendArduinoCommand(`/speed?value=${updates.speed}`);
        addSessionEvent(`Speed command sent: ${updates.speed}%`);
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
        await sendArduinoCommand('/reset', 10000); // Longer timeout for reset
        
        // After reset, restore the brake position
        setTimeout(async () => {
          let reconnectAttempts = 0;
          const maxAttempts = 10; // More attempts for Android
          
          const attemptReconnectAndRestore = async () => {
            try {
              const response = await sendArduinoCommand('/ping', 3000);
              if (response.ok) {
                // Restore brake position after successful reconnection
                if (currentBrake !== 'None') {
                  try {
                    const action = currentBrake.toLowerCase();
                    await sendArduinoCommand(`/brake?action=${action}&state=on`, 5000);
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
              setTimeout(attemptReconnectAndRestore, 4000); // Longer delay for Android
            } else {
              addSessionEvent(`Device reset completed - manual reconnection required. Brake position preserved locally: ${currentBrake}`);
            }
          };
          
          attemptReconnectAndRestore();
        }, 8000); // Longer initial delay for Arduino restart
        
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
        // Send emergency commands with shorter timeouts for immediate response
        await sendArduinoCommand('/speed?value=0', 2000);
        await sendArduinoCommand('/direction?state=none', 2000);
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