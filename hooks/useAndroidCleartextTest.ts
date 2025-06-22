import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface CleartextTestResult {
  isConfigured: boolean;
  testResults: {
    basicFetch: 'success' | 'failed' | 'testing';
    withHeaders: 'success' | 'failed' | 'testing';
    tcpSocket: 'success' | 'failed' | 'testing';
  };
  errorMessages: string[];
  recommendations: string[];
}

export function useAndroidCleartextTest() {
  const [testResult, setTestResult] = useState<CleartextTestResult>({
    isConfigured: false,
    testResults: {
      basicFetch: 'testing',
      withHeaders: 'testing',
      tcpSocket: 'testing',
    },
    errorMessages: [],
    recommendations: [],
  });

  const runCleartextTest = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setTestResult(prev => ({
        ...prev,
        recommendations: ['Cleartext testing is only relevant for Android APK builds'],
      }));
      return;
    }

    console.log('[CLEARTEXT-TEST] Starting comprehensive cleartext configuration test...');
    
    const errors: string[] = [];
    const recommendations: string[] = [];
    const results = {
      basicFetch: 'testing' as const,
      withHeaders: 'testing' as const,
      tcpSocket: 'testing' as const,
    };

    // Test 1: Basic fetch to Arduino
    try {
      console.log('[CLEARTEXT-TEST] Test 1: Basic fetch...');
      const response = await fetch('http://192.168.4.1/ping', {
        method: 'GET',
      });
      
      if (response.ok) {
        results.basicFetch = 'success';
        console.log('[CLEARTEXT-TEST] ✅ Basic fetch successful');
      } else {
        results.basicFetch = 'failed';
        errors.push(`Basic fetch failed with status: ${response.status}`);
      }
    } catch (error) {
      results.basicFetch = 'failed';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Basic fetch error: ${errorMessage}`);
      
      // Check for specific cleartext errors
      if (errorMessage.includes('cleartext') || 
          errorMessage.includes('CLEARTEXT_NOT_PERMITTED') ||
          errorMessage.includes('not permitted')) {
        recommendations.push('❌ Cleartext traffic is being blocked by Android security policy');
        recommendations.push('🔧 Verify android:usesCleartextTraffic="true" in AndroidManifest.xml');
        recommendations.push('🔧 Check network_security_config.xml includes 192.168.4.1');
      }
      
      console.log('[CLEARTEXT-TEST] ❌ Basic fetch failed:', errorMessage);
    }

    // Test 2: Fetch with headers
    try {
      console.log('[CLEARTEXT-TEST] Test 2: Fetch with headers...');
      const response = await fetch('http://192.168.4.1/ping', {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, */*',
          'User-Agent': 'AEROSPIN-Android-Cleartext-Test/1.0',
        },
      });
      
      if (response.ok) {
        results.withHeaders = 'success';
        console.log('[CLEARTEXT-TEST] ✅ Fetch with headers successful');
      } else {
        results.withHeaders = 'failed';
        errors.push(`Fetch with headers failed with status: ${response.status}`);
      }
    } catch (error) {
      results.withHeaders = 'failed';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Fetch with headers error: ${errorMessage}`);
      console.log('[CLEARTEXT-TEST] ❌ Fetch with headers failed:', errorMessage);
    }

    // Test 3: TCP Socket test (if available)
    try {
      console.log('[CLEARTEXT-TEST] Test 3: TCP socket test...');
      
      // Note: This would require react-native-tcp-socket
      // For now, we'll simulate this test
      results.tcpSocket = 'testing';
      recommendations.push('💡 Install react-native-tcp-socket for low-level network testing');
      
    } catch (error) {
      results.tcpSocket = 'failed';
      console.log('[CLEARTEXT-TEST] TCP socket test not available');
    }

    // Analyze results and provide recommendations
    const successCount = Object.values(results).filter(r => r === 'success').length;
    
    if (successCount === 0) {
      recommendations.push('🚨 All HTTP tests failed - cleartext traffic is likely blocked');
      recommendations.push('🔧 Rebuild APK after verifying AndroidManifest.xml configuration');
      recommendations.push('🔧 Check ADB logs: adb logcat | grep -i cleartext');
      recommendations.push('🍎 Consider iOS build as reliable alternative');
    } else if (successCount < 2) {
      recommendations.push('⚠️ Partial success - some cleartext restrictions may still apply');
      recommendations.push('🔧 Try different HTTP methods or headers');
      recommendations.push('🔧 Check for WebView-specific restrictions');
    } else {
      recommendations.push('✅ Cleartext configuration appears to be working');
      recommendations.push('🔍 Issue may be Arduino-specific or network-related');
      recommendations.push('🔧 Check Arduino is responding to browser requests');
    }

    setTestResult({
      isConfigured: successCount > 0,
      testResults: results,
      errorMessages: errors,
      recommendations,
    });

    console.log('[CLEARTEXT-TEST] Test completed. Success rate:', `${successCount}/2`);
  }, []);

  useEffect(() => {
    // Run test automatically on Android
    if (Platform.OS === 'android') {
      setTimeout(runCleartextTest, 2000);
    }
  }, [runCleartextTest]);

  return {
    testResult,
    runCleartextTest,
  };
}