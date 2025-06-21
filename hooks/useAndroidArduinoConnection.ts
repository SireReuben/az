import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface AndroidArduinoConnection {
  isConnected: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  lastResponse: string | null;
  responseTime: number;
  sendCommand: (endpoint: string, timeout?: number) => Promise<Response>;
  testConnection: () => Promise<boolean>;
  connectionAttempts: number;
}

const ARDUINO_IP = '192.168.4.1';
const DEFAULT_TIMEOUT = 20000; // Increased to 20 seconds for Android APK
const RETRY_DELAY = 3000; // 3 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // Enhanced command sending with Android APK specific optimizations
  const sendCommand = useCallback(async (endpoint: string, timeout: number = DEFAULT_TIMEOUT): Promise<Response> => {
    const startTime = Date.now();
    
    try {
      console.log(`[Android APK] Sending command: ${endpoint} with ${timeout}ms timeout`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Android APK] Command timeout after ${timeout}ms`);
        controller.abort();
      }, timeout);

      // Android APK specific headers to ensure compatibility
      const headers: Record<string, string> = {
        'Accept': 'text/plain, */*',
        'Accept-Encoding': 'identity', // Disable compression for Arduino
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Connection': 'close', // Force connection close for Android
      };

      // Add Android-specific headers for better compatibility
      if (Platform.OS === 'android') {
        headers['User-Agent'] = 'AEROSPIN-Android-APK/1.0.0';
        headers['X-Requested-With'] = 'com.aerospin.control';
        headers['X-Android-APK'] = 'true';
      }

      // Use XMLHttpRequest for Android APK if available (better compatibility)
      let response: Response;
      
      if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
        // Use XMLHttpRequest for Android APK
        response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.timeout = timeout;
          xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
          
          // Set headers
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
          
          xhr.onload = () => {
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers(),
            });
            resolve(response);
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.ontimeout = () => reject(new Error('Request timeout'));
          
          xhr.send();
        });
      } else {
        // Use fetch for other platforms
        response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          headers,
          // Additional fetch options for Android
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
        });
      }

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
        console.log(`[Android APK] Response text: ${responseText.substring(0, 200)}...`);
      } else {
        console.log(`[Android APK] HTTP error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[Android APK] Command failed after ${responseTimeMs}ms:`, error);
      
      if (isComponentMounted.current) {
        setResponseTime(responseTimeMs);
        setIsConnected(false);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.message.includes('timeout')) {
            setConnectionStatus('timeout');
          } else {
            setConnectionStatus('failed');
          }
        } else {
          setConnectionStatus('failed');
        }
      }
      
      throw error;
    }
  }, []);

  // Enhanced connection test with multiple strategies
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[Android APK] Starting comprehensive connection test...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    const strategies = [
      { endpoint: '/ping', timeout: 15000, name: 'Standard Ping' },
      { endpoint: '/health', timeout: 20000, name: 'Health Check' },
      { endpoint: '/status', timeout: 25000, name: 'Status Check' },
      { endpoint: '/', timeout: 30000, name: 'Root Page' },
    ];
    
    for (const strategy of strategies) {
      try {
        console.log(`[Android APK] Trying ${strategy.name} (${strategy.endpoint})...`);
        
        const response = await sendCommand(strategy.endpoint, strategy.timeout);
        
        if (response.ok) {
          console.log(`[Android APK] Success with ${strategy.name}!`);
          return true;
        } else {
          console.log(`[Android APK] ${strategy.name} failed with status: ${response.status}`);
        }
      } catch (error) {
        console.log(`[Android APK] ${strategy.name} failed:`, error);
        
        // Wait between attempts
        if (strategy !== strategies[strategies.length - 1]) {
          console.log(`[Android APK] Waiting ${RETRY_DELAY}ms before next strategy...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
    
    console.log('[Android APK] All connection strategies failed');
    return false;
  }, [sendCommand]);

  // Periodic connection monitoring
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Initial test after delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (isComponentMounted.current) {
        await testConnection();
        
        // Set up periodic monitoring
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            console.log('[Android APK] Periodic connection check...');
            await testConnection();
          }
        }, 30000); // Check every 30 seconds if not connected
      }
    };

    startMonitoring();

    return () => {
      isComponentMounted.current = false;
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [testConnection, isConnected]);

  return {
    isConnected,
    connectionStatus,
    lastResponse,
    responseTime,
    sendCommand,
    testConnection,
    connectionAttempts,
  };
}