# EAS Build Profiles: Production vs Preview

## 🎯 **Quick Summary**

| Aspect | **Production** | **Preview** |
|--------|----------------|-------------|
| **Purpose** | App Store submission | Internal testing |
| **Distribution** | Public (App Store/Play Store) | Internal (TestFlight/Internal) |
| **Signing** | Distribution certificates | Development/Ad-hoc certificates |
| **Optimization** | Fully optimized | Optimized but debuggable |
| **Bundle Size** | Smallest possible | Slightly larger |
| **Debug Info** | Stripped | Included for testing |
| **Build Time** | Longer (full optimization) | Faster |

## 🏗️ **Production Profile**

### **Purpose:**
- **App Store submission** (iOS App Store, Google Play Store)
- **Public distribution** to end users
- **Final release builds**

### **Characteristics:**
```json
"production": {
  "ios": {
    "buildConfiguration": "Release"
  },
  "android": {
    "buildType": "apk"
  }
}
```

### **What Happens:**
- ✅ **Full optimization** - Code is heavily optimized for performance
- ✅ **Minification** - JavaScript is minified and obfuscated
- ✅ **Tree shaking** - Unused code is removed
- ✅ **Distribution signing** - Uses distribution certificates
- ✅ **Smallest bundle size** - Maximum compression applied
- ✅ **Debug info stripped** - No debugging symbols included
- ✅ **Production environment** - Uses production API endpoints

### **Use Cases:**
- Final app submission to stores
- Public release to users
- When you need the smallest, fastest app

## 🧪 **Preview Profile**

### **Purpose:**
- **Internal testing** and QA
- **TestFlight distribution** (iOS)
- **Internal app sharing** (Android)
- **Stakeholder reviews**

### **Characteristics:**
```json
"preview": {
  "distribution": "internal",
  "ios": {
    "simulator": false,
    "buildConfiguration": "Release"
  },
  "android": {
    "buildType": "apk"
  }
}
```

### **What Happens:**
- ✅ **Optimized but debuggable** - Good performance with debugging capability
- ✅ **Internal distribution** - Uses development/ad-hoc certificates
- ✅ **Faster builds** - Less aggressive optimization
- ✅ **Debug symbols included** - Easier to debug issues
- ✅ **Staging environment** - Can use staging API endpoints
- ✅ **Crash reporting** - Better error reporting for testing

### **Use Cases:**
- Testing before App Store submission
- Internal team testing
- Client/stakeholder demos
- QA and bug testing

## 📱 **For Your AEROSPIN App**

### **For Arduino Communication Testing:**

**Use Preview Profile:**
```bash
eas build --platform android --profile preview
```

**Why Preview is Better for Testing:**
- ✅ **Faster builds** - Get APK quicker for testing
- ✅ **Better debugging** - Can see detailed error logs
- ✅ **Crash reporting** - Easier to identify Arduino connection issues
- ✅ **Internal distribution** - Easy to share with team

### **For Final Release:**

**Use Production Profile:**
```bash
eas build --platform android --profile production
```

**Why Production for Release:**
- ✅ **Smallest size** - Better user experience
- ✅ **Best performance** - Optimized for end users
- ✅ **Store ready** - Proper signing for distribution
- ✅ **Security** - Debug info removed

## 🔧 **Your Current EAS Configuration**

Looking at your `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 🎯 **Recommendations for AEROSPIN**

### **For Arduino Connection Testing:**
```bash
# Use preview for faster testing cycles
eas build --platform android --profile preview
```

**Benefits:**
- Faster build times (10-15 minutes vs 20-30 minutes)
- Better error reporting for Arduino connection issues
- Easier to debug cleartext traffic problems
- Can iterate quickly on fixes

### **For Final Distribution:**
```bash
# Use production for end users
eas build --platform android --profile production
```

**Benefits:**
- Smallest APK size
- Best performance for Arduino communication
- Ready for Google Play Store (if desired)
- Maximum optimization

## 🚀 **Build Commands Summary**

```bash
# Quick testing (recommended for Arduino debugging)
eas build --platform android --profile preview

# Final release
eas build --platform android --profile production

# iOS builds (recommended alternative)
eas build --platform ios --profile preview    # Testing
eas build --platform ios --profile production # App Store
```

## 💡 **Pro Tips**

1. **Start with Preview** - Always test with preview builds first
2. **Production for Final** - Only use production when ready to release
3. **iOS Alternative** - Consider iOS builds for better Arduino connectivity
4. **Cleartext Testing** - Preview builds are better for debugging cleartext issues

## 🎉 **For Your Current Situation**

Since you're debugging Arduino connection issues:

**Recommended approach:**
1. **Build with Preview** - `eas build --platform android --profile preview`
2. **Test cleartext configuration** - Use the AndroidCleartextDiagnostics component
3. **Debug connection issues** - Better error reporting in preview builds
4. **Switch to Production** - Only after confirming everything works

This will give you faster iteration cycles while debugging the Arduino communication issues!