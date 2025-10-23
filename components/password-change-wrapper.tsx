
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChangePasswordModal } from './change-password-modal';

export function PasswordChangeWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {};
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Check if user needs to change password (used one-time password)
    if (session?.user && (session.user as any).requirePasswordChange) {
      setShowPasswordModal(true);
    }
  }, [session]);

  return (
    <>
      {children}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          // Don't allow closing without changing password
          // setShowPasswordModal(false);
        }}
        isFirstTimeChange={true}
      />
    </>
  );
}
