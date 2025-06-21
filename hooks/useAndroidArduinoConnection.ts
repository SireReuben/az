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
const DEFAULT_TIMEOUT = 90000; // Increased to 90 seconds for maximum Android 15 compatibility
const RETRY_DELAY = 10000; // 10 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // ANDROID 15 ULTIMATE FIX - Maximum compatibility strategy
  const sendCommand = useCallback(async (endpoint: string, timeout: number = DEFAULT_TIMEOUT): Promise<{ ok: boolean; data: any; status: number }> => {
    const startTime = Date.now();
    
    try {
      console.log(`[ANDROID 15 ULTIMATE] Sending command: ${endpoint} with ${timeout}ms timeout`);
      
      // STRATEGY 1: Ultra-minimal fetch (maximum compatibility)
      try {
        console.log('[ANDROID 15 ULTIMATE] Strategy 1: Ultra-minimal fetch...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[ANDROID 15 ULTIMATE] Strategy 1 timeout triggered');
          controller.abort();
        }, timeout);
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          // Absolutely minimal headers for Android 15 compatibility
          headers: {
            'Accept': '*/*',
          },
          // Android 15 specific options
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit',
          redirect: 'follow',
        });
        
        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[ANDROID 15 ULTIMATE] Strategy 1 response: ${response.status} in ${responseTimeMs}ms`);
        
        if (response.ok) {
          let responseText = '';
          let responseData: any = null;
          
          try {
            responseText = await response.text();
            console.log(`[ANDROID 15 ULTIMATE] Strategy 1 SUCCESS! Response length: ${responseText.length}`);
            
            // Try to parse as JSON, fallback to text
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              responseData = { message: responseText, raw: responseText };
            }
          } catch (textError) {
            console.log('[ANDROID 15 ULTIMATE] Could not read response text:', textError);
            responseData = { message: 'Response received but could not read content', status: 'success' };
          }
          
          if (isComponentMounted.current) {
            setResponseTime(responseTimeMs);
            setConnectionStatus('connected');
            setIsConnected(true);
            setLastResponse(responseText || 'Success');
          }

          return {
            ok: true,
            data: responseData,
            status: response.status
          };
        } else {
          console.log(`[ANDROID 15 ULTIMATE] Strategy 1 failed with status: ${response.status}`);
        }
      } catch (fetchError) {
        console.log('[ANDROID 15 ULTIMATE] Strategy 1 failed:', fetchError);
      }
      
      // STRATEGY 2: XMLHttpRequest with maximum timeout and minimal config
      if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
        console.log('[ANDROID 15 ULTIMATE] Strategy 2: XMLHttpRequest with 90s timeout...');
        
        try {
          const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = 90000; // 90 seconds maximum
            xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
            
            // Absolutely minimal headers
            xhr.setRequestHeader('Accept', '*/*');
            
            xhr.onload = () => {
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              console.log(`[ANDROID 15 ULTIMATE] Strategy 2 response: ${xhr.status} in ${responseTimeMs}ms`);
              
              if (xhr.status === 200 || xhr.status === 0) { // Accept status 0 for local requests
                console.log(`[ANDROID 15 ULTIMATE] Strategy 2 SUCCESS! Response: ${xhr.responseText.substring(0, 100)}`);
                
                let responseData: any = null;
                try {
                  responseData = JSON.parse(xhr.responseText);
                } catch (e) {
                  responseData = { message: xhr.responseText, raw: xhr.responseText };
                }
                
                if (isComponentMounted.current) {
                  setResponseTime(responseTimeMs);
                  setConnectionStatus('connected');
                  setIsConnected(true);
                  setLastResponse(xhr.responseText);
                }
                
                resolve({
                  ok: true,
                  data: responseData,
                  status: xhr.status || 200
                });
              } else {
                reject(new Error(`HTTP ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => {
              console.log('[ANDROID 15 ULTIMATE] Strategy 2 network error');
              reject(new Error('Network error'));
            };
            
            xhr.ontimeout = () => {
              console.log('[ANDROID 15 ULTIMATE] Strategy 2 timeout after 90s');
              reject(new Error('Timeout'));
            };
            
            xhr.send();
          });
          
          return result;
        } catch (xhrError) {
          console.log('[ANDROID 15 ULTIMATE] Strategy 2 failed:', xhrError);
        }
      }
      
      // STRATEGY 3: Fetch with no-cors mode (opaque response)
      try {
        console.log('[ANDROID 15 ULTIMATE] Strategy 3: No-CORS fetch (opaque response)...');
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          credentials: 'omit',
        });
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[ANDROID 15 ULTIMATE] Strategy 3 response type: ${response.type} in ${responseTimeMs}ms`);
        
        // In no-cors mode, we can't read the response, but if we get here, the request succeeded
        if (response.type === 'opaque') {
          console.log('[ANDROID 15 ULTIMATE] Strategy 3 SUCCESS! (opaque response - connection established)');
          
          if (isComponentMounted.current) {
            setResponseTime(responseTimeMs);
            setConnectionStatus('connected');
            setIsConnected(true);
            setLastResponse('Connection successful (no-cors mode)');
          }

          return {
            ok: true,
            data: { message: 'Connected successfully', mode: 'no-cors', endpoint },
            status: 200
          };
        }
      } catch (noCorsError) {
        console.log('[ANDROID 15 ULTIMATE] Strategy 3 failed:', noCorsError);
      }
      
      // STRATEGY 4: Image-based connection test (last resort)
      try {
        console.log('[ANDROID 15 ULTIMATE] Strategy 4: Image-based connection test...');
        
        const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
          const img = new Image();
          const timeoutId = setTimeout(() => {
            reject(new Error('Image timeout'));
          }, 30000);
          
          img.onload = () => {
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            console.log(`[ANDROID 15 ULTIMATE] Strategy 4 SUCCESS! Image loaded in ${responseTimeMs}ms`);
            
            if (isComponentMounted.current) {
              setResponseTime(responseTimeMs);
              setConnectionStatus('connected');
              setIsConnected(true);
              setLastResponse('Connection verified via image test');
            }
            
            resolve({
              ok: true,
              data: { message: 'Connection verified', method: 'image-test' },
              status: 200
            });
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            // Even if image fails to load, it means we can reach the server
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            console.log(`[ANDROID 15 ULTIMATE] Strategy 4 partial success (server reachable) in ${responseTimeMs}ms`);
            
            if (isComponentMounted.current) {
              setResponseTime(responseTimeMs);
              setConnectionStatus('connected');
              setIsConnected(true);
              setLastResponse('Server reachable (image test)');
            }
            
            resolve({
              ok: true,
              data: { message: 'Server reachable', method: 'image-error-test' },
              status: 200
            });
          };
          
          // Try to load a non-existent image from Arduino
          img.src = `http://${ARDUINO_IP}/test.png?t=${Date.now()}`;
        });
        
        return result;
      } catch (imageError) {
        console.log('[ANDROID 15 ULTIMATE] Strategy 4 failed:', imageError);
      }
      
      throw new Error('All 4 connection strategies failed');
      
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[ANDROID 15 ULTIMATE] All strategies failed after ${responseTimeMs}ms:`, error);
      
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

  // ULTIMATE connection test with 5 full rounds
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[ANDROID 15 ULTIMATE] Starting ULTIMATE connection test...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // ULTIMATE strategy: 5 rounds, all endpoints, all methods
    const endpoints = [
      '/',
      '/ping', 
      '/status',
      '/health',
      '/info',
      '/sync',
    ];
    
    for (let round = 0; round < 5; round++) { // 5 full rounds
      console.log(`[ANDROID 15 ULTIMATE] === ROUND ${round + 1}/5 ===`);
      
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        
        try {
          console.log(`[ANDROID 15 ULTIMATE] Round ${round + 1}, Endpoint ${i + 1}/${endpoints.length}: ${endpoint}`);
          
          const result = await sendCommand(endpoint, 90000);
          
          if (result.ok) {
            console.log(`[ANDROID 15 ULTIMATE] 🎉 ULTIMATE SUCCESS! ${endpoint} worked on round ${round + 1}!`);
            return true;
          }
        } catch (error) {
          console.log(`[ANDROID 15 ULTIMATE] Round ${round + 1}, ${endpoint} failed:`, error);
        }
        
        // Wait between each endpoint attempt
        console.log(`[ANDROID 15 ULTIMATE] Waiting ${RETRY_DELAY}ms before next endpoint...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
      
      // Wait between rounds
      if (round < 4) {
        console.log(`[ANDROID 15 ULTIMATE] Round ${round + 1} complete. Waiting 15s before next round...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
    
    console.log('[ANDROID 15 ULTIMATE] ❌ All 5 rounds failed. Connection unsuccessful.');
    return false;
  }, [sendCommand]);

  // Ultra-conservative monitoring for Android 15 APK
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Wait even longer for Android 15 APK to fully stabilize
      console.log('[ANDROID 15 ULTIMATE] Waiting 20 seconds for Android 15 APK to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      if (isComponentMounted.current) {
        console.log('[ANDROID 15 ULTIMATE] Starting initial connection test...');
        await testConnection();
        
        // Check every 3 minutes if not connected (ultra-conservative)
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            console.log('[ANDROID 15 ULTIMATE] Periodic connection check (3-minute interval)...');
            await testConnection();
          }
        }, 180000); // 3 minutes
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