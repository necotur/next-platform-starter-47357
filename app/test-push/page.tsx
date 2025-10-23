
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export default function TestPushPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleTestNotification = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-notification');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to send test notification');
        setResult(data);
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Push Notification Test</h1>
          <p className="text-muted-foreground mt-2">
            Test your push notification setup and view diagnostic information
          </p>
        </div>

        {/* Platform Warning for Browser */}
        {!isNative && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ You're testing in a web browser
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Push notifications only work on <strong>native Android/iOS builds</strong>, not in web browsers.
                </p>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  <p className="font-medium mb-1">To test push notifications properly:</p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Build the native Android app</li>
                    <li>Install it on your Android device</li>
                    <li>Login to the app</li>
                    <li>Return to this test page on the native app</li>
                  </ol>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  <strong>Instructions:</strong> Build the Android app using: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">yarn build && npx cap sync android && npx cap open android</code>
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Platform Status */}
        <Card className={isNative ? 'border-green-500' : 'border-gray-300'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Platform Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Platform</p>
                <p className="text-lg font-semibold">
                  {isNative ? '✅ Native Mobile App' : '🌐 Web Browser'}
                </p>
              </div>
              <Badge variant={isNative ? 'default' : 'secondary'}>
                {isNative ? 'FCM Available' : 'FCM Not Available'}
              </Badge>
            </div>
            {!isNative && (
              <p className="mt-3 text-sm text-muted-foreground">
                Firebase Cloud Messaging requires a native app build. The browser does not support Capacitor's Firebase plugin.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Send Test Notification
            </CardTitle>
            <CardDescription>
              Click the button below to send a test notification to your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTestNotification}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Test Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Test Successful
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Test Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.message && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}

              {result.diagnostics && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Diagnostic Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-mono text-sm">{result.diagnostics.userId}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Firebase Configured</p>
                      <Badge variant={result.diagnostics.firebaseConfigured ? 'default' : 'destructive'}>
                        {result.diagnostics.firebaseConfigured ? 'Yes' : 'No'}
                      </Badge>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Timestamp</p>
                      <p className="font-mono text-sm">{result.diagnostics.timestamp}</p>
                    </div>
                  </div>

                  {result.diagnostics.tokens && (
                    <div>
                      <h4 className="font-semibold mb-2">FCM Tokens</h4>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm mb-2">
                          <strong>Count:</strong> {result.diagnostics.tokens.count}
                        </p>
                        {result.diagnostics.tokens.count === 0 ? (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              No FCM tokens found! Make sure:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>You're using the mobile app (not web browser)</li>
                                <li>You've granted notification permissions</li>
                                <li>The app has successfully registered with FCM</li>
                                <li>Check the app logs for registration errors</li>
                              </ul>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {result.diagnostics.tokens.tokens.map((token: any, idx: number) => (
                              <div key={idx} className="bg-background p-3 rounded border">
                                <p className="text-sm"><strong>Platform:</strong> {token.platform}</p>
                                <p className="text-sm"><strong>Token:</strong> {token.token}</p>
                                <p className="text-sm"><strong>Created:</strong> {new Date(token.createdAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {result.diagnostics.notificationResult && (
                    <div>
                      <h4 className="font-semibold mb-2">Notification Results</h4>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm">
                          <strong>Sent:</strong> {result.diagnostics.notificationResult.sent} / {result.diagnostics.notificationResult.total}
                        </p>
                        {result.diagnostics.notificationResult.results.map((res: any, idx: number) => (
                          <div key={idx} className="mt-2 p-2 bg-background rounded border">
                            <p className="text-sm">
                              <strong>Token:</strong> {res.token}
                            </p>
                            <p className="text-sm">
                              <strong>Status:</strong>{' '}
                              <Badge variant={res.success ? 'default' : 'destructive'}>
                                {res.success ? 'Success' : 'Failed'}
                              </Badge>
                            </p>
                            {res.messageId && (
                              <p className="text-sm"><strong>Message ID:</strong> {res.messageId}</p>
                            )}
                            {res.error && (
                              <p className="text-sm text-red-600"><strong>Error:</strong> {res.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.diagnostics.notificationError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold">Notification Error:</p>
                        <p className="mt-1">{result.diagnostics.notificationError.message}</p>
                        {result.diagnostics.notificationError.code && (
                          <p className="mt-1 text-sm">Code: {result.diagnostics.notificationError.code}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Make sure you're using the installed mobile app, not a web browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Check that notification permissions are granted in Android Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Disable battery optimization for the app in Android Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Ensure Google Play Services is installed and up to date</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Check that you have an active internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Open Chrome DevTools (chrome://inspect) to view app console logs</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
