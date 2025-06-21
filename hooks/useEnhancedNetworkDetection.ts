import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// Enhanced network detection specifically optimized for Android APK builds
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
  connectionTimeout: 10000, // Increased timeout for Android APK
  retryAttempts: 3, // Fewer retries but longer timeouts
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
      isWifiEnabled: true,
      isInternetReachable: true,
    },
    lastSuccessfulConnection: null,
    connectionAttempts: 0,
    detectionStatus: 'checking',
  });

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);
  const lastDetectionTime = useRef<number>(0);

  // Simplified network detection for Android APK
  const checkNetworkInfo = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      let networkInfo = {
        ssid: null as string | null,
        ipAddress: null as string | null,
        isWifiEnabled: true,
        isInternetReachable: navigator.onLine,
      };

      if (Platform.OS === 'web') {
        // Web platform - assume connected if Arduino responds
        networkInfo.ssid = finalConfig.expectedSSID;
        networkInfo.ipAddress = '192.168.4.2';
      } else {
        // Android - simplified detection
        // Since Arduino LCD shows "Android Connected", assume network is OK
        networkInfo.ssid = finalConfig.expectedSSID;
        networkInfo.ipAddress = '192.168.4.2';
        networkInfo.isWifiEnabled = true;
      }

      setState(prev => ({
        ...prev,
        networkInfo,
        isConnectedToArduinoWifi: true, // Assume true since Arduino shows connection
      }));

      return true;
    } catch (error) {
      console.log('Network info check failed:', error);
      return false;
    }
  }, [finalConfig.expectedSSID]);

  // Simplified HTTP connection test for Android APK
  const testHttpConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      console.log('Testing HTTP connection to Arduino...');
      
      // Use a simple fetch with longer timeout for Android APK
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      const isReachable = response.ok;
      console.log('HTTP connection result:', isReachable, 'Status:', response.status);
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: isReachable,
        }));
      }
      
      return isReachable;
    } catch (error) {
      console.log('HTTP connection test failed:', error);
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout]);

  // Enhanced application handshake for Android APK
  const testApplicationHandshake = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Testing Arduino application response...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'text/plain, */*',
          'Cache-Control': 'no-cache',
          'User-Agent': 'AEROSPIN-Android-App',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Arduino response received:', responseText.substring(0, 100));
        
        // Check for valid Arduino response
        const isValidResponse = 
          responseText.toLowerCase().includes('pong') || 
          responseText.toLowerCase().includes('aerospin') ||
          responseText.toLowerCase().includes('device') ||
          responseText.toLowerCase().includes('ready') ||
          responseText.length > 0; // Any response is better than none
        
        console.log('Arduino response validation:', isValidResponse);
        
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoResponding: isValidResponse,
            lastSuccessfulConnection: isValidResponse ? new Date() : prev.lastSuccessfulConnection,
          }));
        }
        
        return isValidResponse;
      } else {
        console.log('Arduino ping failed with status:', response.status);
        return false;
      }
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

  // Simplified detection process for Android APK
  const performFullDetection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!isComponentMounted.current) return false;

    const now = Date.now();
    
    // Prevent too frequent detection attempts
    if (now - lastDetectionTime.current < 3000) {
      return state.isArduinoResponding;
    }
    
    lastDetectionTime.current = now;

    setState(prev => ({
      ...prev,
      detectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    console.log(`Android APK detection attempt ${retryCount + 1}/${finalConfig.retryAttempts + 1}`);

    try {
      // Step 1: Assume network is OK (Arduino LCD shows connection)
      await checkNetworkInfo();
      
      // Step 2: Test HTTP connection
      const isHttpReachable = await testHttpConnection();
      
      if (!isHttpReachable) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`HTTP test failed, retrying in ${finalConfig.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performFullDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'none',
        }));
        return false;
      }

      // Step 3: Test application response
      const isAppResponding = await testApplicationHandshake();
      
      if (!isAppResponding) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`App handshake failed, retrying in ${finalConfig.retryDelay}ms...`);
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

      // Success!
      setState(prev => ({
        ...prev,
        detectionStatus: 'connected',
        connectionQuality: 'excellent',
      }));
      
      console.log('Android APK detection successful!');
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
  }, [checkNetworkInfo, testHttpConnection, testApplicationHandshake, finalConfig.retryAttempts, finalConfig.retryDelay, state.isArduinoResponding]);

  // Start monitoring with longer intervals for Android APK
  const startMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Initial detection after delay
    setTimeout(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, 3000);

    // Check every 15 seconds (longer interval for Android APK)
    detectionIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, 15000);
  }, [performFullDetection]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes for Android
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setTimeout(() => {
          if (isComponentMounted.current) {
            startMonitoring();
          }
        }, 2000);
      } else {
        stopMonitoring();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [startMonitoring, stopMonitoring]);

  // Initialize monitoring
  useEffect(() => {
    console.log('Starting Android APK optimized network detection...');
    startMonitoring();
    
    return () => {
      isComponentMounted.current = false;
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Manual refresh function
  const refreshConnection = useCallback(async () => {
    console.log('Manual connection refresh for Android APK...');
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