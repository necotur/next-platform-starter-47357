
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle, XCircle, Send, RefreshCw, Smartphone, AlertCircle, Globe } from 'lucide-react';
import { isNativePlatform, getPlatform } from '@/lib/capacitor';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Device } from '@capacitor/device';
import { toast } from 'sonner';
import { useWebPushNotifications } from '@/hooks/use-web-push-notifications';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'success';
  message: string;
}

export default function TestNotificationsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  // Web Push hook
  const webPush = useWebPushNotifications();
  
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sending, setSending] = useState(false);
  
  // Web Push state
  const [webPushSubscriptionCount, setWebPushSubscriptionCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      checkNotificationStatus();
    }
  }, [status, router]);

  const addLog = (level: 'info' | 'error' | 'success', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, level, message }]);
    console.log(`[Test Notifications] ${level.toUpperCase()}: ${message}`);
  };

  const checkWebPushSubscription = async () => {
    try {
      addLog('info', 'Checking Web Push subscription...');
      const response = await fetch('/api/web-push/check-subscription');
      if (response.ok) {
        const data = await response.json();
        setWebPushSubscriptionCount(data.count);
        if (data.isSubscribed) {
          addLog('success', `Web Push subscribed (${data.count} subscription(s))`);
        } else {
          addLog('info', 'Web Push not subscribed');
        }
      }
    } catch (err: any) {
      addLog('error', `Failed to check Web Push subscription: ${err.message}`);
    }
  };

  const checkNotificationStatus = async () => {
    setLoading(true);
    addLog('info', 'Checking notification status...');

    // Check Web Push subscription (works on all browsers)
    await checkWebPushSubscription();

    try {
      // Check if native platform
      const isNative = isNativePlatform();
      const platform = getPlatform();
      addLog('info', `Platform: ${platform} (Native: ${isNative})`);

      if (!isNative) {
        addLog('info', 'PWA mode detected. Using Web Push for notifications.');
        setLoading(false);
        return;
      }

      // Get device info
      try {
        const info = await Device.getInfo();
        const id = await Device.getId();
        const deviceData = {
          model: info.model,
          platform: info.platform,
          osVersion: info.osVersion,
          manufacturer: info.manufacturer,
          deviceId: id.identifier,
        };
        setDeviceInfo(deviceData);
        addLog('success', `Device: ${deviceData.manufacturer} ${deviceData.model} (${deviceData.platform} ${deviceData.osVersion})`);
      } catch (err: any) {
        addLog('error', `Failed to get device info: ${err.message}`);
      }

      // Check permission status
      try {
        const permission = await FirebaseMessaging.checkPermissions();
        setPermissionStatus(permission.receive);
        addLog('info', `Permission status: ${permission.receive}`);

        if (permission.receive !== 'granted') {
          addLog('error', 'Push notification permission not granted');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        addLog('error', `Failed to check permissions: ${err.message}`);
        setLoading(false);
        return;
      }

      // Get FCM token
      try {
        const { token } = await FirebaseMessaging.getToken();
        setFcmToken(token);
        addLog('success', `FCM Token obtained (${token.length} characters)`);
        addLog('info', `Token preview: ${token.substring(0, 50)}...`);
      } catch (err: any) {
        addLog('error', `Failed to get FCM token: ${err.message}`);
        setLoading(false);
        return;
      }

      // Check if token is registered in database
      try {
        const response = await fetch('/api/fcm/check-registration');
        if (response.ok) {
          const data = await response.json();
          setIsRegistered(data.isRegistered);
          if (data.isRegistered) {
            addLog('success', 'Token is registered in database');
            addLog('info', `Registered on: ${new Date(data.registeredAt).toLocaleString()}`);
          } else {
            addLog('error', 'Token is NOT registered in database');
          }
        } else {
          addLog('error', 'Failed to check token registration status');
        }
      } catch (err: any) {
        addLog('error', `Error checking registration: ${err.message}`);
      }

    } catch (error: any) {
      addLog('error', `Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      addLog('info', 'Requesting notification permissions...');
      const permission = await FirebaseMessaging.requestPermissions();
      setPermissionStatus(permission.receive);
      
      if (permission.receive === 'granted') {
        addLog('success', 'Permission granted!');
        await checkNotificationStatus();
      } else {
        addLog('error', `Permission ${permission.receive}`);
      }
    } catch (err: any) {
      addLog('error', `Failed to request permission: ${err.message}`);
    }
  };

  const registerToken = async () => {
    if (!fcmToken) {
      addLog('error', 'No FCM token available');
      return;
    }

    try {
      addLog('info', 'Registering token with server...');
      const platform = getPlatform();
      
      const response = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fcmToken,
          platform,
          deviceInfo: JSON.stringify(deviceInfo),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addLog('success', 'Token registered successfully!');
        setIsRegistered(true);
        toast.success('Token registered');
      } else {
        const error = await response.json();
        addLog('error', `Registration failed: ${JSON.stringify(error)}`);
        toast.error('Registration failed');
      }
    } catch (err: any) {
      addLog('error', `Error registering token: ${err.message}`);
      toast.error('Registration failed');
    }
  };

  const sendTestNotification = async () => {
    setSending(true);
    addLog('info', 'Sending test notification...');

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        addLog('success', `Test notification sent! ${data.message}`);
        toast.success('Test notification sent!', {
          description: 'Check your device notifications',
        });
      } else {
        const error = await response.json();
        addLog('error', `Failed to send: ${error.message || JSON.stringify(error)}`);
        toast.error('Failed to send notification');
      }
    } catch (err: any) {
      addLog('error', `Error sending notification: ${err.message}`);
      toast.error('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
            Test Push Notifications
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Status Overview */}
        <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              Notification Status
            </h2>
          </div>

          <div className="space-y-3">
            {/* Platform Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Platform</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isNativePlatform() ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isNativePlatform() ? getPlatform() : 'PWA (Web)'}
              </span>
            </div>

            {/* Permission Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Permission</span>
              </div>
              <div className="flex items-center gap-2">
                {permissionStatus === 'granted' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  permissionStatus === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {permissionStatus}
                </span>
              </div>
            </div>

            {/* Token Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">FCM Token</span>
              </div>
              <div className="flex items-center gap-2">
                {fcmToken ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  fcmToken ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {fcmToken ? 'Available' : 'Not available'}
                </span>
              </div>
            </div>

            {/* Registration Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">FCM Registration</span>
              </div>
              <div className="flex items-center gap-2">
                {isRegistered ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isRegistered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isRegistered ? 'Registered' : 'Not registered'}
                </span>
              </div>
            </div>

            {/* Web Push Status */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Web Push (PWA)</span>
              </div>
              <div className="flex items-center gap-2">
                {webPush.isSubscribed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : webPush.isSupported ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  webPush.isSubscribed 
                    ? 'bg-green-100 text-green-700' 
                    : webPush.isSupported 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {webPush.isSubscribed 
                    ? 'Active' 
                    : webPush.isSupported 
                    ? 'Not subscribed'
                    : 'Not supported'}
                </span>
              </div>
            </div>
          </div>

          {/* FCM Token Display */}
          {fcmToken && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Your FCM Token:</div>
              <div className="p-2 bg-white rounded border border-gray-200 text-xs font-mono break-all text-gray-600">
                {fcmToken}
              </div>
            </div>
          )}

          {/* Device Info */}
          {deviceInfo && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Device Information:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Model:</div>
                <div className="font-medium text-gray-900">{deviceInfo.model}</div>
                <div className="text-gray-600">Platform:</div>
                <div className="font-medium text-gray-900">{deviceInfo.platform}</div>
                <div className="text-gray-600">OS Version:</div>
                <div className="font-medium text-gray-900">{deviceInfo.osVersion}</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isNativePlatform() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>PWA Mode Detected:</strong> You're running the app as a Progressive Web App. 
                  Web Push notifications are {webPush.isSupported ? 'supported ✓' : 'not supported on this browser ✗'} 
                  {webPush.isSupported && ' and work on modern Android and iOS (16.4+) browsers.'}
                </div>
              </div>
            </div>
          )}

          {/* Web Push: Request Permission Button */}
          {!isNativePlatform() && webPush.isSupported && webPush.permission !== 'granted' && (
            <button
              onClick={webPush.requestPermission}
              className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              <Bell className="w-5 h-5" />
              Enable Web Push Notifications
            </button>
          )}

          {/* Web Push: Test Notification Button */}
          {!isNativePlatform() && webPush.isSubscribed && (
            <button
              onClick={sendTestNotification}
              disabled={sending}
              className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {sending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sending ? 'Sending...' : 'Send Test Web Push'}
            </button>
          )}

          {/* Native: Request Permission Button */}
          {permissionStatus !== 'granted' && isNativePlatform() && (
            <button
              onClick={requestPermission}
              className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              <Bell className="w-5 h-5" />
              Request Permission
            </button>
          )}

          {!isRegistered && fcmToken && (
            <button
              onClick={registerToken}
              className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              <CheckCircle className="w-5 h-5" />
              Register Token
            </button>
          )}

          {isRegistered && fcmToken && (
            <button
              onClick={sendTestNotification}
              disabled={sending}
              className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {sending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sending ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}

          <button
            onClick={checkNotificationStatus}
            className="w-full py-3 rounded-lg border-2 font-medium flex items-center justify-center gap-2"
            style={{ borderColor: '#AF4B6C', color: '#AF4B6C' }}
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Status
          </button>
        </div>

        {/* Debug Logs */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              Debug Logs
            </h2>
            <button
              onClick={clearLogs}
              className="text-sm px-3 py-1 rounded-lg hover:bg-gray-100 transition-all"
              style={{ color: '#AF4B6C' }}
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No logs yet. Perform an action to see debug information.
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    log.level === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : log.level === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-gray-50 text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
