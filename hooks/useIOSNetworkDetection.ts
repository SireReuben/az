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
  connectionTimeout: 15000, // iOS typically has faster networking
  retryAttempts: 3,
  retryDelay: 2000,
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
  });

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // iOS-optimized HTTP connection test
  const testIOSConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      console.log('[iOS] Testing HTTP connection to Arduino...');
      
      // iOS-specific fetch configuration
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'AEROSPIN-iOS/1.0.0',
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[iOS] HTTP connection successful');
        
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoReachable: true,
            isConnectedToArduinoWifi: true,
          }));
        }
        
        return true;
      }
      
      console.log('[iOS] HTTP connection failed with status:', response.status);
      return false;
    } catch (error) {
      console.log('[iOS] HTTP connection test failed:', error);
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
          isConnectedToArduinoWifi: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout]);

  // iOS-optimized application handshake
  const testIOSHandshake = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[iOS] Testing Arduino application response...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AEROSPIN-iOS/1.0.0',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('[iOS] Arduino response received:', responseText.substring(0, 100));
        
        // Validate response for iOS
        const isValidResponse = 
          responseText.length > 0 && (
            responseText.includes('status') || 
            responseText.includes('aerospin') ||
            responseText.includes('device') ||
            responseText.includes('direction') ||
            responseText.includes('brake') ||
            responseText.includes('speed')
          );
        
        if (isValidResponse && isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoResponding: true,
            lastSuccessfulConnection: new Date(),
            networkInfo: {
              ...prev.networkInfo,
              ssid: finalConfig.expectedSSID,
              ipAddress: '192.168.4.2',
            },
          }));
          
          return true;
        }
      }
      
      console.log('[iOS] Arduino handshake failed');
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
        }));
      }
      return false;
    } catch (error) {
      console.log('[iOS] Application handshake failed:', error);
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout, finalConfig.expectedSSID]);

  // iOS-optimized detection process
  const performIOSDetection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!isComponentMounted.current) return false;

    setState(prev => ({
      ...prev,
      detectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    console.log(`[iOS] Detection attempt ${retryCount + 1}/${finalConfig.retryAttempts + 1}`);

    try {
      // Step 1: Test HTTP connection
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
        }));
        return false;
      }

      // Step 2: Test application response
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
        }));
        return false;
      }

      // Success!
      setState(prev => ({
        ...prev,
        detectionStatus: 'connected',
        connectionQuality: 'excellent',
        isConnectedToArduinoWifi: true,
      }));
      
      console.log('[iOS] Detection successful!');
      return true;
    } catch (error) {
      console.log('[iOS] Full detection failed:', error);
      setState(prev => ({
        ...prev,
        detectionStatus: 'error',
        connectionQuality: 'none',
        isConnectedToArduinoWifi: false,
      }));
      return false;
    }
  }, [testIOSConnection, testIOSHandshake, finalConfig.retryAttempts, finalConfig.retryDelay]);

  // iOS-optimized monitoring
  const startIOSMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Initial detection
    setTimeout(() => {
      if (isComponentMounted.current) {
        performIOSDetection();
      }
    }, 2000);

    // Check every 15 seconds for iOS
    detectionIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        performIOSDetection();
      }
    }, 15000);
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

  // Manual refresh function
  const refreshConnection = useCallback(async () => {
    console.log('[iOS] Manual connection refresh...');
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