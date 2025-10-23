
'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/language-context';
import { PasswordChangeWrapper } from '@/components/password-change-wrapper';
import { CapacitorProvider } from '@/components/capacitor-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { ReactNode, useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      <CapacitorProvider>
        <LanguageProvider>
          <NotificationProvider>
            <PasswordChangeWrapper>
              {children}
            </PasswordChangeWrapper>
          </NotificationProvider>
        </LanguageProvider>
      </CapacitorProvider>
    </SessionProvider>
  );
}
