import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface AndroidArduinoConnection {
  isConnected: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'timeout';
  lastResponse: string | null;
  responseTime: number;
  sendCommand: (endpoint: string, timeout?: number) => Promise<{ ok: boolean; text: string; status: number }>;
  testConnection: () => Promise<boolean>;
  connectionAttempts: number;
}

const ARDUINO_IP = '192.168.4.1';
const DEFAULT_TIMEOUT = 30000; // Increased to 30 seconds for APK builds
const RETRY_DELAY = 5000; // 5 seconds between retries

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // APK-optimized command sending with multiple fallback strategies
  const sendCommand = useCallback(async (endpoint: string, timeout: number = DEFAULT_TIMEOUT): Promise<{ ok: boolean; text: string; status: number }> => {
    const startTime = Date.now();
    
    try {
      console.log(`[APK] Sending command: ${endpoint} with ${timeout}ms timeout`);
      
      // Strategy 1: Try with fetch and AbortController
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`[APK] Aborting request after ${timeout}ms`);
          controller.abort();
        }, timeout);

        // APK-specific headers for better Arduino compatibility
        const headers: Record<string, string> = {
          'Accept': 'text/plain, */*',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'close',
          'User-Agent': 'AEROSPIN-APK/1.0.0',
        };

        const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          headers,
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
        });

        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const responseTimeMs = endTime - startTime;
        
        console.log(`[APK] Strategy 1 response: ${response.status} in ${responseTimeMs}ms`);
        
        const responseText = response.ok ? await response.text() : '';
        
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
          text: responseText,
          status: response.status
        };
      } catch (fetchError) {
        console.log('[APK] Strategy 1 (fetch) failed:', fetchError);
        
        // Strategy 2: Try with XMLHttpRequest for APK compatibility
        if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
          console.log('[APK] Trying Strategy 2 (XMLHttpRequest)...');
          
          return new Promise<{ ok: boolean; text: string; status: number }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;
            xhr.open('GET', `http://${ARDUINO_IP}${endpoint}`, true);
            
            // Set APK-specific headers
            xhr.setRequestHeader('Accept', 'text/plain, */*');
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('User-Agent', 'AEROSPIN-APK/1.0.0');
            
            xhr.onload = () => {
              const endTime = Date.now();
              const responseTimeMs = endTime - startTime;
              
              console.log(`[APK] Strategy 2 response: ${xhr.status} in ${responseTimeMs}ms`);
              
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
                text: xhr.responseText || '',
                status: xhr.status
              });
            };
            
            xhr.onerror = () => {
              console.log('[APK] Strategy 2 (XMLHttpRequest) failed');
              reject(new Error('XMLHttpRequest failed'));
            };
            
            xhr.ontimeout = () => {
              console.log('[APK] Strategy 2 timeout');
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
      
      console.log(`[APK] All strategies failed after ${responseTimeMs}ms:`, error);
      
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

  // Enhanced connection test with APK-specific optimizations
  const testConnection = useCallback(async (): Promise<boolean> => {
    console.log('[APK] Starting enhanced connection test...');
    
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // APK-optimized connection strategies with longer timeouts
    const strategies = [
      { endpoint: '/ping', timeout: 25000, name: 'Enhanced Ping' },
      { endpoint: '/status', timeout: 30000, name: 'Status Check' },
      { endpoint: '/health', timeout: 35000, name: 'Health Check' },
      { endpoint: '/', timeout: 40000, name: 'Root Page' },
    ];
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      
      try {
        console.log(`[APK] Attempt ${i + 1}/${strategies.length}: ${strategy.name} (${strategy.endpoint})`);
        
        const result = await sendCommand(strategy.endpoint, strategy.timeout);
        
        if (result.ok) {
          console.log(`[APK] SUCCESS with ${strategy.name}! Response length: ${result.text.length}`);
          return true;
        } else {
          console.log(`[APK] ${strategy.name} failed with status: ${result.status}`);
        }
      } catch (error) {
        console.log(`[APK] ${strategy.name} failed:`, error);
      }
      
      // Wait between attempts (except for the last one)
      if (i < strategies.length - 1) {
        console.log(`[APK] Waiting ${RETRY_DELAY}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    console.log('[APK] All connection attempts failed');
    return false;
  }, [sendCommand]);

  // APK-specific monitoring with longer intervals
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Initial test with longer delay for APK
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      if (isComponentMounted.current) {
        await testConnection();
        
        // Set up periodic monitoring with longer intervals for APK
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            console.log('[APK] Periodic connection check...');
            await testConnection();
          }
        }, 45000); // Check every 45 seconds if not connected
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