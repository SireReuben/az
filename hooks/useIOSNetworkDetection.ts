import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// iOS-specific network detection optimizations
interface IOSNetworkDetectionState {
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
  lastError: string | null;
}

interface IOSConnectionConfig {
  arduinoIP: string;
  arduinoPort: number;
  expectedSSID: string;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const IOS_CONFIG: IOSConnectionConfig = {
  arduinoIP: '192.168.4.1',
  arduinoPort: 80,
  expectedSSID: 'AEROSPIN CONTROL',
  connectionTimeout: 8000, // Reduced timeout for faster detection
  retryAttempts: 3,
  retryDelay: 1500, // Reduced delay between retries
};

export function useIOSNetworkDetection(config: Partial<IOSConnectionConfig> = {}) {
  const finalConfig = { ...IOS_CONFIG, ...config };
  
  const [state, setState] = useState<IOSNetworkDetectionState>({
    isConnectedToArduinoWifi: false,
    isArduinoReachable: false,
    isArduinoResponding: false,
    connectionQuality: 'none',
    networkInfo: {
      ssid: null,
      ipAddress: null,
      isWifiEnabled: true,
      isInternetReachable: true,
    },
    lastSuccessfulConnection: null,
    connectionAttempts: 0,
    detectionStatus: 'checking',
    lastError: null,
  });

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // Enhanced iOS HTTP connection test with better error handling
  const testIOSConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      console.log('[iOS] Testing HTTP connection to Arduino...');
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('[iOS] Connection test timed out');
      }, finalConfig.connectionTimeout);
      
      // Enhanced fetch configuration for iOS
      const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'AEROSPIN-iOS/1.0.0',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Connection': 'close',
        },
        // Additional iOS-specific options
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[iOS] HTTP connection successful, status:', response.status);
        
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoReachable: true,
            isConnectedToArduinoWifi: true,
            lastError: null,
          }));
        }
        
        return true;
      } else {
        console.log('[iOS] HTTP connection failed with status:', response.status);
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            lastError: `HTTP ${response.status}: ${response.statusText}`,
          }));
        }
        return false;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[iOS] HTTP connection test failed:', errorMessage);
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
          isConnectedToArduinoWifi: false,
          lastError: errorMessage,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout]);

  // Enhanced iOS application handshake with better error handling
  const testIOSHandshake = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[iOS] Testing Arduino application response...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('[iOS] Handshake test timed out');
      }, finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AEROSPIN-iOS/1.0.0',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Connection': 'close',
        },
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('[iOS] Arduino response received:', responseText.substring(0, 100));
        
        // Enhanced response validation for iOS
        const isValidResponse = 
          responseText.length > 0 && (
            responseText.includes('status') || 
            responseText.includes('aerospin') ||
            responseText.includes('device') ||
            responseText.includes('direction') ||
            responseText.includes('brake') ||
            responseText.includes('speed') ||
            responseText.includes('pong') ||
            responseText.includes('{') // JSON response
          );
        
        if (isValidResponse && isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoResponding: true,
            lastSuccessfulConnection: new Date(),
            lastError: null,
            networkInfo: {
              ...prev.networkInfo,
              ssid: finalConfig.expectedSSID,
              ipAddress: '192.168.4.2',
            },
          }));
          
          return true;
        } else {
          console.log('[iOS] Invalid Arduino response format');
          if (isComponentMounted.current) {
            setState(prev => ({
              ...prev,
              lastError: 'Invalid response format from Arduino',
            }));
          }
          return false;
        }
      } else {
        console.log('[iOS] Arduino handshake failed with status:', response.status);
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            lastError: `Arduino handshake failed: HTTP ${response.status}`,
          }));
        }
        return false;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[iOS] Application handshake failed:', errorMessage);
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
          lastError: `Handshake failed: ${errorMessage}`,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout, finalConfig.expectedSSID]);

  // Enhanced iOS detection process with better error reporting
  const performIOSDetection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!isComponentMounted.current) return false;

    setState(prev => ({
      ...prev,
      detectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    console.log(`[iOS] Detection attempt ${retryCount + 1}/${finalConfig.retryAttempts + 1}`);

    try {
      // Step 1: Test HTTP connection with enhanced error handling
      const isHttpReachable = await testIOSConnection();
      
      if (!isHttpReachable) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`[iOS] HTTP test failed, retrying in ${finalConfig.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performIOSDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'none',
          lastError: prev.lastError || 'HTTP connection failed',
        }));
        return false;
      }

      // Step 2: Test application response with enhanced error handling
      const isAppResponding = await testIOSHandshake();
      
      if (!isAppResponding) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`[iOS] App handshake failed, retrying in ${finalConfig.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performIOSDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'poor',
          lastError: prev.lastError || 'Arduino application not responding',
        }));
        return false;
      }

      // Success!
      setState(prev => ({
        ...prev,
        detectionStatus: 'connected',
        connectionQuality: 'excellent',
        isConnectedToArduinoWifi: true,
        lastError: null,
      }));
      
      console.log('[iOS] Detection successful!');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[iOS] Full detection failed:', errorMessage);
      setState(prev => ({
        ...prev,
        detectionStatus: 'error',
        connectionQuality: 'none',
        isConnectedToArduinoWifi: false,
        lastError: errorMessage,
      }));
      return false;
    }
  }, [testIOSConnection, testIOSHandshake, finalConfig.retryAttempts, finalConfig.retryDelay]);

  // iOS-optimized monitoring with better error handling
  const startIOSMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Initial detection with delay to allow app to settle
    setTimeout(() => {
      if (isComponentMounted.current) {
        performIOSDetection();
      }
    }, 1000);

    // Check every 20 seconds for iOS (reduced frequency to avoid overwhelming the network)
    detectionIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        performIOSDetection();
      }
    }, 20000);
  }, [performIOSDetection]);

  // Stop monitoring
  const stopIOSMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Initialize monitoring for iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      console.log('[iOS] Starting iOS-optimized network detection...');
      startIOSMonitoring();
    }
    
    return () => {
      isComponentMounted.current = false;
      stopIOSMonitoring();
    };
  }, [startIOSMonitoring, stopIOSMonitoring]);

  // Manual refresh function with enhanced error handling
  const refreshConnection = useCallback(async () => {
    console.log('[iOS] Manual connection refresh...');
    setState(prev => ({
      ...prev,
      lastError: null,
    }));
    return performIOSDetection();
  }, [performIOSDetection]);

  // Get overall connection status
  const isFullyConnected = state.isConnectedToArduinoWifi && 
                          state.isArduinoReachable && 
                          state.isArduinoResponding;

  return {
    ...state,
    isFullyConnected,
    refreshConnection,
    startMonitoring: startIOSMonitoring,
    stopMonitoring: stopIOSMonitoring,
    config: finalConfig,
  };
}