
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Package, RefreshCw } from 'lucide-react';

const ALIGNER_INTERVALS = [7, 10, 14];

export default function TreatmentSettingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [startDate, setStartDate] = useState('');
  const [totalAligners, setTotalAligners] = useState('');
  const [currentAligner, setCurrentAligner] = useState('');
  const [alignerChangeInterval, setAlignerChangeInterval] = useState(14);
  const [dailyWearTimeGoal, setDailyWearTimeGoal] = useState(22);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTreatmentPlan();
    }
  }, [status, router]);

  const fetchTreatmentPlan = async () => {
    try {
      const response = await fetch('/api/treatment-plan');
      if (response.ok) {
        const plan = await response.json();
        if (plan.id) {
          setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
          setTotalAligners(plan.totalAligners.toString());
          setCurrentAligner(plan.currentAlignerNumber.toString());
          setAlignerChangeInterval(plan.alignerChangeInterval);
          setDailyWearTimeGoal(plan.dailyWearTimeGoal);
        }
      }
    } catch (error) {
      console.error('Failed to fetch treatment plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      await fetch('/api/treatment-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          totalAligners: parseInt(totalAligners),
          currentAlignerNumber: parseInt(currentAligner),
          alignerChangeInterval,
          dailyWearTimeGoal,
        }),
      });
      
      router.back();
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
            Treatment Plan
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              Treatment Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                Total Aligners
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={totalAligners}
                  onChange={(e) => setTotalAligners(e.target.value)}
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                Current Aligner
              </label>
              <div className="relative">
                <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={currentAligner}
                  onChange={(e) => setCurrentAligner(e.target.value)}
                  min="1"
                  max={totalAligners}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              Aligner Change Interval (days)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGNER_INTERVALS.map((interval) => (
                <button
                  key={interval}
                  onClick={() => setAlignerChangeInterval(interval)}
                  className={`py-3 rounded-lg border-2 transition-all ${
                    alignerChangeInterval === interval ? 'border-opacity-100' : 'border-gray-200'
                  }`}
                  style={{
                    borderColor: alignerChangeInterval === interval ? '#AF4B6C' : undefined,
                    backgroundColor: alignerChangeInterval === interval ? '#FFF5F8' : 'white',
                  }}
                >
                  <div className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                    {interval}
                  </div>
                  <div className="text-xs text-gray-600">days</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              Daily Wear Time Goal (hours)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={dailyWearTimeGoal}
                onChange={(e) => setDailyWearTimeGoal(parseInt(e.target.value))}
                min="18"
                max="24"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Recommended: 22 hours per day</p>
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
      </main>
    </div>
  );
}
