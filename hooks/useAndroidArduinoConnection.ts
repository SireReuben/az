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
const DEFAULT_TIMEOUT = 60000; // Increased to 60 seconds for Android 15 APK
const RETRY_DELAY = 8000; // 8 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // Android 15 APK FINAL FIX - Ultra-aggressive connection strategy
  const sendCommand = useCallback(async (endpoint: string, timeout: number = DEFAULT_TIMEOUT): Promise<{ ok: boolean; data: any; status: number }> => {
    const startTime = Date.now();
    
    try {
      console.log(`[ANDROID 15 FINAL FIX] Sending command: ${endpoint} with ${timeout}ms timeout`);
      
      // STRATEGY 1: Ultra-simple fetch with minimal headers
      try {
        console.log('[ANDROID 15 FINAL FIX] Trying Strategy 1: Ultra-simple fetch...');
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[ANDROID 15 FINAL FIX] Strategy 1 response: ${response.status} in ${responseTimeMs}ms`);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log(`[ANDROID 15 FINAL FIX] Strategy 1 SUCCESS! Response: ${responseText.substring(0, 100)}`);
          
          let responseData: any = null;
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = { message: responseText, raw: responseText };
          }
          
          if (isComponentMounted.current) {
            setResponseTime(responseTimeMs);
            setConnectionStatus('connected');
            setIsConnected(true);
            setLastResponse(responseText);
          }

          return {
            ok: true,
            data: responseData,
            status: response.status
          };
        }
      } catch (fetchError) {
        console.log('[ANDROID 15 FINAL FIX] Strategy 1 failed:', fetchError);
      }
      
      // STRATEGY 2: XMLHttpRequest with ultra-long timeout
      if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
        console.log('[ANDROID 15 FINAL FIX] Trying Strategy 2: XMLHttpRequest with 60s timeout...');
        
        try {
          const result = await new Promise<{ ok: boolean; data: any; status: number }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = 60000; // 60 seconds
            xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
            
            // Minimal headers for maximum compatibility
            xhr.setRequestHeader('Accept', '*/*');
            
            xhr.onload = () => {
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              console.log(`[ANDROID 15 FINAL FIX] Strategy 2 response: ${xhr.status} in ${responseTimeMs}ms`);
              
              if (xhr.status === 200) {
                console.log(`[ANDROID 15 FINAL FIX] Strategy 2 SUCCESS! Response: ${xhr.responseText.substring(0, 100)}`);
                
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
                  status: xhr.status
                });
              } else {
                reject(new Error(`HTTP ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => {
              console.log('[ANDROID 15 FINAL FIX] Strategy 2 network error');
              reject(new Error('Network error'));
            };
            
            xhr.ontimeout = () => {
              console.log('[ANDROID 15 FINAL FIX] Strategy 2 timeout after 60s');
              reject(new Error('Timeout'));
            };
            
            xhr.send();
          });
          
          return result;
        } catch (xhrError) {
          console.log('[ANDROID 15 FINAL FIX] Strategy 2 failed:', xhrError);
        }
      }
      
      // STRATEGY 3: Fetch with no-cors mode (last resort)
      try {
        console.log('[ANDROID 15 FINAL FIX] Trying Strategy 3: No-CORS fetch...');
        
        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          mode: 'no-cors',
        });
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[ANDROID 15 FINAL FIX] Strategy 3 response: ${response.status} in ${responseTimeMs}ms`);
        
        // In no-cors mode, we can't read the response, but if we get here, the request succeeded
        if (response.type === 'opaque') {
          console.log('[ANDROID 15 FINAL FIX] Strategy 3 SUCCESS! (opaque response)');
          
          if (isComponentMounted.current) {
            setResponseTime(responseTimeMs);
            setConnectionStatus('connected');
            setIsConnected(true);
            setLastResponse('Connection successful (no-cors mode)');
          }

          return {
            ok: true,
            data: { message: 'Connected successfully', mode: 'no-cors' },
            status: 200
          };
        }
      } catch (noCorsError) {
        console.log('[ANDROID 15 FINAL FIX] Strategy 3 failed:', noCorsError);
      }
      
      throw new Error('All connection strategies failed');
      
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`[ANDROID 15 FINAL FIX] All strategies failed after ${responseTimeMs}ms:`, error);
      
      if (isComponentMounted.current) {
        setResponseTime(responseTimeMs);
        setIsConnected(false);
        setConnectionStatus('failed');
      }
      
      throw error;
    }
  }, []);

  // Enhanced connection test with AGGRESSIVE retry strategy
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[ANDROID 15 FINAL FIX] Starting AGGRESSIVE connection test...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // ULTRA-AGGRESSIVE strategy: Try EVERY possible endpoint with MAXIMUM timeouts
    const strategies = [
      { endpoint: '/', timeout: 60000, name: 'Root Endpoint' },
      { endpoint: '/ping', timeout: 60000, name: 'Ping Endpoint' },
      { endpoint: '/status', timeout: 60000, name: 'Status Endpoint' },
      { endpoint: '/health', timeout: 60000, name: 'Health Endpoint' },
      { endpoint: '/info', timeout: 60000, name: 'Info Endpoint' },
    ];
    
    for (let attempt = 0; attempt < 3; attempt++) { // 3 full rounds
      console.log(`[ANDROID 15 FINAL FIX] === ROUND ${attempt + 1}/3 ===`);
      
      for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        
        try {
          console.log(`[ANDROID 15 FINAL FIX] Round ${attempt + 1}, Strategy ${i + 1}/${strategies.length}: ${strategy.name}`);
          
          const result = await sendCommand(strategy.endpoint, strategy.timeout);
          
          if (result.ok) {
            console.log(`[ANDROID 15 FINAL FIX] 🎉 SUCCESS! ${strategy.name} worked on round ${attempt + 1}!`);
            return true;
          }
        } catch (error) {
          console.log(`[ANDROID 15 FINAL FIX] Round ${attempt + 1}, ${strategy.name} failed:`, error);
        }
        
        // Wait between each strategy attempt
        console.log(`[ANDROID 15 FINAL FIX] Waiting ${RETRY_DELAY}ms before next strategy...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
      
      // Wait between rounds
      if (attempt < 2) {
        console.log(`[ANDROID 15 FINAL FIX] Round ${attempt + 1} complete. Waiting 10s before next round...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('[ANDROID 15 FINAL FIX] ❌ All 3 rounds failed. Connection unsuccessful.');
    return false;
  }, [sendCommand]);

  // Ultra-conservative monitoring for Android 15 APK
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Wait longer for Android 15 APK to stabilize
      console.log('[ANDROID 15 FINAL FIX] Waiting 15 seconds for Android 15 APK to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      if (isComponentMounted.current) {
        console.log('[ANDROID 15 FINAL FIX] Starting initial connection test...');
        await testConnection();
        
        // Check every 2 minutes if not connected (very conservative)
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            console.log('[ANDROID 15 FINAL FIX] Periodic connection check (2-minute interval)...');
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