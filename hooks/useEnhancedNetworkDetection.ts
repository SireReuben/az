import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import TcpSocket from 'react-native-tcp-socket';

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
      isWifiEnabled: false,
      isInternetReachable: false,
    },
    lastSuccessfulConnection: null,
    connectionAttempts: 0,
    detectionStatus: 'checking',
  });

  const socketRef = useRef<any>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);
  const lastDetectionTime = useRef<number>(0);

  // Layer 1: Network Info Detection (SSID and IP validation)
  const checkNetworkInfo = useCallback(async (): Promise<boolean> => {
    try {
      const netInfoState = await NetInfo.fetch();
      
      if (!isComponentMounted.current) return false;

      const networkInfo = {
        ssid: null as string | null,
        ipAddress: null as string | null,
        isWifiEnabled: netInfoState.type === 'wifi',
        isInternetReachable: netInfoState.isInternetReachable ?? false,
      };

      // Extract SSID and IP address based on platform
      if (Platform.OS === 'android' && netInfoState.type === 'wifi' && netInfoState.details) {
        networkInfo.ssid = netInfoState.details.ssid || null;
        networkInfo.ipAddress = netInfoState.details.ipAddress || null;
      } else if (Platform.OS === 'ios' && netInfoState.type === 'wifi' && netInfoState.details) {
        networkInfo.ssid = netInfoState.details.ssid || null;
        networkInfo.ipAddress = netInfoState.details.ipAddress || null;
      }

      // Update network info
      setState(prev => ({
        ...prev,
        networkInfo,
      }));

      // Check if connected to Arduino WiFi
      const isConnectedToArduinoWifi = 
        networkInfo.isWifiEnabled && 
        networkInfo.ssid === finalConfig.expectedSSID &&
        networkInfo.ipAddress !== null &&
        networkInfo.ipAddress.startsWith('192.168.4.');

      setState(prev => ({
        ...prev,
        isConnectedToArduinoWifi,
      }));

      return isConnectedToArduinoWifi;
    } catch (error) {
      console.log('Network info check failed:', error);
      return false;
    }
  }, [finalConfig.expectedSSID]);

  // Layer 2: TCP Socket Connection Test
  const testTcpConnection = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isComponentMounted.current) {
        resolve(false);
        return;
      }

      // Clean up existing socket
      if (socketRef.current) {
        try {
          socketRef.current.destroy();
        } catch (error) {
          console.log('Error destroying previous socket:', error);
        }
        socketRef.current = null;
      }

      const socket = TcpSocket.createConnection({
        port: finalConfig.arduinoPort,
        host: finalConfig.arduinoIP,
        timeout: finalConfig.connectionTimeout,
      });

      socketRef.current = socket;
      let resolved = false;

      const cleanup = () => {
        if (socket && !socket.destroyed) {
          try {
            socket.destroy();
          } catch (error) {
            console.log('Error during socket cleanup:', error);
          }
        }
        if (socketRef.current === socket) {
          socketRef.current = null;
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
        console.log('TCP connection established to Arduino');
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoReachable: true,
          }));
        }
        resolveOnce(true);
      });

      socket.on('error', (error) => {
        console.log('TCP connection error:', error);
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoReachable: false,
          }));
        }
        resolveOnce(false);
      });

      socket.on('timeout', () => {
        console.log('TCP connection timeout');
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoReachable: false,
          }));
        }
        resolveOnce(false);
      });

      socket.on('close', () => {
        console.log('TCP connection closed');
        cleanup();
      });

      // Fallback timeout
      setTimeout(() => {
        resolveOnce(false);
      }, finalConfig.connectionTimeout + 1000);
    });
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
      
      if (!isOnArduinoNetwork) {
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
    
    if (socketRef.current) {
      try {
        socketRef.current.destroy();
      } catch (error) {
        console.log('Error destroying socket during stop:', error);
      }
      socketRef.current = null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
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