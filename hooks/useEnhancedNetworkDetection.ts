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
  connectionTimeout: 8000, // Increased timeout for Android
  retryAttempts: 5, // More retries for Android
  retryDelay: 1500,
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
  const consecutiveFailures = useRef<number>(0);

  // Enhanced network info detection with better Android support
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
        // Web platform detection
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
            method: 'HEAD',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            networkInfo.ssid = finalConfig.expectedSSID;
            networkInfo.ipAddress = '192.168.4.2';
          }
        } catch (error) {
          // Not connected to Arduino network
        }
      } else {
        // Enhanced Android detection
        try {
          // Try to import NetInfo dynamically to avoid bundling issues
          const NetInfo = await import('@react-native-community/netinfo');
          const netInfoState = await NetInfo.default.fetch();
          
          networkInfo.isWifiEnabled = netInfoState.type === 'wifi';
          networkInfo.isInternetReachable = netInfoState.isInternetReachable ?? false;
          
          if (netInfoState.type === 'wifi' && netInfoState.details) {
            networkInfo.ssid = netInfoState.details.ssid || null;
            networkInfo.ipAddress = netInfoState.details.ipAddress || null;
          }
          
          console.log('NetInfo state:', {
            type: netInfoState.type,
            ssid: networkInfo.ssid,
            ip: networkInfo.ipAddress,
            isWifiEnabled: networkInfo.isWifiEnabled
          });
        } catch (error) {
          console.log('NetInfo not available, using fallback detection');
          // Fallback: assume WiFi is enabled if we can reach Arduino
          try {
            const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(3000),
            });
            
            if (response.ok) {
              networkInfo.ssid = finalConfig.expectedSSID;
              networkInfo.ipAddress = '192.168.4.2';
              networkInfo.isWifiEnabled = true;
            }
          } catch (fallbackError) {
            console.log('Fallback detection failed:', fallbackError);
          }
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
        (networkInfo.ssid === finalConfig.expectedSSID || 
         networkInfo.ssid?.includes('AEROSPIN') ||
         Platform.OS === 'web') &&
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

  // Enhanced HTTP-based connection test (more reliable than TCP for Android)
  const testHttpConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      // Multiple endpoints to test for better reliability
      const testEndpoints = ['/ping', '/status', '/health'];
      
      for (const endpoint of testEndpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
          
          const response = await fetch(`http://${finalConfig.arduinoIP}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`Arduino reachable via ${endpoint}`);
            
            if (isComponentMounted.current) {
              setState(prev => ({
                ...prev,
                isArduinoReachable: true,
              }));
            }
            
            return true;
          }
        } catch (endpointError) {
          console.log(`Failed to reach ${endpoint}:`, endpointError);
          continue; // Try next endpoint
        }
      }
      
      // All endpoints failed
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
        }));
      }
      
      return false;
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

  // Enhanced application handshake with multiple validation methods
  const testApplicationHandshake = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.connectionTimeout);
      
      const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
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
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Arduino ping response:', responseText);
        
        // Multiple validation criteria for Arduino response
        const isValidResponse = 
          responseText.toLowerCase().includes('pong') || 
          responseText.toLowerCase().includes('ok') ||
          responseText.toLowerCase().includes('aerospin') ||
          responseText.toLowerCase().includes('device') ||
          responseText.toLowerCase().includes('ready') ||
          response.status === 200;
        
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isArduinoResponding: isValidResponse,
            lastSuccessfulConnection: isValidResponse ? new Date() : prev.lastSuccessfulConnection,
          }));
        }
        
        if (isValidResponse) {
          consecutiveFailures.current = 0;
          console.log('Arduino application handshake successful');
        } else {
          consecutiveFailures.current++;
          console.log('Arduino responded but with unexpected content:', responseText);
        }
        
        return isValidResponse;
      } else {
        console.log('Arduino ping failed with status:', response.status);
        consecutiveFailures.current++;
        return false;
      }
    } catch (error) {
      console.log('Application handshake failed:', error);
      consecutiveFailures.current++;
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP, finalConfig.connectionTimeout]);

  // Comprehensive detection with adaptive retry logic
  const performFullDetection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!isComponentMounted.current) return false;

    const now = Date.now();
    
    // Prevent too frequent detection attempts
    if (now - lastDetectionTime.current < 2000) {
      return state.isArduinoResponding;
    }
    
    lastDetectionTime.current = now;

    setState(prev => ({
      ...prev,
      detectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    console.log(`Starting detection attempt ${retryCount + 1}/${finalConfig.retryAttempts + 1}`);

    try {
      // Step 1: Check network info
      const isOnArduinoNetwork = await checkNetworkInfo();
      console.log('Network check result:', isOnArduinoNetwork);
      
      if (!isOnArduinoNetwork && Platform.OS !== 'web') {
        console.log('Not on Arduino network, but continuing with detection...');
        // Don't fail immediately - Android might still be able to reach Arduino
      }

      // Step 2: Test HTTP connection (more reliable than TCP on Android)
      const isHttpReachable = await testHttpConnection();
      console.log('HTTP reachability result:', isHttpReachable);
      
      if (!isHttpReachable) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`HTTP connection failed, retrying in ${finalConfig.retryDelay}ms...`);
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

      // Step 3: Test application handshake
      const isAppResponding = await testApplicationHandshake();
      console.log('Application handshake result:', isAppResponding);
      
      if (!isAppResponding) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`Application handshake failed, retrying in ${finalConfig.retryDelay}ms...`);
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

      // All checks successful
      const quality = consecutiveFailures.current === 0 ? 'excellent' : 
                     consecutiveFailures.current < 3 ? 'good' : 'poor';
      
      setState(prev => ({
        ...prev,
        detectionStatus: 'connected',
        connectionQuality: quality,
      }));
      
      console.log('Full detection successful with quality:', quality);
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

  // Adaptive monitoring with different intervals based on connection state
  const startMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Initial detection after a short delay
    setTimeout(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, 2000);

    // Adaptive interval based on connection state and failure count
    const getInterval = () => {
      if (state.isArduinoResponding) {
        return 20000; // Check every 20 seconds when connected
      } else if (consecutiveFailures.current > 10) {
        return 30000; // Slow down after many failures
      } else {
        return 10000; // Check every 10 seconds when disconnected
      }
    };

    detectionIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, getInterval());
  }, [performFullDetection, state.isArduinoResponding]);

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
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App became active, restart monitoring after a delay
        setTimeout(() => {
          if (isComponentMounted.current) {
            console.log('App became active, restarting monitoring...');
            startMonitoring();
          }
        }, 2000);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background, stop monitoring to save battery
        console.log('App went to background, stopping monitoring...');
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
    console.log('Initializing enhanced network detection...');
    startMonitoring();
    
    return () => {
      isComponentMounted.current = false;
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Manual refresh function
  const refreshConnection = useCallback(async () => {
    console.log('Manual connection refresh requested...');
    consecutiveFailures.current = 0; // Reset failure count
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