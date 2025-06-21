import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface AndroidArduinoConnection {
  isConnected: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  lastResponse: string | null;
  responseTime: number;
  sendCommand: (endpoint: string, timeout?: number) => Promise<Response>;
  testConnection: () => Promise<boolean>;
}

const ARDUINO_IP = '192.168.4.1';
const DEFAULT_TIMEOUT = 15000; // 15 seconds for Android APK

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  
  const isComponentMounted = useRef(true);

  // Enhanced command sending specifically for Android APK
  const sendCommand = useCallback(async (endpoint: string, timeout: number = DEFAULT_TIMEOUT): Promise<Response> => {
    const startTime = Date.now();
    
    try {
      console.log(`[Android APK] Sending command: ${endpoint}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Android APK] Command timeout after ${timeout}ms`);
        controller.abort();
      }, timeout);

      // Enhanced headers for Android APK compatibility
      const headers: Record<string, string> = {
        'Accept': 'text/plain, application/json, */*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      // Add Android-specific headers
      if (Platform.OS === 'android') {
        headers['User-Agent'] = 'AEROSPIN-Android-APK/1.0';
        headers['X-Requested-With'] = 'com.aerospin.control';
        headers['Connection'] = 'close'; // Force connection close for Android
      }

      const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[Android APK] Response received in ${responseTimeMs}ms, status: ${response.status}`);
      
      if (isComponentMounted.current) {
        setResponseTime(responseTimeMs);
        setConnectionStatus(response.ok ? 'connected' : 'failed');
        setIsConnected(response.ok);
      }

      if (response.ok) {
        const responseText = await response.text();
        if (isComponentMounted.current) {
          setLastResponse(responseText);
        }
        console.log(`[Android APK] Response text: ${responseText.substring(0, 100)}...`);
      }

      return response;
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[Android APK] Command failed after ${responseTimeMs}ms:`, error);
      
      if (isComponentMounted.current) {
        setResponseTime(responseTimeMs);
        setIsConnected(false);
        
        if (error instanceof Error && error.name === 'AbortError') {
          setConnectionStatus('timeout');
        } else {
          setConnectionStatus('failed');
        }
      }
      
      throw error;
    }
  }, []);

  // Test connection with multiple attempts
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[Android APK] Testing connection to Arduino...');
    
    setConnectionStatus('checking');
    
    const maxAttempts = 3;
    const attemptDelay = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Android APK] Connection attempt ${attempt}/${maxAttempts}`);
        
        const response = await sendCommand('/ping', 10000);
        
        if (response.ok) {
          console.log(`[Android APK] Connection successful on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        console.log(`[Android APK] Attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          console.log(`[Android APK] Waiting ${attemptDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, attemptDelay));
        }
      }
    }
    
    console.log('[Android APK] All connection attempts failed');
    return false;
  }, [sendCommand]);

  // Initial connection test
  useEffect(() => {
    const initialTest = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      if (isComponentMounted.current) {
        await testConnection();
      }
    };

    initialTest();

    return () => {
      isComponentMounted.current = false;
    };
  }, [testConnection]);

  return {
    isConnected,
    connectionStatus,
    lastResponse,
    responseTime,
    sendCommand,
    testConnection,
  };
}