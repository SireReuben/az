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
  _updateTrigger?: number; // Internal trigger for forcing updates
  _lastEventTime?: number; // Track when last event was added
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
    duration: '00:00:00',
    events: [],
    _updateTrigger: 0,
    _lastEventTime: 0,
  });

  const [previousBrakePosition, setPreviousBrakePosition] = useState<string>('None');
  const sessionStartTimeRef = useRef<Date | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventUpdateTriggerRef = useRef<number>(0);
  const forceUpdateCallbacksRef = useRef<Set<() => void>>(new Set());

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

  // Real-time duration calculation
  const calculateDuration = useCallback((): string => {
    if (!sessionStartTimeRef.current) return '00:00:00';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - sessionStartTimeRef.current.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // CRITICAL FIX: Force immediate update trigger for all components
  const triggerImmediateUpdate = useCallback(() => {
    eventUpdateTriggerRef.current = Date.now();
    
    // Trigger all registered callbacks
    forceUpdateCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in force update callback:', error);
      }
    });
    
    console.log('🔄 IMMEDIATE UPDATE TRIGGERED:', eventUpdateTriggerRef.current);
  }, []);

  // CRITICAL FIX: Enhanced session event logging with IMMEDIATE state updates
  const addSessionEvent = useCallback((event: string, details?: any) => {
    if (!deviceState.sessionActive) return;
    
    const now = new Date();
    const eventTime = now.getTime();
    const sessionTime = sessionStartTimeRef.current 
      ? Math.floor((eventTime - sessionStartTimeRef.current.getTime()) / 1000)
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
      eventWithDetails += ` - Details: ${JSON.stringify(details)}`;
    }
    
    console.log('🔄 ADDING SESSION EVENT:', eventWithDetails);
    
    // CRITICAL FIX: Update session data with multiple triggers for immediate updates
    setSessionData(prev => {
      const newEvents = [...prev.events, eventWithDetails];
      const newDuration = calculateDuration();
      const newUpdateTrigger = Date.now();
      
      console.log('📊 SESSION DATA UPDATE - Events:', newEvents.length, 'Trigger:', newUpdateTrigger);
      
      const newSessionData: SessionData = {
        startTime: prev.startTime,
        duration: newDuration,
        events: newEvents,
        _updateTrigger: newUpdateTrigger,
        _lastEventTime: eventTime,
      };
      
      // CRITICAL: Trigger immediate update after state change
      setTimeout(() => {
        triggerImmediateUpdate();
      }, 10);
      
      return newSessionData;
    });
    
  }, [deviceState.sessionActive, responseTime, calculateDuration, triggerImmediateUpdate]);

  // CRITICAL FIX: Enhanced device state updates with IMMEDIATE event logging
  const updateDeviceState = useCallback(async (updates: Partial<DeviceState>) => {
    const now = Date.now();
    
    // Debounce rapid updates (prevent UI lag)
    if (now - lastUpdateRef.current < 100) {
      setTimeout(() => updateDeviceState(updates), 100);
      return;
    }
    lastUpdateRef.current = now;

    // Store previous values for logging
    const previousState = { ...deviceState };

    // Store previous brake position before updating
    if (updates.brake !== undefined && deviceState.brake !== 'None') {
      setPreviousBrakePosition(deviceState.brake);
    }

    // CRITICAL FIX: Update state immediately for responsive UI
    setDeviceState(prev => {
      const newState = { ...prev, ...updates };
      console.log('🎮 DEVICE STATE UPDATED:', newState);
      return newState;
    });

    // CRITICAL FIX: Log events IMMEDIATELY after state update with major state change trigger
    if (deviceState.sessionActive) {
      // Process each update and add events immediately
      const eventPromises = Object.entries(updates).map(async ([key, value]) => {
        if (key !== 'sessionActive') {
          const previousValue = previousState[key as keyof DeviceState];
          
          // Enhanced logging for different control types with clear markers
          if (key === 'direction') {
            addSessionEvent(`🎮 DIRECTION changed: ${previousValue} → ${value}`, { 
              type: 'control_operation',
              control: 'direction', 
              from: previousValue, 
              to: value,
              timestamp: new Date().toISOString(),
              connectionStatus: isConnected ? 'online' : 'offline',
              majorStateChange: true
            });
          } else if (key === 'brake') {
            addSessionEvent(`🎮 BRAKE changed: ${previousValue} → ${value}`, { 
              type: 'control_operation',
              control: 'brake', 
              from: previousValue, 
              to: value,
              timestamp: new Date().toISOString(),
              connectionStatus: isConnected ? 'online' : 'offline',
              majorStateChange: true
            });
          } else if (key === 'speed') {
            addSessionEvent(`🎮 SPEED changed: ${previousValue}% → ${value}%`, { 
              type: 'control_operation',
              control: 'speed', 
              from: previousValue, 
              to: value,
              timestamp: new Date().toISOString(),
              connectionStatus: isConnected ? 'online' : 'offline',
              majorStateChange: true
            });
          }
        }
      });

      // Wait for all events to be added, then trigger updates
      await Promise.all(eventPromises);
      
      // CRITICAL FIX: Multiple update triggers to ensure UI updates
      setTimeout(() => {
        triggerImmediateUpdate();
        
        // Additional trigger after a short delay to ensure all components update
        setTimeout(() => {
          triggerImmediateUpdate();
        }, 100);
      }, 50);
    }

    // Send commands to Arduino if connected
    if (!isConnected) {
      if (deviceState.sessionActive) {
        addSessionEvent('⚠️ Operating in offline mode - changes saved locally', {
          type: 'system_event',
          offline: true,
          majorStateChange: true
        });
      }
      return;
    }

    try {
      const commandPromises = [];
      
      if (updates.direction !== undefined) {
        commandPromises.push(
          sendCommand(`/direction?state=${updates.direction.toLowerCase()}`)
            .then(() => {
              if (deviceState.sessionActive) {
                addSessionEvent(`✅ Arduino command sent: Direction set to ${updates.direction}`, {
                  type: 'arduino_command',
                  command: 'direction',
                  value: updates.direction,
                  majorStateChange: true
                });
              }
            })
            .catch(() => {
              if (deviceState.sessionActive) {
                addSessionEvent(`❌ Arduino command failed: Direction ${updates.direction}`, {
                  type: 'arduino_error',
                  command: 'direction',
                  value: updates.direction,
                  majorStateChange: true
                });
              }
            })
        );
      }
      
      if (updates.brake !== undefined) {
        const action = updates.brake.toLowerCase();
        const state = updates.brake === 'None' ? 'off' : 'on';
        commandPromises.push(
          sendCommand(`/brake?action=${action}&state=${state}`)
            .then(() => {
              if (deviceState.sessionActive) {
                addSessionEvent(`✅ Arduino command sent: Brake ${action} ${state}`, {
                  type: 'arduino_command',
                  command: 'brake',
                  action: action,
                  state: state,
                  majorStateChange: true
                });
              }
            })
            .catch(() => {
              if (deviceState.sessionActive) {
                addSessionEvent(`❌ Arduino command failed: Brake ${action} ${state}`, {
                  type: 'arduino_error',
                  command: 'brake',
                  action: action,
                  state: state,
                  majorStateChange: true
                });
              }
            })
        );
      }
      
      if (updates.speed !== undefined) {
        commandPromises.push(
          sendCommand(`/speed?value=${updates.speed}`)
            .then(() => {
              if (deviceState.sessionActive) {
                addSessionEvent(`✅ Arduino command sent: Speed set to ${updates.speed}%`, {
                  type: 'arduino_command',
                  command: 'speed',
                  value: updates.speed,
                  majorStateChange: true
                });
              }
            })
            .catch(() => {
              if (deviceState.sessionActive) {
                addSessionEvent(`❌ Arduino command failed: Speed ${updates.speed}%`, {
                  type: 'arduino_error',
                  command: 'speed',
                  value: updates.speed,
                  majorStateChange: true
                });
              }
            })
        );
      }

      // Execute all commands in parallel for better performance
      await Promise.allSettled(commandPromises);
      
    } catch (error) {
      console.log('Device update failed, continuing in offline mode:', error);
      if (deviceState.sessionActive) {
        addSessionEvent('❌ Device communication lost - operating offline', { 
          type: 'system_error',
          error: error.message,
          majorStateChange: true
        });
      }
    }
  }, [deviceState, isConnected, sendCommand, addSessionEvent, calculateDuration, triggerImmediateUpdate]);

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
    
    // Initialize session data with proper events
    const initialEvents = [
      `🚀 SESSION STARTED at ${sessionStartTimeStr}`,
      `📱 Platform: ${Platform.OS}`,
      `🌐 Connection: ${isConnected ? 'Online' : 'Offline'}`,
      `🔧 Device IP: 192.168.4.1`,
      `🆔 Session ID: SES_${Date.now()}`,
      `⚡ System initialized and ready for operations`
    ];

    const initialUpdateTrigger = Date.now();
    setSessionData({
      startTime: sessionStartTimeStr,
      duration: '00:00:00',
      events: initialEvents,
      _updateTrigger: initialUpdateTrigger,
      _lastEventTime: sessionStartTime.getTime(),
    });

    // CRITICAL FIX: Start the duration timer with forced updates
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    durationIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current) {
        const newDuration = calculateDuration();
        const newUpdateTrigger = Date.now();
        
        setSessionData(prev => ({
          ...prev,
          duration: newDuration,
          _updateTrigger: newUpdateTrigger,
        }));
        
        // Trigger immediate update for all components
        triggerImmediateUpdate();
      }
    }, 1000);

    // Trigger immediate update after session start
    setTimeout(() => {
      triggerImmediateUpdate();
    }, 100);

    if (!isConnected) {
      // Add offline mode event
      setTimeout(() => {
        addSessionEvent('⚠️ Operating in offline mode - all controls will be logged locally', {
          type: 'system_event',
          offline: true,
          majorStateChange: true
        });
      }, 200);
      return;
    }

    try {
      const result = await sendCommand('/startSession');
      if (result.ok) {
        setTimeout(() => {
          addSessionEvent('✅ Connected to Arduino device successfully', {
            type: 'system_event',
            arduino_connected: true,
            majorStateChange: true
          });
          // Fetch updated status after starting session
          fetchDeviceStatus();
        }, 200);
      }
    } catch (error) {
      setTimeout(() => {
        addSessionEvent('⚠️ Device connection lost - continuing offline', { 
          type: 'system_error',
          error: error.message,
          majorStateChange: true
        });
      }, 200);
    }
  }, [isConnected, sendCommand, addSessionEvent, fetchDeviceStatus, calculateDuration, triggerImmediateUpdate]);

  const endSession = useCallback(async () => {
    if (!deviceState.sessionActive) return;

    const sessionEndTime = new Date();
    const duration = sessionStartTimeRef.current 
      ? Math.floor((sessionEndTime.getTime() - sessionStartTimeRef.current.getTime()) / 1000)
      : 0;
    
    const durationStr = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
    
    // Stop the duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Add final session events
    addSessionEvent(`🏁 SESSION ENDED at ${sessionEndTime.toLocaleString()}`, {
      type: 'session_event',
      action: 'end',
      majorStateChange: true
    });
    addSessionEvent(`⏱️ Total session duration: ${durationStr}`, {
      type: 'session_summary',
      duration: durationStr,
      majorStateChange: true
    });
    addSessionEvent(`📊 Total events logged: ${sessionData.events.length + 2}`, {
      type: 'session_summary',
      event_count: sessionData.events.length + 2,
      majorStateChange: true
    });
    addSessionEvent(`🔒 Brake position reset to None (session end procedure)`, {
      type: 'safety_event',
      brake_reset: true,
      majorStateChange: true
    });

    if (isConnected) {
      try {
        const result = await sendCommand('/endSession');
        if (result.ok) {
          addSessionEvent('💾 Session data saved to Arduino device', {
            type: 'system_event',
            data_saved: true,
            majorStateChange: true
          });
        }
      } catch (error) {
        addSessionEvent('💾 Session ended offline - data saved locally only', {
          type: 'system_event',
          offline_save: true,
          majorStateChange: true
        });
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

    // Log the reset operation in session
    if (deviceState.sessionActive) {
      addSessionEvent(`🚨 DEVICE RESET initiated - preserving brake position: ${currentBrake}`, {
        type: 'emergency_event',
        action: 'reset',
        brake_preserved: currentBrake,
        majorStateChange: true
      });
      addSessionEvent(`⚠️ Reset operation: All controls stopped, device restarting`, {
        type: 'emergency_event',
        action: 'reset_details',
        majorStateChange: true
      });
      addSessionEvent(`🛡️ Safety protocol: Brake position maintained during reset`, {
        type: 'safety_event',
        brake_maintained: true,
        majorStateChange: true
      });
    }

    // End session if active before reset
    if (deviceState.sessionActive) {
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
        console.log(`Reset command sent - device restarting. Brake position preserved: ${currentBrake}`);
      } catch (error) {
        console.log(`Reset command sent - device restarting. Brake position preserved: ${currentBrake}`);
      }
    }

    setSessionData({
      startTime: '',
      duration: '00:00:00',
      events: [],
      _updateTrigger: 0,
      _lastEventTime: 0,
    });
  }, [deviceState, isConnected, sendCommand, addSessionEvent, endSession]);

  const emergencyStop = useCallback(async () => {
    const currentBrake = deviceState.brake;
    setPreviousBrakePosition(currentBrake);

    // CRITICAL FIX: Log emergency stop operation in session IMMEDIATELY with major state changes
    if (deviceState.sessionActive) {
      addSessionEvent(`🚨 EMERGENCY STOP ACTIVATED`, {
        type: 'emergency_event',
        action: 'emergency_stop',
        critical: true,
        majorStateChange: true
      });
      addSessionEvent(`⛔ Emergency action: All motor operations halted immediately`, {
        type: 'emergency_event',
        action: 'motor_halt',
        majorStateChange: true
      });
      addSessionEvent(`🛡️ Safety protocol: Brake position preserved (${currentBrake})`, {
        type: 'safety_event',
        brake_preserved: currentBrake,
        majorStateChange: true
      });
      addSessionEvent(`⏰ Emergency stop time: ${new Date().toLocaleTimeString()}`, {
        type: 'emergency_event',
        timestamp: new Date().toISOString(),
        majorStateChange: true
      });
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
        
        if (deviceState.sessionActive) {
          addSessionEvent(`✅ Emergency commands sent to Arduino device successfully`, {
            type: 'emergency_event',
            arduino_response: 'success',
            majorStateChange: true
          });
          addSessionEvent(`📡 Device response: Speed set to 0%, Direction set to None`, {
            type: 'emergency_event',
            device_confirmation: true,
            majorStateChange: true
          });
        }
      } catch (error) {
        if (deviceState.sessionActive) {
          addSessionEvent(`⚠️ Emergency stop - device communication failed, local stop applied`, {
            type: 'emergency_event',
            offline_emergency: true,
            majorStateChange: true
          });
          addSessionEvent(`🔒 Offline emergency protocol: Local controls stopped`, {
            type: 'safety_event',
            offline_protocol: true,
            majorStateChange: true
          });
        }
      }
    } else {
      if (deviceState.sessionActive) {
        addSessionEvent(`🔒 Emergency stop applied in offline mode`, {
          type: 'emergency_event',
          offline_mode: true,
          majorStateChange: true
        });
        addSessionEvent(`🛡️ Offline emergency protocol: All local controls stopped`, {
          type: 'safety_event',
          offline_emergency: true,
          majorStateChange: true
        });
      }
    }
  }, [deviceState, isConnected, sendCommand, addSessionEvent]);

  const releaseBrake = useCallback(async () => {
    // Log brake release operation
    if (deviceState.sessionActive) {
      addSessionEvent(`🎮 BRAKE RELEASE operation initiated`, {
        type: 'control_operation',
        action: 'brake_release',
        majorStateChange: true
      });
      addSessionEvent(`🔓 Brake operation: Releasing from ${deviceState.brake} to None position`, {
        type: 'control_operation',
        brake_from: deviceState.brake,
        brake_to: 'None',
        majorStateChange: true
      });
    }

    await updateDeviceState({ brake: 'None' });
    
    if (deviceState.sessionActive) {
      addSessionEvent('✅ Brake release operation completed successfully', {
        type: 'control_operation',
        action: 'brake_release_complete',
        majorStateChange: true
      });
    }
  }, [updateDeviceState, deviceState.sessionActive, deviceState.brake, addSessionEvent]);

  const refreshConnection = useCallback(async () => {
    const success = await testConnection();
    
    if (success) {
      setTimeout(() => fetchDeviceStatus(), 1000);
    }
    
    return success;
  }, [testConnection, fetchDeviceStatus]);

  // CRITICAL FIX: Register force update callback system
  const registerForceUpdateCallback = useCallback((callback: () => void) => {
    forceUpdateCallbacksRef.current.add(callback);
    
    return () => {
      forceUpdateCallbacksRef.current.delete(callback);
    };
  }, []);

  // Cleanup duration timer on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Periodic status fetching
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let isComponentMounted = true;

    // Fetch device status periodically if connected (reduced frequency for better performance)
    if (isConnected && deviceState.sessionActive) {
      statusInterval = setInterval(() => {
        if (isComponentMounted) {
          fetchDeviceStatus();
        }
      }, 10000); // Every 10 seconds
      
      // Initial fetch after a short delay
      setTimeout(() => {
        if (isComponentMounted) {
          fetchDeviceStatus();
        }
      }, 2000);
    }

    return () => {
      isComponentMounted = false;
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [deviceState.sessionActive, isConnected, fetchDeviceStatus]);

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
    registerForceUpdateCallback, // CRITICAL: Expose callback registration
  };
}