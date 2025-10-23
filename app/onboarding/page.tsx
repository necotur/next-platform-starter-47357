
'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Package, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

const ALIGNER_INTERVALS = [7, 10, 14];

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [totalAligners, setTotalAligners] = useState('');
  const [alignerChangeInterval, setAlignerChangeInterval] = useState(14);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/treatment-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate || new Date().toISOString(),
          totalAligners: parseInt(totalAligners) || 20,
          alignerChangeInterval,
          dailyWearTimeGoal: 22,
        }),
      });

      if (response.ok) {
        // Also create notification settings
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dailyReminderEnabled: true,
            dailyReminderTime: '21:00',
            alignerChangeReminderEnabled: true,
          }),
        });

        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to save treatment plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return startDate !== '';
    if (step === 2) return totalAligners !== '' && parseInt(totalAligners) > 0;
    if (step === 3) return alignerChangeInterval > 0;
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block rounded-lg p-3 mb-4" style={{ backgroundColor: '#3F0F22' }}>
            <div className="text-4xl">🎯</div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#3F0F22' }}>
            {t.onboarding.setupTitle}
          </h1>
          <p className="text-gray-600">{t.onboarding.setupSubtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Progress indicator */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                      s <= step ? 'opacity-100' : 'opacity-30'
                    }`}
                    style={{ backgroundColor: '#AF4B6C' }}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        s < step ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{ backgroundColor: '#AF4B6C' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Start Date */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6" style={{ color: '#AF4B6C' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                  {t.onboarding.step1Title}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t.onboarding.step1Subtitle}
              </p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-lg"
                
              />
            </div>
          )}

          {/* Step 2: Total Aligners */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6" style={{ color: '#AF4B6C' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                  {t.onboarding.step2Title}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t.onboarding.step2Subtitle}
              </p>
              <input
                type="number"
                value={totalAligners}
                onChange={(e) => setTotalAligners(e.target.value)}
                min="1"
                placeholder={t.onboarding.placeholderAligners}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-lg"
                
              />
            </div>
          )}

          {/* Step 3: Change Interval */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6" style={{ color: '#AF4B6C' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                  {t.onboarding.step3Title}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t.onboarding.step3Subtitle}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {ALIGNER_INTERVALS.map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setAlignerChangeInterval(interval)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      alignerChangeInterval === interval
                        ? 'border-opacity-100 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: alignerChangeInterval === interval ? '#AF4B6C' : undefined,
                      backgroundColor: alignerChangeInterval === interval ? '#FFF5F8' : 'white',
                    }}
                  >
                    <div className="text-3xl font-bold mb-1" style={{ color: '#3F0F22' }}>
                      {interval}
                    </div>
                    <div className="text-sm text-gray-600">{t.onboarding.daysLabel}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-lg border-2 font-medium transition-all duration-200 hover:opacity-80"
                style={{ borderColor: '#AF4B6C', color: '#AF4B6C' }}
              >
                {t.onboarding.backButton}
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {t.onboarding.continueButton}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.onboarding.settingUpMessage}
                  </>
                ) : (
                  t.onboarding.getStartedButton
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
