
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Clock } from 'lucide-react';
import { NotificationManager } from '@/components/notification-manager';

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState('21:00');
  const [alignerChangeReminderEnabled, setAlignerChangeReminderEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const settings = await response.json();
        if (settings.id) {
          setDailyReminderEnabled(settings.dailyReminderEnabled);
          setDailyReminderTime(settings.dailyReminderTime);
          setAlignerChangeReminderEnabled(settings.alignerChangeReminderEnabled);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyReminderEnabled,
          dailyReminderTime,
          alignerChangeReminderEnabled,
        }),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
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
            Notifications
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Master Notifications Toggle */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              <div>
                <p className="font-medium text-lg" style={{ color: '#3F0F22' }}>
                  Notifications
                </p>
                <p className="text-sm text-gray-500">
                  Enable or disable all notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-14 h-8 rounded-full transition-all ${
                notificationsEnabled ? 'opacity-100' : 'opacity-50'
              }`}
              style={{ backgroundColor: notificationsEnabled ? '#AF4B6C' : '#DBDBDB' }}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Show notification settings only if notifications are enabled */}
        {notificationsEnabled && (
          <>
            {/* Push Notifications */}
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#3F0F22' }}>
                Push Notifications
              </h2>
              <NotificationManager />
            </div>

            {/* Other Notification Settings */}
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#3F0F22' }}>
                Reminder Settings
              </h2>
              <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
                {/* Daily Reminder */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#3F0F22' }}>
                      Daily Reminder
                    </p>
                    <p className="text-sm text-gray-500">
                      Remind me to wear my aligners
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDailyReminderEnabled(!dailyReminderEnabled)}
                  className={`w-14 h-8 rounded-full transition-all ${
                    dailyReminderEnabled ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{ backgroundColor: dailyReminderEnabled ? '#AF4B6C' : '#DBDBDB' }}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      dailyReminderEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reminder Time */}
              {dailyReminderEnabled && (
                <div className="pl-8">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                    Reminder Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={dailyReminderTime}
                      onChange={(e) => setDailyReminderTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      
                    />
                  </div>
                </div>
              )}

              {/* Aligner Change Reminder */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#3F0F22' }}>
                      Aligner Change Reminder
                    </p>
                    <p className="text-sm text-gray-500">
                      Notify 1 day before aligner change
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAlignerChangeReminderEnabled(!alignerChangeReminderEnabled)}
                  className={`w-14 h-8 rounded-full transition-all ${
                    alignerChangeReminderEnabled ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{ backgroundColor: alignerChangeReminderEnabled ? '#AF4B6C' : '#DBDBDB' }}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      alignerChangeReminderEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full py-3 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
