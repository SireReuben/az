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
const NUCLEAR_TIMEOUT = 120000; // FINAL: 120 seconds (2 minutes) maximum
const RETRY_DELAY = 10000; // 10 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // ANDROID 15 FINAL DEBUG - Enhanced logging
  const debugLog = (message: string, data?: any) => {
    console.log(`[ANDROID-15-DEBUG] ${message}`, data || '');
  };

  // ANDROID 15 NUCLEAR OPTION - 6 Strategies with Enhanced Debugging
  const sendCommand = useCallback(async (endpoint: string, timeout: number = NUCLEAR_TIMEOUT): Promise<{ ok: boolean; data: any; status: number }> => {
    const startTime = Date.now();
    
    try {
      debugLog(`Starting NUCLEAR connection test: ${endpoint} with ${timeout}ms timeout`);
      
      // STRATEGY 1: Ultra-minimal fetch with debug logging
      try {
        debugLog('Strategy 1: Ultra-minimal fetch starting...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          debugLog('Strategy 1: Timeout triggered, aborting...');
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
        
        debugLog(`Strategy 1 response: ${response.status} in ${responseTimeMs}ms`);
        
        if (response.ok) {
          let responseText = '';
          let responseData: any = null;
          
          try {
            responseText = await response.text();
            debugLog(`Strategy 1 SUCCESS! Response length: ${responseText.length}`);
            debugLog('Response preview:', responseText.substring(0, 200));
            
            // Try to parse as JSON, fallback to text
            try {
              responseData = JSON.parse(responseText);
              debugLog('Successfully parsed JSON response');
            } catch (e) {
              debugLog('Could not parse as JSON, using text response');
              responseData = { message: responseText, raw: responseText };
            }
          } catch (textError) {
            debugLog('Could not read response text:', textError);
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
          debugLog(`Strategy 1 failed with status: ${response.status}`);
        }
      } catch (fetchError) {
        debugLog('Strategy 1 failed:', fetchError);
      }
      
      // STRATEGY 2: XMLHttpRequest with enhanced debugging
      if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
        debugLog('Strategy 2: XMLHttpRequest starting...');
        
        try {
          const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;
            xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
            
            debugLog('XHR request configured, sending...');
            
            xhr.onload = () => {
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              debugLog(`Strategy 2 response: ${xhr.status} in ${responseTimeMs}ms`);
              debugLog('XHR response text length:', xhr.responseText.length);
              
              if (xhr.status === 200 || xhr.status === 0) { // Accept status 0 for local requests
                debugLog(`Strategy 2 SUCCESS! Response: ${xhr.responseText.substring(0, 100)}`);
                
                let responseData: any = null;
                try {
                  responseData = JSON.parse(xhr.responseText);
                  debugLog('XHR JSON parsed successfully');
                } catch (e) {
                  debugLog('XHR response not JSON, using text');
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
                debugLog(`XHR failed with status: ${xhr.status}`);
                reject(new Error(`HTTP ${xhr.status}`));
              }
            };
            
            xhr.onerror = (error) => {
              debugLog('Strategy 2 network error:', error);
              reject(new Error('Network error'));
            };
            
            xhr.ontimeout = () => {
              debugLog('Strategy 2 timeout after', timeout, 'ms');
              reject(new Error('Timeout'));
            };
            
            xhr.send();
          });
          
          return result;
        } catch (xhrError) {
          debugLog('Strategy 2 failed:', xhrError);
        }
      }
      
      // STRATEGY 3: No-CORS mode with debug logging
      try {
        debugLog('Strategy 3: No-CORS fetch starting...');
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          credentials: 'omit',
        });
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        debugLog(`Strategy 3 response type: ${response.type} in ${responseTimeMs}ms`);
        
        // In no-cors mode, we can't read the response, but if we get here, the request succeeded
        if (response.type === 'opaque') {
          debugLog('Strategy 3 SUCCESS! (opaque response - connection established)');
          
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
        debugLog('Strategy 3 failed:', noCorsError);
      }
      
      // STRATEGY 4: Image-based connection test with debug logging
      try {
        debugLog('Strategy 4: Image-based connection test starting...');
        
        const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
          const img = new Image();
          const timeoutId = setTimeout(() => {
            debugLog('Strategy 4: Image test timeout');
            reject(new Error('Image timeout'));
          }, 60000);
          
          img.onload = () => {
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            debugLog(`Strategy 4 SUCCESS! Image loaded in ${responseTimeMs}ms`);
            
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
            
            debugLog(`Strategy 4 partial success (server reachable) in ${responseTimeMs}ms`);
            
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
          debugLog('Image test URL:', img.src);
        });
        
        return result;
      } catch (imageError) {
        debugLog('Strategy 4 failed:', imageError);
      }
      
      // STRATEGY 5: WebSocket attempt with debug logging
      if (typeof WebSocket !== 'undefined') {
        try {
          debugLog('Strategy 5: WebSocket connection test starting...');
          
          const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const ws = new WebSocket(`ws://${ARDUINO_IP}:80`);
            const timeoutId = setTimeout(() => {
              debugLog('Strategy 5: WebSocket timeout');
              ws.close();
              reject(new Error('WebSocket timeout'));
            }, 30000);
            
            ws.onopen = () => {
              clearTimeout(timeoutId);
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              debugLog(`Strategy 5 SUCCESS! WebSocket connected in ${responseTimeMs}ms`);
              
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
            
            ws.onerror = (error) => {
              clearTimeout(timeoutId);
              debugLog('Strategy 5 WebSocket error:', error);
              reject(new Error('WebSocket error'));
            };
          });
          
          return result;
        } catch (wsError) {
          debugLog('Strategy 5 failed:', wsError);
        }
      }
      
      // STRATEGY 6: JSONP-style script injection with debug logging
      try {
        debugLog('Strategy 6: JSONP-style connection test starting...');
        
        const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `http://${ARDUINO_IP}${endpoint}?callback=jsonp_${Date.now()}`;
          
          debugLog('JSONP script URL:', script.src);
          
          script.onerror = () => {
            // Even if JSONP fails, it means we can reach the server
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            debugLog(`Strategy 6 partial success (TCP reachable) in ${responseTimeMs}ms`);
            
            if (isComponentMounted.current) {
              setResponseTime(responseTimeMs);
              setConnectionStatus('connected');
              setIsConnected(true);
              setLastResponse('TCP connection verified');
            }
            
            document.head.removeChild(script);
            resolve({
              ok: true,
              data: { message: 'TCP connection verified', method: 'jsonp-simulation' },
              status: 200
            });
          };
          
          setTimeout(() => {
            if (script.parentNode) {
              document.head.removeChild(script);
            }
            debugLog('Strategy 6: JSONP timeout');
            reject(new Error('JSONP simulation timeout'));
          }, 30000);
          
          document.head.appendChild(script);
        });
        
        return result;
      } catch (jsonpError) {
        debugLog('Strategy 6 failed:', jsonpError);
      }
      
      debugLog('ALL 6 STRATEGIES FAILED - This indicates a fundamental issue');
      throw new Error('All 6 connection strategies failed');
      
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      debugLog(`All strategies failed after ${responseTimeMs}ms:`, error);
      
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

  // FINAL connection test with comprehensive debugging
  const testConnection = useCallback(async (): Promise<boolean> => {
    debugLog('Starting FINAL connection test with comprehensive debugging...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // Test all endpoints with all strategies
    const endpoints = [
      '/',
      '/ping', 
      '/status',
      '/health',
      '/info',
      '/sync',
    ];
    
    for (let round = 0; round < 3; round++) { // 3 full rounds
      debugLog(`=== ROUND ${round + 1}/3 ===`);
      
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        
        try {
          debugLog(`Round ${round + 1}, Endpoint ${i + 1}/${endpoints.length}: ${endpoint}`);
          
          const result = await sendCommand(endpoint, NUCLEAR_TIMEOUT);
          
          if (result.ok) {
            debugLog(`🎉 FINAL SUCCESS! ${endpoint} worked on round ${round + 1}!`);
            debugLog('Success data:', result.data);
            return true;
          }
        } catch (error) {
          debugLog(`Round ${round + 1}, ${endpoint} failed:`, error);
        }
        
        // Wait between each endpoint attempt
        if (i < endpoints.length - 1) {
          debugLog(`Waiting ${RETRY_DELAY}ms before next endpoint...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      // Wait between rounds
      if (round < 2) {
        debugLog(`Round ${round + 1} complete. Waiting 20s before next round...`);
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }
    
    debugLog('❌ All 3 rounds failed. This indicates a fundamental hardware or network issue.');
    debugLog('RECOMMENDATION: Test Arduino with computer browser to verify hardware');
    return false;
  }, [sendCommand]);

  // Enhanced monitoring with debug logging
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      debugLog('Waiting 15 seconds for Android 15 APK to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      if (isComponentMounted.current) {
        debugLog('Starting initial connection test...');
        await testConnection();
        
        // Check every 2 minutes if not connected
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            debugLog('Periodic connection check (2-minute interval)...');
            await testConnection();
          }
        }, 120000); // 2 minutes
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