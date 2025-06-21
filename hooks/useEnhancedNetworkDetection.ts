import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// Web-compatible network detection
interface NetworkDetectionState {
  isConnectedToArduinoWifi: boolean;
  isArduinoReachable: boolean;
  isArduinoResponding: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'none';
  networkInfo: {
    ssid: string | null;
    ipAddress: string | null;
    isWifiEnabled: boolean;
    isInternetReachable: boolean;
  };
  lastSuccessfulConnection: Date | null;
  connectionAttempts: number;
  detectionStatus: 'checking' | 'connected' | 'disconnected' | 'error';
}

interface ConnectionConfig {
  arduinoIP: string;
  arduinoPort: number;
  expectedSSID: string;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: ConnectionConfig = {
  arduinoIP: '192.168.4.1',
  arduinoPort: 80,
  expectedSSID: 'AEROSPIN CONTROL',
  connectionTimeout: 5000,
  retryAttempts: 3,
  retryDelay: 2000,
};

export function useEnhancedNetworkDetection(config: Partial<ConnectionConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<NetworkDetectionState>({
    isConnectedToArduinoWifi: false,
    isArduinoReachable: false,
    isArduinoResponding: false,
    connectionQuality: 'none',
    networkInfo: {
      ssid: null,
      ipAddress: null,
      isWifiEnabled: true, // Assume enabled for web
      isInternetReachable: true, // Assume reachable for web
    },
    lastSuccessfulConnection: null,
    connectionAttempts: 0,
    detectionStatus: 'checking',
  });

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);
  const lastDetectionTime = useRef<number>(0);

  // Layer 1: Network Info Detection (Web-compatible version)
  const checkNetworkInfo = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      let networkInfo = {
        ssid: null as string | null,
        ipAddress: null as string | null,
        isWifiEnabled: true,
        isInternetReachable: navigator.onLine,
      };

      // For web platform, we can't detect SSID directly
      // We'll assume connection if we can reach the Arduino
      if (Platform.OS === 'web') {
        // Try to detect if we're on the Arduino network by checking if we can reach it
        try {
          const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(2000),
          });
          
