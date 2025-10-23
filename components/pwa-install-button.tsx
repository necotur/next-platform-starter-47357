
'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallButtonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function PWAInstallButton({ variant = 'default', className = '' }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  // Don't show button if app is already installed or prompt is not available
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleInstallClick}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90 flex items-center gap-2 ${className}`}
        style={{ backgroundColor: '#AF4B6C', color: 'white' }}
      >
        <Download className="w-4 h-4" />
        <span className="whitespace-nowrap">
          {language === 'ar' ? 'تثبيت' : 'Install'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2 ${className}`}
      style={{ backgroundColor: '#AF4B6C', color: 'white' }}
    >
      <Download className="w-5 h-5" />
      <span>
        {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
      </span>
    </button>
  );
}
