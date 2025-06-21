# Android 15 Developer Mode Settings for AEROSPIN APK

## 🚀 **CRITICAL DEVELOPER SETTINGS TO ENABLE**

### **1. Enable Developer Options**
```
Settings → About Phone → Build Number (tap 7 times)
```

### **2. USB Debugging & Development**
```
Settings → Developer Options → USB Debugging: ON
Settings → Developer Options → Wireless Debugging: ON
Settings → Developer Options → Install via USB: ON
```

### **3. Network & WiFi Optimization**
```
Settings → Developer Options → Mobile Data Always Active: OFF
Settings → Developer Options → WiFi Scan Throttling: OFF
Settings → Developer Options → WiFi Enhanced Mac Randomization: OFF
Settings → Developer Options → WiFi Verbose Logging: ON (for debugging)
```

### **4. Background App Restrictions**
```
Settings → Developer Options → Don't Keep Activities: OFF
Settings → Developer Options → Background Process Limit: Standard Limit
Settings → Developer Options → Background App Refresh: ON
```

### **5. Power Management**
```
Settings → Developer Options → Stay Awake: ON (while charging)
Settings → Battery → Battery Optimization → AEROSPIN App → Don't Optimize
Settings → Apps → AEROSPIN → Battery → Unrestricted
```

### **6. Network Security**
```
Settings → Developer Options → Enable Cleartext Traffic: ON
Settings → Developer Options → Disable Permission Monitoring: ON
Settings → Privacy → Permission Manager → Location → AEROSPIN → Allow All The Time
```

### **7. Animation & Performance**
```
Settings → Developer Options → Window Animation Scale: 0.5x
Settings → Developer Options → Transition Animation Scale: 0.5x
Settings → Developer Options → Animator Duration Scale: 0.5x
```

### **8. Memory & Storage**
```
Settings → Developer Options → Don't Keep Activities: OFF
Settings → Developer Options → Background Process Limit: Standard Limit
Settings → Developer Options → Memory Optimization: OFF
```

## 🔒 **SECURITY SETTINGS FOR ARDUINO COMMUNICATION**

### **1. Network Security Config**
```
Settings → Security → More Security Settings → Device Admin Apps: Allow AEROSPIN
Settings → Privacy → Special App Access → Device Admin Apps → AEROSPIN: ON
```

### **2. WiFi Security**
```
Settings → WiFi → Advanced → Network Security Config: Allow HTTP Traffic
Settings → WiFi → Advanced → MAC Address Type: Device MAC
Settings → WiFi → Advanced → Randomize MAC: OFF (for AEROSPIN CONTROL network)
```

### **3. Firewall & VPN**
```
Settings → Security → VPN: Disconnect All (while using AEROSPIN)
Settings → Security → Private DNS: OFF (while using AEROSPIN)
Settings → Network → Firewall: Allow AEROSPIN App
```

## 📱 **APP-SPECIFIC SETTINGS**

### **1. AEROSPIN App Permissions**
```
Settings → Apps → AEROSPIN Control → Permissions:
  ✅ Location: Allow All The Time
  ✅ Nearby Devices: Allow
  ✅ WiFi Control: Allow
  ✅ Network Access: Allow
  ✅ Device Admin: Allow
```

### **2. Battery Optimization**
```
Settings → Battery → Battery Optimization → AEROSPIN → Don't Optimize
Settings → Battery → Adaptive Battery: OFF (for AEROSPIN)
Settings → Battery → Background App Refresh → AEROSPIN: ON
```

### **3. Data Usage**
```
Settings → Network → Data Usage → AEROSPIN → Unrestricted Data Usage: ON
Settings → Network → WiFi Data Usage → AEROSPIN → Background Data: ON
```

## 🛠️ **ADVANCED DEVELOPER SETTINGS**

### **1. Networking**
```
Settings → Developer Options → Networking:
  ✅ Mobile Data Always Active: OFF
  ✅ WiFi Scan Throttling: OFF
  ✅ WiFi Enhanced Mac Randomization: OFF
  ✅ Bluetooth HCI Snoop Log: OFF
  ✅ Enable Cleartext Traffic: ON
```

### **2. Debugging**
```
Settings → Developer Options → Debugging:
  ✅ USB Debugging: ON
  ✅ Wireless Debugging: ON
  ✅ WiFi Verbose Logging: ON
  ✅ Bluetooth Verbose Logging: OFF
  ✅ Show Taps: OFF
  ✅ Pointer Location: OFF
```

### **3. Apps**
```
Settings → Developer Options → Apps:
  ✅ Don't Keep Activities: OFF
  ✅ Background Process Limit: Standard Limit
  ✅ Cached App Freezer: Disabled
  ✅ Feature Flags: Default
```