          if (response.ok) {
            networkInfo.ssid = finalConfig.expectedSSID;
            networkInfo.ipAddress = '192.168.4.2'; // Typical client IP on Arduino network
          }
        } catch (error) {
          // Not on Arduino network or Arduino not reachable
        }
      } else {
        // For mobile platforms, try to use NetInfo if available
        try {
          // Check if NetInfo is available before requiring it
          const NetInfo = require('@react-native-community/netinfo');
          const netInfoState = await NetInfo.fetch();
          
          networkInfo.isWifiEnabled = netInfoState.type === 'wifi';
          networkInfo.isInternetReachable = netInfoState.isInternetReachable ?? false;
          
          if (netInfoState.type === 'wifi' && netInfoState.details) {
            networkInfo.ssid = netInfoState.details.ssid || null;
            networkInfo.ipAddress = netInfoState.details.ipAddress || null;
          }
        } catch (error) {
          console.log('NetInfo not available, using fallback detection');
          // Fallback to basic network detection
          networkInfo.isInternetReachable = true; // Assume available
        }
      }

      // Update network info
      setState(prev => ({
        ...prev,
        networkInfo,
      }));

      // Check if connected to Arduino WiFi
      const isConnectedToArduinoWifi = 
        networkInfo.isWifiEnabled && 
        (networkInfo.ssid === finalConfig.expectedSSID || Platform.OS === 'web') &&
        networkInfo.ipAddress !== null;

      setState(prev => ({
        ...prev,
        isConnectedToArduinoWifi,
      }));

      return isConnectedToArduinoWifi;
    } catch (error) {
      console.log('Network info check failed:', error);
      return false;
    }
  }, [finalConfig.expectedSSID, finalConfig.arduinoIP]);

  // Layer 2: TCP Socket Connection Test (Web-compatible)
  const testTcpConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      if (Platform.OS === 'web') {
        // For web, we'll use a simple HTTP request as a proxy for TCP connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
        
        try {
          const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
            method: 'HEAD',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          const isReachable = response.ok || response.status < 500;
          
          if (isComponentMounted.current) {
            setState(prev => ({
              ...prev,
              isArduinoReachable: isReachable,
            }));
          }
          
          return isReachable;
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (isComponentMounted.current) {
            setState(prev => ({
              ...prev,
              isArduinoReachable: false,
            }));
          }
          
          return false;
        }
      } else {
        // For mobile platforms, try to use TCP socket if available
        try {
          // Check if TcpSocket is available before requiring it
          const TcpSocket = require('react-native-tcp-socket');
          
          return new Promise((resolve) => {
            const socket = TcpSocket.createConnection({
              port: finalConfig.arduinoPort,
              host: finalConfig.arduinoIP,
              timeout: finalConfig.connectionTimeout,
            });

            let resolved = false;

            const cleanup = () => {
              if (socket && !socket.destroyed) {
                try {
                  socket.destroy();
                } catch (error) {
                  console.log('Error during socket cleanup:', error);
                }
              }
            };

            const resolveOnce = (result: boolean) => {
              if (!resolved) {
                resolved = true;
                cleanup();
                resolve(result);
              }
            };

            socket.on('connect', () => {
              if (isComponentMounted.current) {
                setState(prev => ({
                  ...prev,
                  isArduinoReachable: true,
                }));
              }
              resolveOnce(true);
            });

            socket.on('error', () => {
              if (isComponentMounted.current) {
                setState(prev => ({
                  ...prev,
                  isArduinoReachable: false,
                }));
              }
              resolveOnce(false);
            });

            socket.on('timeout', () => {
              if (isComponentMounted.current) {
                setState(prev => ({
                  ...prev,
                  isArduinoReachable: false,
                }));
              }
              resolveOnce(false);
            });

            // Fallback timeout
            setTimeout(() => {
              resolveOnce(false);
            }, finalConfig.connectionTimeout + 1000);
          });
        } catch (error) {
          console.log('TCP Socket not available, using HTTP fallback');
          // Fallback to HTTP test for mobile when TCP socket is not available
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
          
          try {
            const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
              method: 'HEAD',
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            const isReachable = response.ok || response.status < 500;
            
            if (isComponentMounted.current) {
              setState(prev => ({
                ...prev,
                isArduinoReachable: isReachable,
              }));
            }
            
            return isReachable;
          } catch (error) {
            clearTimeout(timeoutId);
            
            if (isComponentMounted.current) {
              setState(prev => ({
                ...prev,
                isArduinoReachable: false,
              }));
            }
            
            return false;
          }
        }
      }
    } catch (error) {
      console.log('TCP connection test failed:', error);
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.arduinoPort, finalConfig.connectionTimeout]);

  // Layer 3: Application-Level Handshake
  const testApplicationHandshake = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseText = await response.text();
        const isValidResponse = responseText.toLowerCase().includes('pong') || 
                               responseText.toLowerCase().includes('ok');
        
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoResponding: isValidResponse,
            lastSuccessfulConnection: isValidResponse ? new Date() : prev.lastSuccessfulConnection,
          }));
        }
        
        return isValidResponse;
      }
      
      return false;
    } catch (error) {
      console.log('Application handshake failed:', error);
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout]);

  // Comprehensive Connection Detection
  const performFullDetection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!isComponentMounted.current) return false;

    const now = Date.now();
    
    // Prevent too frequent detection attempts
    if (now - lastDetectionTime.current < 1000) {
      return state.isArduinoResponding;
    }
    
    lastDetectionTime.current = now;

    setState(prev => ({
      ...prev,
      detectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    try {
      // Layer 1: Check network info and SSID
      const isOnArduinoNetwork = await checkNetworkInfo();
      
      if (!isOnArduinoNetwork && Platform.OS !== 'web') {
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'none',
        }));
        return false;
      }

      // Layer 2: Test TCP connection
      const isTcpReachable = await testTcpConnection();
      
      if (!isTcpReachable) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`TCP connection failed, retrying... (${retryCount + 1}/${finalConfig.retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performFullDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'poor',
        }));
        return false;
      }

      // Layer 3: Test application handshake
      const isAppResponding = await testApplicationHandshake();
      
      if (!isAppResponding) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`Application handshake failed, retrying... (${retryCount + 1}/${finalConfig.retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performFullDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'good',
        }));
        return false;
      }

      // All layers successful
      setState(prev => ({
        ...prev,
        detectionStatus: 'connected',
        connectionQuality: 'excellent',
      }));
      
      return true;
    } catch (error) {
      console.log('Full detection failed:', error);
      setState(prev => ({
        ...prev,
        detectionStatus: 'error',
        connectionQuality: 'none',
      }));
      return false;
    }
  }, [checkNetworkInfo, testTcpConnection, testApplicationHandshake, finalConfig.retryAttempts, finalConfig.retryDelay, state.isArduinoResponding]);

  // Start continuous monitoring
  const startMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Initial detection
    setTimeout(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, 1000);

    // Continuous monitoring with adaptive intervals
    detectionIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, state.isArduinoResponding ? 15000 : 8000); // Check less frequently when connected
  }, [performFullDetection, state.isArduinoResponding]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes (only on mobile)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, restart monitoring
        setTimeout(() => {
          if (isComponentMounted.current) {
            startMonitoring();
          }
        }, 1000);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background, stop monitoring to save battery
        stopMonitoring();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [startMonitoring, stopMonitoring]);

  // Initialize monitoring
  useEffect(() => {
    startMonitoring();
    
    return () => {
      isComponentMounted.current = false;
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Manual refresh function
  const refreshConnection = useCallback(async () => {
    return performFullDetection();
  }, [performFullDetection]);

  // Get overall connection status
  const isFullyConnected = state.isConnectedToArduinoWifi && 
                          state.isArduinoReachable && 
                          state.isArduinoResponding;

  return {
    ...state,
    isFullyConnected,
    refreshConnection,
    startMonitoring,
    stopMonitoring,
    config: finalConfig,
  };
}