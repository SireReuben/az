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
const OPTIMIZED_TIMEOUT = 90000; // Increased from 15s to 90s for Android 15 compatibility
const RETRY_DELAY = 3000; // Reduced from 10s to 3s

export function useAndroidArduinoConnection(): AndroidArduinoConnection {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'timeout'>('checking');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const isComponentMounted = useRef(true);

  // Optimized connection with faster timeouts for production builds
  const sendCommand = useCallback(async (endpoint: string, timeout: number = OPTIMIZED_TIMEOUT): Promise<{ ok: boolean; data: any; status: number }> => {
    const startTime = Date.now();
    
    try {
      // Strategy 1: Simple fetch (works well with production builds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`http://${ARDUINO_IP}${endpoint}`, {
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
      const responseTimeMs = endTime - startTime;
      
      if (response.ok) {
        let responseText = '';
        let responseData: any = null;
        
        try {
          responseText = await response.text();
          
          // Try to parse as JSON, fallback to text
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = { message: responseText, raw: responseText };
          }
        } catch (textError) {
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
      
      throw new Error(`HTTP ${response.status}`);
      
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
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

  // Optimized connection test with faster retries
  const testConnection = useCallback(async (): Promise<boolean> => {
    setConnectionStatus('checking');
    setConnectionAttempts(prev => prev + 1);
    
    // Test endpoints in order of reliability
    const endpoints = ['/ping', '/status', '/health'];
    
    for (let round = 0; round < 2; round++) { // Reduced from 3 to 2 rounds
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        
        try {
          const result = await sendCommand(endpoint, OPTIMIZED_TIMEOUT);
          
          if (result.ok) {
            return true;
          }
        } catch (error) {
          // Continue to next endpoint
        }
        
        // Shorter wait between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Shorter wait between rounds
      if (round < 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    return false;
  }, [sendCommand]);

  // Optimized monitoring with longer intervals for better performance
  useEffect(() => {
    let monitoringInterval: NodeJS.Timeout;
    
    const startMonitoring = async () => {
      // Shorter initial delay for production builds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (isComponentMounted.current) {
        await testConnection();
        
        // Check every 30 seconds if not connected (reduced frequency)
        monitoringInterval = setInterval(async () => {
          if (isComponentMounted.current && !isConnected) {
            await testConnection();
          }
        }, 30000);
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