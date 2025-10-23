

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Clock, TrendingUp, Award, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { PWAInstallButton } from '@/components/pwa-install-button';

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)',
          minHeight: '60vh'
        }}
      >
        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              language === 'en'
                ? 'bg-white text-[#3F0F22] shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              language === 'ar'
                ? 'bg-white text-[#3F0F22] shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            ع
          </button>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-[512px] h-64">
              <Image
                src="/logo1v.png"
                alt="Seamless Smile"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t.landing.trackYourSmile} <span style={{ color: '#AF4B6C' }}>{t.landing.perfectSmile}</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {t.landing.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 rounded-xl font-medium text-lg shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: '#AF4B6C', color: 'white' }}
            >
              {t.landing.getStartedFree}
            </Link>
            
            <Link
              href="/auth/signin"
              className="px-8 py-4 rounded-xl font-medium text-lg border-2 border-white text-white hover:bg-white/10 transition-all"
            >
              {t.landing.signIn}
            </Link>

            <PWAInstallButton variant="compact" className="sm:ml-2" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#3F0F22' }}>
            {t.landing.everythingYouNeed}
          </h2>
          <p className="text-gray-600">
            {t.landing.comprehensiveTools}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Camera className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
              {t.landing.progressPhotos}
            </h3>
            <p className="text-sm text-gray-600">
              {t.landing.progressPhotosDesc}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Clock className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
              {t.landing.wearTimeTracking}
            </h3>
            <p className="text-sm text-gray-600">
              {t.landing.wearTimeTrackingDesc}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
              {t.landing.symptomLogger}
            </h3>
            <p className="text-sm text-gray-600">
              {t.landing.symptomLoggerDesc}
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFF5F8' }}
            >
              <Award className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
              {t.landing.achievements}
            </h3>
            <p className="text-sm text-gray-600">
              {t.landing.achievementsDesc}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div 
          className="rounded-3xl p-12 text-center"
          style={{ 
            background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)'
          }}
        >
          <Sparkles className="w-16 h-16 mx-auto mb-6 text-white" />
          <h2 className="text-3xl font-bold text-white mb-4">
            {t.landing.startYourJourneyToday}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {t.landing.joinThousands}
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 rounded-xl font-medium text-lg shadow-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: '#AF4B6C', color: 'white' }}
          >
            {t.landing.createFreeAccount}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-screen-xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 Seamless Smile Tracker. {t.landing.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
}

