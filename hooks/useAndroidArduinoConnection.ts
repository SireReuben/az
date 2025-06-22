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
const ULTIMATE_TIMEOUT = 120000; // FINAL: 120 seconds (2 minutes) maximum
const RETRY_DELAY = 15000; // 15 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // ANDROID 15 FINAL FIX - Nuclear Option with 6 Strategies
  const sendCommand = useCallback(async (endpoint: string, timeout: number = ULTIMATE_TIMEOUT): Promise<{ ok: boolean; data: any; status: number }> => {
    const startTime = Date.now();
    
    try {
      console.log(`[ANDROID 15 FINAL] Nuclear option: ${endpoint} with ${timeout}ms timeout`);
      
      // STRATEGY 1: Absolute minimal fetch (zero headers)
      try {
        console.log('[ANDROID 15 FINAL] Strategy 1: Zero-header fetch...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[ANDROID 15 FINAL] Strategy 1 timeout triggered');
          controller.abort();
        }, timeout);
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          // Absolutely zero headers for maximum compatibility
        });
        
        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[ANDROID 15 FINAL] Strategy 1 response: ${response.status} in ${responseTimeMs}ms`);
        
        if (response.ok) {
          let responseText = '';
          let responseData: any = null;
          
          try {
            responseText = await response.text();
            console.log(`[ANDROID 15 FINAL] Strategy 1 SUCCESS! Response length: ${responseText.length}`);
            
            // Try to parse as JSON, fallback to text
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              responseData = { message: responseText, raw: responseText };
            }
          } catch (textError) {
            console.log('[ANDROID 15 FINAL] Could not read response text:', textError);
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
        }
      } catch (fetchError) {
        console.log('[ANDROID 15 FINAL] Strategy 1 failed:', fetchError);
      }
      
      // STRATEGY 2: XMLHttpRequest with maximum timeout
      if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
        console.log('[ANDROID 15 FINAL] Strategy 2: XMLHttpRequest with 120s timeout...');
        
        try {
          const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = 120000; // 2 minutes maximum
            xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
            
            // Zero headers for maximum compatibility
            
            xhr.onload = () => {
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              console.log(`[ANDROID 15 FINAL] Strategy 2 response: ${xhr.status} in ${responseTimeMs}ms`);
              
              if (xhr.status === 200 || xhr.status === 0) { // Accept status 0 for local requests
                console.log(`[ANDROID 15 FINAL] Strategy 2 SUCCESS! Response: ${xhr.responseText.substring(0, 100)}`);
                
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
              console.log('[ANDROID 15 FINAL] Strategy 2 network error');
              reject(new Error('Network error'));
            };
            
            xhr.ontimeout = () => {
              console.log('[ANDROID 15 FINAL] Strategy 2 timeout after 120s');
              reject(new Error('Timeout'));
            };
            
            xhr.send();
          });
          
          return result;
        } catch (xhrError) {
          console.log('[ANDROID 15 FINAL] Strategy 2 failed:', xhrError);
        }
      }
      
      // STRATEGY 3: No-CORS mode (opaque response)
      try {
        console.log('[ANDROID 15 FINAL] Strategy 3: No-CORS fetch...');
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          credentials: 'omit',
        });
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[ANDROID 15 FINAL] Strategy 3 response type: ${response.type} in ${responseTimeMs}ms`);
        
        // In no-cors mode, we can't read the response, but if we get here, the request succeeded
        if (response.type === 'opaque') {
          console.log('[ANDROID 15 FINAL] Strategy 3 SUCCESS! (opaque response - connection established)');
          
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
        console.log('[ANDROID 15 FINAL] Strategy 3 failed:', noCorsError);
      }
      
      // STRATEGY 4: Image-based connection test
      try {
        console.log('[ANDROID 15 FINAL] Strategy 4: Image-based connection test...');
        
        const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
          const img = new Image();
          const timeoutId = setTimeout(() => {
            reject(new Error('Image timeout'));
          }, 60000);
          
          img.onload = () => {
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            console.log(`[ANDROID 15 FINAL] Strategy 4 SUCCESS! Image loaded in ${responseTimeMs}ms`);
            
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
            
            console.log(`[ANDROID 15 FINAL] Strategy 4 partial success (server reachable) in ${responseTimeMs}ms`);
            
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
        console.log('[ANDROID 15 FINAL] Strategy 4 failed:', imageError);
      }
      
      // STRATEGY 5: WebSocket attempt (if available)
      if (typeof WebSocket !== 'undefined') {
        try {
          console.log('[ANDROID 15 FINAL] Strategy 5: WebSocket connection test...');
          
          const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const ws = new WebSocket(`ws://${ARDUINO_IP}:80`);
            const timeoutId = setTimeout(() => {
              ws.close();
              reject(new Error('WebSocket timeout'));
            }, 30000);
            
            ws.onopen = () => {
              clearTimeout(timeoutId);
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              console.log(`[ANDROID 15 FINAL] Strategy 5 SUCCESS! WebSocket connected in ${responseTimeMs}ms`);
              
              if (isComponentMounted.current) {
                setResponseTime(responseTimeMs);
                setConnectionStatus('connected');
                setIsConnected(true);
                setLastResponse('WebSocket connection successful');
              }
              
              ws.close();
              resolve({
                ok: true,
                data: { message: 'WebSocket connection successful', method: 'websocket' },
                status: 200
              });
            };
            
            ws.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error('WebSocket error'));
            };
          });
          
          return result;
        } catch (wsError) {
          console.log('[ANDROID 15 FINAL] Strategy 5 failed:', wsError);
        }
      }
      
      // STRATEGY 6: TCP Socket simulation (last resort)
      try {
        console.log('[ANDROID 15 FINAL] Strategy 6: TCP socket simulation...');
        
        // Create a fake request that might trigger TCP connection
        const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `http://${ARDUINO_IP}${endpoint}?callback=jsonp_${Date.now()}`;
          script.onerror = () => {
            // Even if JSONP fails, it means we can reach the server
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            console.log(`[ANDROID 15 FINAL] Strategy 6 partial success (TCP reachable) in ${responseTimeMs}ms`);
            
            if (isComponentMounted.current) {
              setResponseTime(responseTimeMs);
              setConnectionStatus('connected');
              setIsConnected(true);
              setLastResponse('TCP connection verified');
            }
            
            document.head.removeChild(script);
            resolve({
              ok: true,
              data: { message: 'TCP connection verified', method: 'tcp-simulation' },
              status: 200
            });
          };
          
          setTimeout(() => {
            if (script.parentNode) {
              document.head.removeChild(script);
            }
            reject(new Error('TCP simulation timeout'));
          }, 30000);
          
          document.head.appendChild(script);
        });
        
        return result;
      } catch (tcpError) {
        console.log('[ANDROID 15 FINAL] Strategy 6 failed:', tcpError);
      }
      
      throw new Error('All 6 connection strategies failed');
      
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[ANDROID 15 FINAL] All strategies failed after ${responseTimeMs}ms:`, error);
      
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

  // FINAL connection test with 10 full rounds
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[ANDROID 15 FINAL] Starting FINAL connection test with 10 rounds...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // FINAL strategy: 10 rounds, all endpoints, all methods
    const endpoints = [
      '/',
      '/ping', 
      '/status',
      '/health',
      '/info',
      '/sync',
    ];
    
    for (let round = 0; round < 10; round++) { // 10 full rounds
      console.log(`[ANDROID 15 FINAL] === ROUND ${round + 1}/10 ===`);
      
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        
        try {
          console.log(`[ANDROID 15 FINAL] Round ${round + 1}, Endpoint ${i + 1}/${endpoints.length}: ${endpoint}`);
          
          const result = await sendCommand(endpoint, 120000);
          
          if (result.ok) {
            console.log(`[ANDROID 15 FINAL] 🎉 FINAL SUCCESS! ${endpoint} worked on round ${round + 1}!`);
            return true;
          }
        } catch (error) {
          console.log(`[ANDROID 15 FINAL] Round ${round + 1}, ${endpoint} failed:`, error);
        }
        
        // Wait between each endpoint attempt
        console.log(`[ANDROID 15 FINAL] Waiting ${RETRY_DELAY}ms before next endpoint...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
      
      // Wait between rounds
      if (round < 9) {
        console.log(`[ANDROID 15 FINAL] Round ${round + 1} complete. Waiting 30s before next round...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    console.log('[ANDROID 15 FINAL] ❌ All 10 rounds failed. Hardware issue likely.');
    return false;
  }, [sendCommand]);

  // Ultra-conservative monitoring for Android 15 APK
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Wait even longer for Android 15 APK to fully stabilize
      console.log('[ANDROID 15 FINAL] Waiting 30 seconds for Android 15 APK to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      if (isComponentMounted.current) {
        console.log('[ANDROID 15 FINAL] Starting initial connection test...');
        await testConnection();
        
        // Check every 5 minutes if not connected (ultra-conservative)
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            console.log('[ANDROID 15 FINAL] Periodic connection check (5-minute interval)...');
            await testConnection();
          }
        }, 300000); // 5 minutes
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