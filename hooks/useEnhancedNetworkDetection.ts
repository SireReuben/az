import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// APK-optimized network detection
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
  connectionTimeout: 25000, // Increased timeout for APK builds
  retryAttempts: 5, // More retries for APK
  retryDelay: 3000,
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

  // APK-optimized network detection
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
        // Web platform
        networkInfo.ssid = finalConfig.expectedSSID;
        networkInfo.ipAddress = '192.168.4.2';
      } else {
        // APK - Enhanced detection
        console.log('[APK] Checking network info...');
        
        // For APK builds, assume Arduino WiFi connection if we can reach the device
        // This is because APK builds have different network detection capabilities
        networkInfo.ssid = finalConfig.expectedSSID;
        networkInfo.ipAddress = '192.168.4.2';
        networkInfo.isWifiEnabled = true;
      }

      setState(prev => ({
        ...prev,
        networkInfo,
      }));

      return true;
    } catch (error) {
      console.log('[APK] Network info check failed:', error);
      return false;
    }
  }, [finalConfig.expectedSSID]);

  // APK-optimized HTTP connection test
  const testHttpConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!isComponentMounted.current) return false;

      console.log('[APK] Testing HTTP connection to Arduino...');
      
      // Use multiple connection strategies for APK
      const strategies = [
        { timeout: 20000, method: 'GET' },
        { timeout: 30000, method: 'GET' },
        { timeout: 40000, method: 'GET' },
      ];
      
      for (const strategy of strategies) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), strategy.timeout);
          
          const response = await fetch(`http://${finalConfig.arduinoIP}/ping`, {
            method: strategy.method,
            signal: controller.signal,
            headers: {
              'Accept': '*/*',
              'Cache-Control': 'no-cache',
              'User-Agent': 'AEROSPIN-APK/1.0.0',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('[APK] HTTP connection successful with strategy:', strategy);
            
            if (isComponentMounted.current) {
              setState(prev => ({
                ...prev,
                isArduinoReachable: true,
              }));
            }
            
            return true;
          }
        } catch (strategyError) {
          console.log('[APK] Strategy failed:', strategy, strategyError);
        }
      }
      
      console.log('[APK] All HTTP strategies failed');
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
        }));
      }
      return false;
    } catch (error) {
      console.log('[APK] HTTP connection test failed:', error);
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoReachable: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP]);

  // APK-optimized application handshake
  const testApplicationHandshake = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[APK] Testing Arduino application response...');
      
      // Multiple handshake attempts with increasing timeouts
      const attempts = [
        { endpoint: '/ping', timeout: 25000 },
        { endpoint: '/status', timeout: 30000 },
        { endpoint: '/health', timeout: 35000 },
      ];
      
      for (const attempt of attempts) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), attempt.timeout);
          
          const response = await fetch(`http://${finalConfig.arduinoIP}${attempt.endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'text/plain, */*',
              'Cache-Control': 'no-cache',
              'User-Agent': 'AEROSPIN-APK/1.0.0',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const responseText = await response.text();
            console.log('[APK] Arduino response received:', responseText.substring(0, 100));
            
            // More lenient response validation for APK
            const isValidResponse = 
              responseText.length > 0 && (
                responseText.toLowerCase().includes('pong') || 
                responseText.toLowerCase().includes('aerospin') ||
                responseText.toLowerCase().includes('device') ||
                responseText.toLowerCase().includes('ready') ||
                responseText.toLowerCase().includes('direction') ||
                responseText.toLowerCase().includes('brake') ||
                responseText.toLowerCase().includes('speed') ||
                responseText.includes('200') // HTTP 200 response
              );
            
            console.log('[APK] Arduino response validation:', isValidResponse);
            
            if (isValidResponse && isComponentMounted.current) {
              setState(prev => ({
                ...prev,
                isArduinoResponding: true,
                lastSuccessfulConnection: new Date(),
              }));
              
              return true;
            }
          }
        } catch (attemptError) {
          console.log('[APK] Handshake attempt failed:', attempt, attemptError);
        }
      }
      
      console.log('[APK] All handshake attempts failed');
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
        }));
      }
      return false;
    } catch (error) {
      console.log('[APK] Application handshake failed:', error);
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isArduinoResponding: false,
        }));
      }
      return false;
    }
  }, [finalConfig.arduinoIP]);

  // APK-optimized detection process
  const performFullDetection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!isComponentMounted.current) return false;

    const now = Date.now();
    
    // Prevent too frequent detection attempts
    if (now - lastDetectionTime.current < 5000) {
      return state.isArduinoResponding;
    }
    
    lastDetectionTime.current = now;

    setState(prev => ({
      ...prev,
      detectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    console.log(`[APK] Detection attempt ${retryCount + 1}/${finalConfig.retryAttempts + 1}`);

    try {
      // Step 1: Check network info (assume OK for APK)
      await checkNetworkInfo();
      
      // Step 2: Test HTTP connection with retries
      const isHttpReachable = await testHttpConnection();
      
      if (!isHttpReachable) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`[APK] HTTP test failed, retrying in ${finalConfig.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performFullDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'none',
          isConnectedToArduinoWifi: false,
        }));
        return false;
      }

      // Step 3: Test application response with retries
      const isAppResponding = await testApplicationHandshake();
      
      if (!isAppResponding) {
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`[APK] App handshake failed, retrying in ${finalConfig.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          return performFullDetection(retryCount + 1);
        }
        
        setState(prev => ({
          ...prev,
          detectionStatus: 'disconnected',
          connectionQuality: 'poor',
          isConnectedToArduinoWifi: false,
        }));
        return false;
      }

      // Success! Fix: Explicitly set isConnectedToArduinoWifi to true after successful connection
      setState(prev => ({
        ...prev,
        detectionStatus: 'connected',
        connectionQuality: 'excellent',
        isConnectedToArduinoWifi: true, // Fix: Explicitly set to true after successful detection
      }));
      
      console.log('[APK] Detection successful!');
      return true;
    } catch (error) {
      console.log('[APK] Full detection failed:', error);
      setState(prev => ({
        ...prev,
        detectionStatus: 'error',
        connectionQuality: 'none',
        isConnectedToArduinoWifi: false,
      }));
      return false;
    }
  }, [checkNetworkInfo, testHttpConnection, testApplicationHandshake, finalConfig.retryAttempts, finalConfig.retryDelay, state.isArduinoResponding]);

  // APK-optimized monitoring
  const startMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Initial detection with longer delay for APK
    setTimeout(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, 5000);

    // Check every 20 seconds for APK builds
    detectionIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        performFullDetection();
      }
    }, 20000);
  }, [performFullDetection]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes for APK
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('[APK] App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        setTimeout(() => {
          if (isComponentMounted.current) {
            console.log('[APK] App became active, starting monitoring...');
            startMonitoring();
          }
        }, 3000);
      } else {
        console.log('[APK] App became inactive, stopping monitoring...');
        stopMonitoring();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [startMonitoring, stopMonitoring]);

  // Initialize monitoring
  useEffect(() => {
    console.log('[APK] Starting APK-optimized network detection...');
    startMonitoring();
    
    return () => {
      isComponentMounted.current = false;
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Manual refresh function
  const refreshConnection = useCallback(async () => {
    console.log('[APK] Manual connection refresh...');
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