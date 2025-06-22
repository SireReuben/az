import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ArrowUp, ArrowDown, Square, TriangleAlert as AlertTriangle, Minus, Plus } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface DeviceState {
  direction: string;
  brake: string;
  speed: number;
  sessionActive: boolean;
}

interface DeviceControlsProps {
  deviceState: DeviceState;
  onUpdateState: (updates: Partial<DeviceState>) => void;
  onEmergencyStop: () => void;
  onReset: () => void;
  onReleaseBrake: () => void;
  disabled: boolean;
}

export function DeviceControls({ 
  deviceState, 
  onUpdateState, 
  onEmergencyStop, 
  onReset, 
  onReleaseBrake,
  disabled 
}: DeviceControlsProps) {
  const [sliderValue, setSliderValue] = useState(deviceState.speed);
  const speedBarWidth = useSharedValue(deviceState.speed);
  const { isTablet, isLandscape, screenType } = useDeviceOrientation();

  // Animated styles for smooth UI updates
  const animatedSpeedBarStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${speedBarWidth.value}%`, {
        damping: 15,
        stiffness: 150,
      }),
    };
  });

  // Memoized handlers for better performance
  const handleDirectionChange = useCallback((direction: string) => {
    if (disabled) return;
    
    Alert.alert(
      'Confirm Direction Change',
      `Set motor direction to ${direction}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => onUpdateState({ direction }) 
        },
      ]
    );
  }, [disabled, onUpdateState]);

  const handleBrakeChange = useCallback((brake: string) => {
    if (disabled) return;
    
    const currentBrake = deviceState.brake;
    const newBrake = currentBrake === brake ? 'None' : brake;
    
    Alert.alert(
      'Confirm Brake Operation',
      `${newBrake === 'None' ? 'Release' : 'Apply'} ${brake.toLowerCase()} brake?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => onUpdateState({ brake: newBrake }) 
        },
      ]
    );
  }, [disabled, deviceState.brake, onUpdateState]);

  const handleSpeedChange = useCallback((speed: number) => {
    if (disabled) return;
    
    Alert.alert(
      'Confirm Speed Change',
      `Set motor speed to ${speed}%?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            setSliderValue(speed);
            speedBarWidth.value = withTiming(speed, { duration: 300 });
            onUpdateState({ speed });
          }
        },
      ]
    );
  }, [disabled, speedBarWidth, onUpdateState]);

  const handleSliderSpeedChange = useCallback(() => {
    if (disabled) return;
    
    Alert.alert(
      'Confirm Speed Change',
      `Set motor speed to ${sliderValue}%?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            speedBarWidth.value = withTiming(sliderValue, { duration: 300 });
            onUpdateState({ speed: sliderValue });
          }
        },
      ]
    );
  }, [disabled, sliderValue, speedBarWidth, onUpdateState]);

  const adjustSliderValue = useCallback((delta: number) => {
    if (disabled) return;
    const newValue = Math.max(0, Math.min(100, sliderValue + delta));
    setSliderValue(newValue);
  }, [disabled, sliderValue]);

  const handleEmergencyStop = useCallback(() => {
    Alert.alert(
      'EMERGENCY STOP',
      `This will immediately stop all motor operations and set speed to 0. The current brake position (${deviceState.brake}) will be maintained. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'EMERGENCY STOP', 
          style: 'destructive',
          onPress: onEmergencyStop
        },
      ]
    );
  }, [deviceState.brake, onEmergencyStop]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Device',
      `This will reset the Arduino device, restart all systems, and end the current session. The current brake position (${deviceState.brake}) will be preserved and restored after reset. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Device', 
          style: 'destructive',
          onPress: onReset
        },
      ]
    );
  }, [deviceState.brake, onReset]);

  const handleReleaseBrake = useCallback(() => {
    if (disabled) return;
    
    Alert.alert(
      'Release Brake',
      'This will release the current brake and set it to off position. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Release Brake', 
          onPress: onReleaseBrake
        },
      ]
    );
  }, [disabled, onReleaseBrake]);

  // Update slider when device state changes (fixed synchronization)
  useEffect(() => {
    if (deviceState.speed !== sliderValue) {
      setSliderValue(deviceState.speed);
      speedBarWidth.value = withTiming(deviceState.speed, { duration: 300 });
    }
  }, [deviceState.speed]);

  // Memoized layout calculations
  const layoutStyles = useMemo(() => {
    if (isTablet && isLandscape && screenType !== 'phone') {
      return {
        controlSection: styles.tabletLandscapeControlSection,
        buttonRow: styles.tabletButtonRow,
      };
    }
    return {
      controlSection: null,
      buttonRow: null,
    };
  }, [isTablet, isLandscape, screenType]);

  return (
    <View style={[
      styles.container,
      isTablet && styles.tabletContainer
    ]}>
      <Text style={[
        styles.sectionTitle,
        isTablet && styles.tabletSectionTitle
      ]}>
        Device Controls
      </Text>
      
      {/* Emergency Controls */}
      <View style={[
        styles.emergencySection,
        isTablet && styles.tabletEmergencySection
      ]}>
        <TouchableOpacity
          style={[
            styles.emergencyButton,
            isTablet && styles.tabletEmergencyButton,
            disabled && styles.disabledButton
          ]}
          onPress={handleEmergencyStop}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Square size={isTablet ? 28 : 24} color="#ffffff" />
          <Text style={[
            styles.emergencyButtonText,
            isTablet && styles.tabletEmergencyButtonText
          ]}>
            EMERGENCY STOP
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.resetButton,
            isTablet && styles.tabletResetButton,
            disabled && styles.disabledButton
          ]}
          onPress={handleReset}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <AlertTriangle size={isTablet ? 24 : 20} color="#ffffff" />
          <Text style={[
            styles.resetButtonText,
            isTablet && styles.tabletResetButtonText
          ]}>
            RESET DEVICE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Brake Position Info */}
      {deviceState.brake !== 'None' && (
        <View style={[
          styles.brakeInfoSection,
          isTablet && styles.tabletBrakeInfoSection
        ]}>
          <Text style={[
            styles.brakeInfoText,
            isTablet && styles.tabletBrakeInfoText
          ]}>
            Current brake position: <Text style={styles.brakeInfoValue}>{deviceState.brake}</Text>
          </Text>
          <Text style={[
            styles.brakeInfoSubtext,
            isTablet && styles.tabletBrakeInfoSubtext
          ]}>
            This position will be preserved during reset and emergency stop operations
          </Text>
        </View>
      )}
      
      <View style={layoutStyles.controlSection}>
        {/* Direction Controls */}
        <View style={[
          styles.controlSection,
          isTablet && styles.tabletControlSection
        ]}>
          <Text style={[
            styles.controlLabel,
            isTablet && styles.tabletControlLabel
          ]}>
            Motor Direction
          </Text>
          <View style={[styles.buttonRow, layoutStyles.buttonRow]}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.directionButton,
                isTablet && styles.tabletControlButton,
                deviceState.direction === 'Forward' && styles.activeButton,
                disabled && styles.disabledButton,
              ]}
              onPress={() => handleDirectionChange('Forward')}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <ArrowUp size={isTablet ? 24 : 20} color="#ffffff" />
              <Text style={[
                styles.buttonText,
                isTablet && styles.tabletButtonText
              ]}>
                Forward
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.directionButton,
                isTablet && styles.tabletControlButton,
                deviceState.direction === 'Reverse' && styles.activeButton,
                disabled && styles.disabledButton,
              ]}
              onPress={() => handleDirectionChange('Reverse')}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <ArrowDown size={isTablet ? 24 : 20} color="#ffffff" />
              <Text style={[
                styles.buttonText,
                isTablet && styles.tabletButtonText
              ]}>
                Reverse
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brake Controls */}
        <View style={[
          styles.controlSection,
          isTablet && styles.tabletControlSection
        ]}>
          <Text style={[
            styles.controlLabel,
            isTablet && styles.tabletControlLabel
          ]}>
            Brake Control
          </Text>
          <View style={[styles.buttonRow, layoutStyles.buttonRow]}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.brakeButton,
                isTablet && styles.tabletControlButton,
                deviceState.brake === 'Pull' && styles.activeBrakeButton,
                disabled && styles.disabledButton,
              ]}
              onPress={() => handleBrakeChange('Pull')}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                isTablet && styles.tabletButtonText
              ]}>
                {deviceState.brake === 'Pull' ? 'Release Pull' : 'Pull Brake'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.brakeButton,
                isTablet && styles.tabletControlButton,
                deviceState.brake === 'Push' && styles.activeBrakeButton,
                disabled && styles.disabledButton,
              ]}
              onPress={() => handleBrakeChange('Push')}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                isTablet && styles.tabletButtonText
              ]}>
                {deviceState.brake === 'Push' ? 'Release Push' : 'Push Brake'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Release Brake Button */}
          {deviceState.brake !== 'None' && (
            <View style={styles.releaseButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.releaseBrakeButton,
                  isTablet && styles.tabletReleaseBrakeButton,
                  disabled && styles.disabledButton
                ]}
                onPress={handleReleaseBrake}
                disabled={disabled}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.releaseBrakeButtonText,
                  isTablet && styles.tabletReleaseBrakeButtonText
                ]}>
                  Release Brake
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Speed Controls */}
      <View style={[
        styles.controlSection,
        isTablet && styles.tabletControlSection
      ]}>
        <Text style={[
          styles.controlLabel,
          isTablet && styles.tabletControlLabel
        ]}>
          Motor Speed
        </Text>
        
        {/* Speed Display and Bar */}
        <View style={styles.speedContainer}>
          <View style={[
            styles.speedBar,
            isTablet && styles.tabletSpeedBar
          ]}>
            <Animated.View style={[styles.speedFill, animatedSpeedBarStyle]} />
          </View>
          <Text style={[
            styles.speedText,
            isTablet && styles.tabletSpeedText
          ]}>
            {deviceState.speed}%
          </Text>
        </View>
        
        {/* Speed Slider Controls */}
        <View style={styles.sliderContainer}>
          <Text style={[
            styles.sliderLabel,
            isTablet && styles.tabletSliderLabel
          ]}>
            Set Speed: {sliderValue}%
          </Text>
          <View style={styles.sliderControls}>
            <TouchableOpacity
              style={[
                styles.sliderButton,
                isTablet && styles.tabletSliderButton,
                disabled && styles.disabledButton
              ]}
              onPress={() => adjustSliderValue(-5)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Minus size={isTablet ? 20 : 16} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.sliderBarContainer}>
              <View style={[
                styles.sliderBar,
                isTablet && styles.tabletSliderBar
              ]}>
                <View 
                  style={[
                    styles.sliderFill,
                    { width: `${sliderValue}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.sliderThumb,
                    isTablet && styles.tabletSliderThumb,
                    { left: `${Math.max(0, Math.min(100, sliderValue))}%` }
                  ]} 
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.sliderButton,
                isTablet && styles.tabletSliderButton,
                disabled && styles.disabledButton
              ]}
              onPress={() => adjustSliderValue(5)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Plus size={isTablet ? 20 : 16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[
              styles.applySpeedButton,
              isTablet && styles.tabletApplySpeedButton,
              disabled && styles.disabledButton
            ]}
            onPress={handleSliderSpeedChange}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.applySpeedButtonText,
              isTablet && styles.tabletApplySpeedButtonText
            ]}>
              Apply Speed
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick Speed Buttons */}
        <View style={[
          styles.speedButtons,
          isTablet && styles.tabletSpeedButtons
        ]}>
          {[0, 25, 50, 75, 100].map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                isTablet && styles.tabletSpeedButton,
                deviceState.speed === speed && styles.activeSpeedButton,
                disabled && styles.disabledButton,
              ]}
              onPress={() => handleSpeedChange(speed)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.speedButtonText,
                isTablet && styles.tabletSpeedButtonText,
                deviceState.speed === speed && styles.activeSpeedButtonText
              ]}>
                {speed}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {disabled && (
        <View style={[
          styles.disabledNotice,
          isTablet && styles.tabletDisabledNotice
        ]}>
          <Text style={[
            styles.disabledNoticeText,
            isTablet && styles.tabletDisabledNoticeText
          ]}>
            Controls disabled - Device not connected or session not active
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabletContainer: {
    padding: 24,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletSectionTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  emergencySection: {
    marginBottom: 24,
    gap: 12,
  },
  tabletEmergencySection: {
    marginBottom: 32,
    gap: 16,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabletEmergencyButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  emergencyButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  tabletEmergencyButtonText: {
    fontSize: 22,
    marginLeft: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabletResetButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  tabletResetButtonText: {
    fontSize: 18,
    marginLeft: 12,
  },
  brakeInfoSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tabletBrakeInfoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  brakeInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
    marginBottom: 4,
  },
  tabletBrakeInfoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  brakeInfoValue: {
    fontFamily: 'Inter-Bold',
    color: '#1e3a8a',
  },
  brakeInfoSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  tabletBrakeInfoSubtext: {
    fontSize: 14,
  },
  tabletLandscapeControlSection: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  controlSection: {
    marginBottom: 24,
  },
  tabletControlSection: {
    marginBottom: 32,
    flex: 1,
  },
  controlLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabletControlLabel: {
    fontSize: 18,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabletButtonRow: {
    gap: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
  },
  tabletControlButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 140,
    flex: 1,
  },
  directionButton: {
    backgroundColor: '#22c55e',
  },
  brakeButton: {
    backgroundColor: '#06b6d4',
  },
  activeButton: {
    backgroundColor: '#ef4444',
  },
  activeBrakeButton: {
    backgroundColor: '#f59e0b',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
    marginLeft: 4,
  },
  tabletButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  releaseButtonContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  releaseBrakeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  tabletReleaseBrakeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  releaseBrakeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  tabletReleaseBrakeButtonText: {
    fontSize: 16,
  },
  speedContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  speedBar: {
    width: '100%',
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tabletSpeedBar: {
    height: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  speedFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 10,
  },
  speedText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
  },
  tabletSpeedText: {
    fontSize: 32,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  tabletSliderLabel: {
    fontSize: 16,
    marginBottom: 16,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderButton: {
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 6,
  },
  tabletSliderButton: {
    padding: 12,
    borderRadius: 8,
  },
  sliderBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  sliderBar: {
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    position: 'relative',
  },
  tabletSliderBar: {
    height: 24,
    borderRadius: 12,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 10,
  },
  sliderThumb: {
    position: 'absolute',
    top: -2,
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginLeft: -12,
  },
  tabletSliderThumb: {
    top: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -16,
  },
  applySpeedButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  tabletApplySpeedButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  applySpeedButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabletApplySpeedButtonText: {
    fontSize: 16,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  tabletSpeedButtons: {
    gap: 12,
  },
  speedButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  tabletSpeedButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    flex: 1,
  },
  activeSpeedButton: {
    backgroundColor: '#1e40af',
  },
  speedButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  tabletSpeedButtonText: {
    fontSize: 14,
  },
  activeSpeedButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  disabledNotice: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  tabletDisabledNotice: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  disabledNoticeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  tabletDisabledNoticeText: {
    fontSize: 14,
  },
});