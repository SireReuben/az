# iOS Build Guide for AEROSPIN Control App

## 🍎 **Complete iOS Build Process**

### **Prerequisites**
- **macOS computer** (required for iOS builds)
- **Apple Developer Account** ($99/year)
- **Xcode** installed (latest version)
- **EAS CLI** installed globally

### **Step 1: Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

### **Step 2: Login to Expo**
```bash
eas login
```

### **Step 3: Configure EAS Build**
```bash
eas build:configure
```

### **Step 4: Apple Developer Setup**
1. **Create App Identifier:**
   - Go to [Apple Developer Portal](https://developer.apple.com)
   - Navigate to Certificates, Identifiers & Profiles
   - Create new App ID: `com.aerospin.control`
   - Enable capabilities: Network Extensions, Personal VPN

2. **Create Provisioning Profile:**
   - Create Development/Distribution provisioning profile
   - Associate with your App ID and devices

### **Step 5: Build for iOS Simulator (Testing)**
```bash
eas build --platform ios --profile development
```

### **Step 6: Build for iOS Device (Production)**
```bash
eas build --platform ios --profile production
```

### **Step 7: Submit to App Store**
```bash
eas submit --platform ios
```

## 🔧 **iOS-Specific Configurations**

### **1. Network Security (Info.plist)**
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.4.1</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>1.0</string>
            <key>NSIncludesSubdomains</key>
            <false/>
        </dict>
    </dict>
</dict>
```

### **2. Location Permissions**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location to detect and connect to AEROSPIN device Wi-Fi network.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location to detect and connect to AEROSPIN device Wi-Fi network.</string>
```

### **3. Local Network Access**
```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app needs access to local network to communicate with AEROSPIN device.</string>

<key>NSBonjourServices</key>
<array>
    <string>_http._tcp</string>
</array>
```

## 📱 **iOS-Specific Features**

### **1. iOS Network Detection**
- Optimized for iOS networking stack
- Faster connection timeouts (15s vs 60s for Android)
- Native iOS network APIs integration

### **2. iOS UI Adaptations**
- Native iOS navigation patterns
- iOS-specific animations and transitions
- Support for iPhone and iPad layouts

### **3. iOS Performance Optimizations**
- Reduced polling intervals
- iOS-specific memory management
- Background app refresh handling

## 🚀 **Build Profiles**

### **Development Build**
```bash
eas build --platform ios --profile development
```
- For testing on simulator and registered devices
- Includes debugging capabilities
- Faster build times

### **Preview Build**
```bash
eas build --platform ios --profile preview
```
- For internal testing and TestFlight
- Production-like build without App Store submission

### **Production Build**
```bash
eas build --platform ios --profile production
```
- For App Store submission
- Fully optimized and signed

## 📋 **iOS Testing Checklist**

### **Before Building:**
- [ ] Apple Developer Account active
- [ ] App ID created with correct bundle identifier
- [ ] Provisioning profiles configured
- [ ] All iOS-specific permissions added
- [ ] Network security exceptions configured

### **After Building:**
- [ ] Install on iOS device/simulator
- [ ] Test WiFi connection to Arduino
- [ ] Verify location permissions work
- [ ] Test all device controls
- [ ] Check session management
- [ ] Verify offline functionality

## 🔍 **iOS-Specific Troubleshooting**

### **Build Issues:**
```bash
# Clear EAS cache
eas build:clear-cache

# Check build logs
eas build:list

# View specific build
eas build:view [build-id]
```

### **Network Issues on iOS:**
1. **Check iOS Network Settings:**
   - Settings → Privacy & Security → Local Network
   - Ensure AEROSPIN app has permission

2. **WiFi Connection:**
   - iOS may show "No Internet Connection" warning
   - This is normal for Arduino WiFi networks
   - Tap "Use Without Internet" when prompted

3. **Location Services:**
   - Settings → Privacy & Security → Location Services
   - Ensure enabled for AEROSPIN app

### **Common iOS Build Errors:**

**Error: "No provisioning profile found"**
```bash
# Solution: Configure Apple Developer account
eas device:create
eas build:configure
```

**Error: "Bundle identifier already exists"**
```bash
# Solution: Use unique bundle identifier
# Update app.json: "bundleIdentifier": "com.yourcompany.aerospin"
```

**Error: "Network request failed"**
```bash
# Solution: Check network security settings
# Ensure NSAppTransportSecurity is configured
```

## 🎯 **iOS Deployment Options**

### **1. TestFlight (Recommended for Testing)**
```bash
eas submit --platform ios --latest
```
- Internal testing with up to 100 users
- External testing with up to 10,000 users
- Automatic updates and crash reporting

### **2. App Store Connect**
- Full App Store submission
- App Review process required
- Public distribution

### **3. Enterprise Distribution**
- For internal company use only
- Requires Apple Developer Enterprise Program
- No App Store review required

## 📊 **iOS Performance Monitoring**

### **Key Metrics to Monitor:**
- App launch time
- Network connection speed
- Memory usage
- Battery consumption
- Crash reports

### **iOS Analytics:**
- Use Xcode Instruments for profiling
- Monitor network requests in Network tab
- Check memory leaks and performance

## 🔒 **iOS Security Considerations**

### **1. Code Signing**
- All iOS apps must be signed
- EAS handles signing automatically
- Certificates managed through Apple Developer Portal

### **2. App Transport Security**
- iOS blocks HTTP by default
- Arduino communication requires ATS exceptions
- Configured in Info.plist

### **3. Privacy Permissions**
- Location access required for WiFi scanning
- Local network access for Arduino communication
- Users must explicitly grant permissions

## 🎉 **Success Indicators**

### **iOS Build Successful When:**
- [ ] EAS build completes without errors
- [ ] App installs on iOS device
- [ ] Can connect to Arduino WiFi network
- [ ] Device controls respond correctly
- [ ] Session management works
- [ ] No crashes or memory leaks
- [ ] Passes iOS App Store guidelines

---

**Your AEROSPIN Control app is now ready for iOS deployment! The iOS-optimized networking and UI will provide a smooth experience for iPhone and iPad users.**