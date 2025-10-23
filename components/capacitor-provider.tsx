'use client';

import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { isNativePlatform, isAndroid, isIOS } from '@/lib/capacitor';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  // Initialize push notifications
  const { isRegistered, error: pushError } = usePushNotifications();
  
  useEffect(() => {
    if (isRegistered) {
      console.log('✅ Push notifications successfully registered');
    }
    if (pushError) {
      console.error('❌ Push notification error:', pushError);
    }
  }, [isRegistered, pushError]);

  useEffect(() => {
    if (!isNativePlatform()) {
      return;
    }

    // Initialize native features
    const initializeCapacitor = async () => {
      try {
        // Configure Status Bar
        if (isAndroid() || isIOS()) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#AF4B6C' });
        }

        // Hide splash screen after initialization
        await SplashScreen.hide();

        // Listen to app state changes
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          console.log('App state changed. Is active:', isActive);
        });

        // Listen to back button on Android
        if (isAndroid()) {
          CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              CapacitorApp.exitApp();
            } else {
              window.history.back();
            }
          });
        }

        // Listen to app URL open events (for deep linking)
        CapacitorApp.addListener('appUrlOpen', (data) => {
          console.log('App opened with URL:', data);
        });

        // Monitor network status
        Network.addListener('networkStatusChange', (status) => {
          if (!status.connected) {
            toast.error('No internet connection');
          } else if (status.connected && status.connectionType !== 'none') {
            toast.success('Internet connection restored');
          }
        });

      } catch (error) {
        console.error('Error initializing Capacitor:', error);
      }
    };

    initializeCapacitor();

    // Cleanup listeners on unmount
    return () => {
      CapacitorApp.removeAllListeners();
      Network.removeAllListeners();
    };
  }, []);

  return <>{children}</>;
}
