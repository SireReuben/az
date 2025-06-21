import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface AndroidArduinoConnection {
  isConnected: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  lastResponse: string | null;
  responseTime: number;
  sendCommand: (endpoint: string, timeout?: number) => Promise<{ ok: boolean; data: any; status: number }>;
  testConnection: () => Promise<boolean>;
  connectionAttempts: number;
}

const ARDUINO_IP = '192.168.4.1';
const DEFAULT_TIMEOUT = 35000; // Increased to 35 seconds for Android 15 APK
const RETRY_DELAY = 6000; // 6 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // Android 15 APK-optimized command sending with enhanced security compliance
  const sendCommand = useCallback(async (endpoint: string, timeout: number = DEFAULT_TIMEOUT): Promise<{ ok: boolean; data: any; status: number }> => {
    const startTime = Date.now();
    
    try {
      console.log(`[Android 15 APK] Sending command: ${endpoint} with ${timeout}ms timeout`);
      
      // Strategy 1: Enhanced fetch with Android 15 security headers
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`[Android 15 APK] Aborting request after ${timeout}ms`);
          controller.abort();
        }, timeout);

        // Android 15 APK-specific headers for maximum compatibility
        const headers: Record<string, string> = {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'close',
          'User-Agent': 'AEROSPIN-Android15-APK/1.0.0',
          'X-Android-APK': 'true',
          'X-Requested-With': 'com.aerospin.control',
        };

        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          headers,
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
          // Android 15 specific fetch options
          keepalive: false,
        });

        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[Android 15 APK] Strategy 1 response: ${response.status} in ${responseTimeMs}ms`);
        
        let responseData: any = null;
        let responseText = '';
        
        if (response.ok) {
          responseText = await response.text();
          
          // Try to parse as JSON first (enhanced Arduino returns JSON)
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            // Fallback to plain text for legacy endpoints
            responseData = { message: responseText, raw: responseText };
          }
        }
        
        if (isComponentMounted.current) {
          setResponseTime(responseTimeMs);
          setConnectionStatus(response.ok ? 'connected' : 'failed');
          setIsConnected(response.ok);
          
          if (response.ok && responseText) {
            setLastResponse(responseText);
          }
        }

        return {
          ok: response.ok,
          data: responseData,
          status: response.status
        };
      } catch (fetchError) {
        console.log('[Android 15 APK] Strategy 1 (fetch) failed:', fetchError);
        
        // Strategy 2: XMLHttpRequest with Android 15 optimizations
        if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
          console.log('[Android 15 APK] Trying Strategy 2 (XMLHttpRequest)...');
          
          return new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;
            xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
            
            // Set Android 15 APK-specific headers
            xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('User-Agent', 'AEROSPIN-Android15-APK/1.0.0');
            xhr.setRequestHeader('X-Android-APK', 'true');
            xhr.setRequestHeader('X-Requested-With', 'com.aerospin.control');
            
            xhr.onload = () => {
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              console.log(`[Android 15 APK] Strategy 2 response: ${xhr.status} in ${responseTimeMs}ms`);
              
              let responseData: any = null;
              
              if (xhr.status === 200) {
                try {
                  responseData = JSON.parse(xhr.responseText);
                } catch (e) {
                  responseData = { message: xhr.responseText, raw: xhr.responseText };
                }
              }
              
              if (isComponentMounted.current) {
                setResponseTime(responseTimeMs);
                setConnectionStatus(xhr.status === 200 ? 'connected' : 'failed');
                setIsConnected(xhr.status === 200);
                
                if (xhr.status === 200 && xhr.responseText) {
                  setLastResponse(xhr.responseText);
                }
              }
              
              resolve({
                ok: xhr.status === 200,
                data: responseData,
                status: xhr.status
              });
            };
            
            xhr.onerror = () => {
              console.log('[Android 15 APK] Strategy 2 (XMLHttpRequest) failed');
              reject(new Error('XMLHttpRequest failed'));
            };
            
            xhr.ontimeout = () => {
              console.log('[Android 15 APK] Strategy 2 timeout');
              reject(new Error('XMLHttpRequest timeout'));
            };
            
            xhr.send();
          });
        }
        
        throw fetchError;
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[Android 15 APK] All strategies failed after ${responseTimeMs}ms:`, error);
      
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

  // Enhanced connection test with Android 15 APK-specific optimizations
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[Android 15 APK] Starting enhanced connection test...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // Android 15 APK-optimized connection strategies with longer timeouts
    const strategies = [
      { endpoint: '/ping', timeout: 30000, name: 'Enhanced Ping (JSON)' },
      { endpoint: '/status', timeout: 35000, name: 'Status Check (JSON)' },
      { endpoint: '/health', timeout: 40000, name: 'Health Check (JSON)' },
      { endpoint: '/info', timeout: 45000, name: 'Device Info (JSON)' },
      { endpoint: '/', timeout: 50000, name: 'Root Endpoint (JSON)' },
    ];
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      
      try {
        console.log(`[Android 15 APK] Attempt ${i + 1}/${strategies.length}: ${strategy.name} (${strategy.endpoint})`);
        
        const result = await sendCommand(strategy.endpoint, strategy.timeout);
        
        if (result.ok) {
          console.log(`[Android 15 APK] SUCCESS with ${strategy.name}!`);
          console.log('Response data:', result.data);
          return true;
        } else {
          console.log(`[Android 15 APK] ${strategy.name} failed with status: ${result.status}`);
        }
      } catch (error) {
        console.log(`[Android 15 APK] ${strategy.name} failed:`, error);
      }
      
      // Wait between attempts (except for the last one)
      if (i < strategies.length - 1) {
        console.log(`[Android 15 APK] Waiting ${RETRY_DELAY}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    console.log('[Android 15 APK] All connection attempts failed');
    return false;
  }, [sendCommand]);

  // Android 15 APK-specific monitoring with longer intervals
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Initial test with longer delay for Android 15 APK
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      if (isComponentMounted.current) {
        await testConnection();
        
        // Set up periodic monitoring with longer intervals for Android 15 APK
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            console.log('[Android 15 APK] Periodic connection check...');
            await testConnection();
          }
        }, 60000); // Check every 60 seconds if not connected
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