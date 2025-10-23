
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import { PWAInstallButton } from '@/components/pwa-install-button';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill credentials from URL query parameters
  useEffect(() => {
    const usernameParam = searchParams?.get('username');
    const passwordParam = searchParams?.get('password');

    if (usernameParam) {
      setUsername(usernameParam);
    }
    if (passwordParam) {
      setPassword(passwordParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
      } else {
        // Fetch user data to determine role
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.role === 'doctor') {
            router.push('/doctor/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ. الرجاء المحاولة مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'transparent' }}>
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle variant="compact" />
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-[480px] h-[240px]">
              <Image
                src="/logo1v.png"
                alt="Seamless Smile"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#3F0F22' }}>
            {t.auth.welcomeBack}
          </h1>
          <p className="text-gray-600">{t.auth.signInToContinue}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                {language === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
              </label>
              <div className="relative">
                <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : 'username or email'}
                  required
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.auth.signingIn}
                </>
              ) : (
                t.auth.signIn
              )}
            </button>
          </form>

          {/* PWA Install Button */}
          <div className="mt-4">
            <PWAInstallButton />
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t.auth.dontHaveAccount}{' '}
              <Link href="/auth/signup" className="font-medium hover:underline" style={{ color: '#AF4B6C' }}>
                {t.auth.signUp}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
