
'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useSession } from 'next-auth/react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTimeChange?: boolean;
}

export function ChangePasswordModal({ isOpen, onClose, isFirstTimeChange = false }: ChangePasswordModalProps) {
  const { t } = useLanguage();
  const { data: session } = useSession() || {};
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t.settings?.passwordMismatch || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError(t.settings?.passwordTooShort || 'Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: isFirstTimeChange ? undefined : currentPassword,
          newPassword,
          isFirstTimeChange,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      // Success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // If first time change, sign out and redirect to sign in page
      if (isFirstTimeChange) {
        // Sign out and redirect to login with success message
        await signOut({ redirect: false });
        window.location.href = '/auth/signin?passwordChanged=true';
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isFirstTimeChange ? undefined : onClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={isFirstTimeChange ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#3F0F22' }}>
            <Lock className="w-5 h-5" />
            {isFirstTimeChange ? t.settings?.setNewPassword : t.settings?.changePassword}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isFirstTimeChange && (
            <div className="text-sm text-gray-600 p-3 rounded-lg" style={{ backgroundColor: '#FFF5F8' }}>
              {t.settings?.firstTimePasswordMessage || 'Please set a new password for your account.'}
            </div>
          )}

          {!isFirstTimeChange && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t.settings?.currentPassword}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t.settings?.newPassword}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={4}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.settings?.confirmPassword}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 p-2 rounded" style={{ backgroundColor: '#fee' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {!isFirstTimeChange && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                {t.common?.cancel}
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-white"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {loading ? t.settings?.saving : t.common?.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
