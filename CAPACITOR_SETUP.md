# Capacitor Setup Guide for Seamless Smile Tracker

This guide explains how to build and run the Seamless Smile Tracker app on Android and iOS devices using Capacitor.

## Prerequisites

### For Android Development
- Java Development Kit (JDK) 17 or higher
- Android Studio (latest version recommended)
- Android SDK (API level 33 or higher)
- Gradle (usually included with Android Studio)

### For iOS Development (macOS only)
- Xcode 14 or higher
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator or physical iOS device

## Initial Setup

The app has already been configured with Capacitor. The following components are set up:

- **Capacitor Core**: Base functionality
- **Capacitor Android**: Android platform support
- **Capacitor iOS**: iOS platform support
- **Plugins**:
  - App: App lifecycle events
  - Camera: Access device camera and photo library
  - Filesystem: File operations
  - Status Bar: Status bar customization
  - Splash Screen: Launch screen management
  - Network: Network connectivity monitoring
  - Push Notifications: Push notification support
  - Local Notifications: Local notification support

## Build Commands

### Build for All Platforms
```bash
yarn build:capacitor
```
This builds the Next.js app in static export mode and syncs with all Capacitor platforms.

### Build for Android
```bash
yarn build:android
```
This builds the Next.js app and opens Android Studio for further development.

### Build for iOS
```bash
yarn build:ios
```
This builds the Next.js app and opens Xcode for further development.

## Development Workflow

### 1. Web Development (Recommended First Step)
Develop and test features in the browser first:
```bash
yarn dev
```
Visit `http://localhost:3000` to test your changes.

### 2. Testing on Native Platforms

#### Option A: Point to Local Dev Server (Live Reload)
This is the fastest way to test during development:

1. Find your computer's local IP address:
   - **macOS/Linux**: `ifconfig | grep inet`
   - **Windows**: `ipconfig`

2. Edit `capacitor.config.ts` and uncomment these lines:
   ```typescript
   server: {
     url: 'http://YOUR_LOCAL_IP:3000',  // Replace with your IP
     cleartext: true
   }
   ```

3. Rebuild and run:
   ```bash
   yarn dev  # Keep this running
   yarn cap:sync:android  # Or cap:sync:ios
   yarn cap:open:android  # Or cap:open:ios
   ```

4. Any changes you make will be reflected immediately on the device!

#### Option B: Build Static Version
For production-like testing:

1. Comment out the server URL in `capacitor.config.ts`
2. Build the static version:
   ```bash
   yarn build:android  # Or build:ios
   ```

### 3. Running on Android

1. **First Time Setup**:
   - Open Android Studio
   - Install any SDK updates if prompted
   - Create a virtual device (AVD) or connect a physical device
   - Enable USB debugging on physical device

2. **Build and Run**:
   ```bash
   yarn build:android
   ```
   This will:
   - Build the Next.js app as static files
   - Sync files to the Android project
   - Open Android Studio

3. **In Android Studio**:
   - Wait for Gradle sync to complete
   - Select your device/emulator from the dropdown
   - Click the "Run" button (green triangle)

### 4. Running on iOS (macOS only)

1. **First Time Setup**:
   - Open Xcode
   - Configure signing & capabilities
   - Add your Apple Developer account
   - Select a development team

2. **Build and Run**:
   ```bash
   yarn build:ios
   ```
   This will:
   - Build the Next.js app as static files
   - Sync files to the iOS project
   - Open Xcode

3. **In Xcode**:
   - Select your device/simulator from the dropdown
   - Click the "Run" button (play icon)

## Capacitor Sync

When you make changes to:
- Native plugin configuration
- Capacitor config
- Web assets

Run sync to update the native projects:
```bash
yarn cap:sync          # Sync all platforms
yarn cap:sync:android  # Sync Android only
yarn cap:sync:ios      # Sync iOS only
```

## Using Native Features in Code

### Check if Running Native
```typescript
import { isNativePlatform, isAndroid, isIOS } from '@/lib/capacitor';

if (isNativePlatform()) {
  // Running on Android or iOS
}

if (isAndroid()) {
  // Android-specific code
}

if (isIOS()) {
  // iOS-specific code
}
```

### Use Native Camera
```typescript
import { useNativeCamera } from '@/hooks/use-native-camera';

function MyComponent() {
  const { takePhoto, pickPhoto, isLoading } = useNativeCamera();

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo) {
      // photo is a data URL
      console.log(photo);
    }
  };

  return (
    <button onClick={handleTakePhoto} disabled={isLoading}>
      Take Photo
    </button>
  );
}
```

### Access Other Capacitor Plugins
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';

// Status Bar
await StatusBar.setStyle({ style: Style.Dark });

// Network status
const status = await Network.getStatus();
console.log('Network status:', status.connected);

// And so on...
```

## Troubleshooting

### Android Issues

**Gradle Build Fails**:
- Open Android Studio
- File → Invalidate Caches and Restart
- Try cleaning: `cd android && ./gradlew clean`

**App Not Installing**:
- Check if USB debugging is enabled
- Run `adb devices` to verify device connection
- Try uninstalling the old version first

**Plugin Not Working**:
- Check if permissions are added in `android/app/src/main/AndroidManifest.xml`
- Run `yarn cap:sync:android`

### iOS Issues

**Code Signing Error**:
- Open Xcode → Preferences → Accounts
- Add your Apple ID
- Select your team in the project settings

**Pods Installation Fails**:
```bash
cd ios
pod deintegrate
pod install
```

**Plugin Not Working**:
- Check if permissions are added in `ios/App/Info.plist`
- Run `yarn cap:sync:ios`

### General Issues

**White Screen on Launch**:
- Check browser console in Chrome DevTools (inspect the WebView)
- Verify all API routes return proper responses
- Check for JavaScript errors

**API Calls Failing**:
- Ensure your API endpoints use absolute URLs
- Check CORS settings on your backend
- For local dev, make sure server URL is correct

## Production Build Checklist

Before releasing to app stores:

### Android
1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 1
   versionName "1.0.0"
   ```

2. Generate signed APK/AAB:
   - Build → Generate Signed Bundle/APK
   - Follow the wizard to create/use keystore

3. Test on multiple devices/API levels

### iOS
1. Update version in Xcode:
   - Select project → General → Identity
   - Update Version and Build number

2. Configure app signing:
   - Select project → Signing & Capabilities
   - Enable "Automatically manage signing"

3. Archive and submit:
   - Product → Archive
   - Upload to App Store Connect

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## Configuration Files

- **capacitor.config.ts**: Main Capacitor configuration
- **android/**: Android native project
- **ios/**: iOS native project
- **out/**: Built static files (gitignored)

## Environment Variables

When building for Capacitor, use the `.env` file at the app root. Note:
- Next.js only exposes env vars prefixed with `NEXT_PUBLIC_` to the client
- For Capacitor builds, ensure all client-side env vars use this prefix

## Known Limitations

- Server-side features (SSR, API routes) don't work in Capacitor builds
- All pages must be static exports
- Dynamic routing requires careful handling
- Auth tokens/session management needs native storage solutions