### **4. Hardware**
```
Settings → Developer Options → Hardware:
  ✅ Force GPU Rendering: OFF
  ✅ Show GPU Overdraw: OFF
  ✅ Hardware Overlays: Use Hardware Overlays
  ✅ Simulate Color Space: Disabled
```

## 🔧 **ARDUINO-SPECIFIC OPTIMIZATIONS**

### **1. WiFi Connection Settings**
```
Settings → WiFi → AEROSPIN CONTROL → Advanced:
  ✅ Auto-Connect: ON
  ✅ MAC Address Type: Device MAC
  ✅ Privacy: Use Device MAC
  ✅ Metered Connection: OFF
  ✅ Proxy: None
  ✅ IP Settings: DHCP
```

### **2. Network Preferences**
```
Settings → Network → Advanced → Network Preferences:
  ✅ Turn on WiFi Automatically: ON
  ✅ Connect to Open Networks: OFF
  ✅ Network Rating Provider: OFF
  ✅ WiFi Scanning: ON
```

### **3. Location Services**
```
Settings → Location → Advanced:
  ✅ WiFi Scanning: ON
  ✅ Bluetooth Scanning: OFF
  ✅ Emergency Location Service: ON
  ✅ Google Location Accuracy: ON
```

## ⚡ **PERFORMANCE OPTIMIZATION**

### **1. System Performance**
```
Settings → Developer Options → Performance:
  ✅ Force GPU Rendering: OFF (for stability)
  ✅ GPU Rendering Profile: Off
  ✅ Hardware Overlays: Enable
  ✅ Disable HW Overlays: OFF
```

### **2. Memory Management**
```
Settings → Developer Options → Memory:
  ✅ Don't Keep Activities: OFF
  ✅ Background Process Limit: Standard
  ✅ Show All ANRs: ON (for debugging)
  ✅ Memory Optimization: OFF
```

### **3. Network Performance**
```
Settings → Developer Options → Networking:
  ✅ Cellular Data Always Active: OFF
  ✅ Aggressive WiFi to Cellular Handover: OFF
  ✅ WiFi Scan Throttling: OFF
  ✅ Mobile Data Always Active: OFF
```

## 🚨 **TROUBLESHOOTING SETTINGS**

### **1. If Connection Fails**
```
1. Settings → WiFi → Forget "AEROSPIN CONTROL"
2. Settings → Apps → AEROSPIN → Storage → Clear Cache
3. Settings → Apps → AEROSPIN → Permissions → Reset All
4. Restart Phone
5. Re-grant all permissions
6. Reconnect to "AEROSPIN CONTROL"
```

### **2. If App Crashes**
```
1. Settings → Developer Options → Show All ANRs: ON
2. Settings → Developer Options → GPU Rendering Profile: On Screen as Bars
3. Settings → Apps → AEROSPIN → Storage → Clear Data
4. Reinstall APK
```

### **3. If Slow Performance**
```
1. Settings → Developer Options → Animation Scales: 0.5x (all three)
2. Settings → Battery → AEROSPIN → Unrestricted
3. Settings → Apps → AEROSPIN → Battery → Background Activity: ON
4. Settings → Developer Options → Background Process Limit: Standard
```

## 📋 **QUICK SETUP CHECKLIST**

### **Essential Settings (Must Enable):**
- [ ] Developer Options: ON
- [ ] USB Debugging: ON
- [ ] WiFi Scan Throttling: OFF
- [ ] Battery Optimization for AEROSPIN: OFF
- [ ] Location Permission: Allow All The Time
- [ ] Background App Refresh: ON
- [ ] Cleartext Traffic: ON
- [ ] Don't Keep Activities: OFF

### **Arduino Connection Settings:**
- [ ] Connect to "AEROSPIN CONTROL" WiFi
- [ ] Set WiFi to Device MAC (not randomized)
- [ ] Disable VPN while using AEROSPIN
- [ ] Allow HTTP traffic in network security
- [ ] Grant all app permissions

### **Performance Settings:**
- [ ] Animation scales: 0.5x
- [ ] Background process limit: Standard
- [ ] Stay awake while charging: ON
- [ ] Mobile data always active: OFF

## 🎯 **FINAL VERIFICATION**

After configuring all settings:

1. **Restart your Android device**
2. **Install AEROSPIN APK**
3. **Grant all permissions when prompted**
4. **Connect to "AEROSPIN CONTROL" WiFi**
5. **Open AEROSPIN app**
6. **Check connection status in app**

If everything is configured correctly, you should see:
- ✅ "Android Connected" on Arduino LCD
- ✅ "Device Connected" in AEROSPIN app
- ✅ Response times under 5 seconds
- ✅ Successful session management

## 🔄 **RESET TO DEFAULTS**

If you need to reset developer settings:
```
Settings → Developer Options → Reset to Default
Settings → Apps → Reset App Preferences
Settings → Network → Reset Network Settings
```

**Note:** You'll need to reconfigure all settings after reset.