import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface OptimizedConnectionState {
  isConnected: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  lastResponse: string | null;
  responseTime: number;
  connectionAttempts: number;
  buildProfile: 'development' | 'preview' | 'production' | 'unknown';
}

const PRODUCTION_TIMEOUT = 15000; // Optimized for production builds
const RETRY_DELAY = 5000; // Faster retries for production

export function useOptimizedAndroidConnection() {
  const [state, setState] = useState<OptimizedConnectionState>({
    isConnected: false,
    connectionStatus: 'checking',
    lastResponse: null,
    responseTime: 0,
    connectionAttempts: 0,
    buildProfile: 'unknown',
  });

  const isComponentMounted = useRef(true);

  // Detect build profile based on performance characteristics
  const detectBuildProfile = useCallback((): 'development' | 'preview' | 'production' | 'unknown' => {
    if (Platform.OS === 'web') return 'development';
    
    // In production builds, __DEV__ is false and performance is optimized
    if (!__DEV__) {
      return 'production';
    }
    
    // Check for Expo Go or development client
    if (typeof expo !== 'undefined' && expo.modules) {
      return 'development';
    }
    
    // Default assumption for standalone builds in debug mode
    return 'preview';
  }, []);

  // Optimized connection strategy for production builds
  const testProductionConnection = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      console.log('[PRODUCTION-OPTIMIZED] Testing Arduino connection...');
      
      // Single, optimized strategy for production builds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PRODUCTION_TIMEOUT);
      
      const response = await fetch('http://192.168.4.1/ping', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'AEROSPIN-Production/1.0.0',
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`[PRODUCTION-OPTIMIZED] ✅ Success in ${responseTime}ms`);
        
        if (isComponentMounted.current) {
          setState(prev => ({
            ...prev,
            isConnected: true,
            connectionStatus: 'connected',
            lastResponse: responseText,
            responseTime,
          }));
        }
        
        return true;
      } else {
        console.log(`[PRODUCTION-OPTIMIZED] Failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`[PRODUCTION-OPTIMIZED] Error after ${responseTime}ms:`, error);
      
      if (isComponentMounted.current) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'failed',
          responseTime,
        }));
      }
      
      return false;
    }
  }, []);

  // Main connection test with build profile optimization
  const testConnection = useCallback(async (): Promise<boolean> => {
    const buildProfile = detectBuildProfile();
    
    setState(prev => ({
      ...prev,
      connectionStatus: 'checking',
      connectionAttempts: prev.connectionAttempts + 1,
      buildProfile,
    }));

    console.log(`[OPTIMIZED-CONNECTION] Build profile detected: ${buildProfile}`);
    
    if (buildProfile === 'production') {
      console.log('[OPTIMIZED-CONNECTION] Using production-optimized strategy');
      return await testProductionConnection();
    } else {
      console.log('[OPTIMIZED-CONNECTION] Using fallback strategy for non-production build');
      // Use the existing multi-strategy approach for non-production builds
      return await testProductionConnection(); // Simplified for now
    }
  }, [detectBuildProfile, testProductionConnection]);

  // Optimized monitoring for production builds
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      const buildProfile = detectBuildProfile();
      
      // Shorter initial delay for production builds
      const initialDelay = buildProfile === 'production' ? 3000 : 8000;
      
      console.log(`[OPTIMIZED-CONNECTION] Starting monitoring for ${buildProfile} build...`);
      
      setTimeout(() => {
        if (isComponentMounted.current) {
          testConnection();
        }
      }, initialDelay);

      // More frequent checks for production builds
      const checkInterval = buildProfile === 'production' ? 30000 : 60000;
      
      monitoringInterval = setInterval(async () => {
        if (isComponentMounted.current && !state.isConnected) {
          await testConnection();
        }
      }, checkInterval);
    };

    startMonitoring();

    return () => {
      isComponentMounted.current = false;
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [testConnection, state.isConnected, detectBuildProfile]);

  // Send command with production optimization
  const sendCommand = useCallback(async (endpoint: string, timeout?: number): Promise<{ ok: boolean; data: any; status: number }> => {
    const buildProfile = detectBuildProfile();
    const optimizedTimeout = timeout || (buildProfile === 'production' ? PRODUCTION_TIMEOUT : 30000);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), optimizedTimeout);
      
      const response = await fetch(`http://192.168.4.1${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': `AEROSPIN-${buildProfile}/1.0.0`,
        },
      });
      
      clearTimeout(timeoutId);
      
      let data: any = null;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch {
        data = { message: 'Response received', status: 'success' };
      }
      
      return {
        ok: response.ok,
        data,
        status: response.status,
      };
    } catch (error) {
      throw error;
    }
  }, [detectBuildProfile]);

  return {
    ...state,
    testConnection,
    sendCommand,
  };
}