
'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div 
        className="rounded-xl shadow-2xl p-4 backdrop-blur-lg"
        style={{ 
          background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)',
        }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FFF5F8' }}
          >
            <Download className="w-6 h-6" style={{ color: '#AF4B6C' }} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1">
              {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
            </h3>
            <p className="text-sm text-white/80 mb-3">
              {language === 'ar' 
                ? 'احصل على تجربة أفضل مع التطبيق على شاشتك الرئيسية'
                : 'Get a better experience with the app on your home screen'}
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#AF4B6C', color: 'white' }}
            >
              <Download className="w-4 h-4" />
              <span>
                {language === 'ar' ? 'تثبيت الآن' : 'Install Now'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
