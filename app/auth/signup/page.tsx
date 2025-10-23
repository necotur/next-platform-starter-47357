
'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Loader2, Stethoscope, Heart, Building2, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import { PWAInstallButton } from '@/components/pwa-install-button';

export default function SignUpPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Doctor-specific fields
  const [specialty, setSpecialty] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const requestBody: any = {
        username,
        password,
        fullName,
        role,
      };

      // Add email for doctors only
      if (role === 'doctor') {
        requestBody.email = email;
        requestBody.specialty = specialty;
        requestBody.clinicName = clinicName;
        requestBody.phoneNumber = phoneNumber;
      }

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || (language === 'ar' ? 'فشل إنشاء الحساب' : 'Failed to create account'));
        setLoading(false);
        return;
      }

      // Sign in automatically after signup
      const signInResult = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(language === 'ar' ? 'تم إنشاء الحساب ولكن فشل تسجيل الدخول' : 'Account created but failed to sign in');
        setLoading(false);
      } else {
        // Redirect based on role
        if (role === 'doctor') {
          router.push('/doctor/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ. الرجاء المحاولة مرة أخرى.' : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'transparent' }}>
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
            {step === 'role' ? (language === 'ar' ? 'اختر دورك' : 'Choose Your Role') : t.auth.createAccount}
          </h1>
          <p className="text-gray-600">
            {step === 'role' 
              ? (language === 'ar' ? 'اختر كيف تريد استخدام التطبيق' : 'Select how you want to use Seamless Smile')
              : t.auth.startYourJourney}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {step === 'role' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setRole('patient');
                  setStep('details');
                }}
                className="w-full p-6 border-2 rounded-xl hover:border-opacity-80 transition-all text-left group"
                style={{ borderColor: '#AF4B6C' }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FFF5F8' }}
                  >
                    <Heart className="w-6 h-6" style={{ color: '#AF4B6C' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#3F0F22' }}>
                      {language === 'ar' ? 'أنا مريض' : "I'm a Patient"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' 
                        ? 'تتبع تقدم علاج التقويم الشفاف، سجل وقت الارتداء، وراقب رحلتك إلى ابتسامة مثالية.'
                        : 'Track your clear aligner treatment progress, log wear time, and monitor your journey to a perfect smile.'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('doctor');
                  setStep('details');
                }}
                className="w-full p-6 border-2 rounded-xl hover:border-opacity-80 transition-all text-left group"
                style={{ borderColor: '#AF4B6C' }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FFF5F8' }}
                  >
                    <Stethoscope className="w-6 h-6" style={{ color: '#AF4B6C' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#3F0F22' }}>
                      {language === 'ar' ? 'أنا طبيب' : "I'm a Doctor"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'ar'
                        ? 'إدارة مرضاك، مراقبة تقدمهم، التواصل معهم، ومنح إنجازات خاصة.'
                        : 'Manage your patients, monitor their progress, communicate with them, and award special achievements.'}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {t.auth.alreadyHaveAccount}{' '}
                  <Link href="/auth/signin" className="font-medium hover:underline" style={{ color: '#AF4B6C' }}>
                    {t.auth.signIn}
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('role')}
                className="text-sm font-medium hover:underline mb-2"
                style={{ color: '#AF4B6C' }}
              >
                {language === 'ar' ? '→ تغيير الدور' : '← Change role'}
              </button>

              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                </label>
                <div className="relative">
                  <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم المستخدم' : 'username123'}
                    required
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === 'ar' ? 'محمد أحمد' : 'John Doe'}
                    required
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                  />
                </div>
              </div>

              {role === 'doctor' && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                    {t.auth.email}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@email.com"
                      required={role === 'doctor'}
                      className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                      style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                    />
                  </div>
                </div>
              )}

              {role === 'doctor' && (
                <>
                  <div>
                    <label htmlFor="specialty" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                      {language === 'ar' ? 'التخصص' : 'Specialty'}
                    </label>
                    <div className="relative">
                      <Stethoscope className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                      <input
                        id="specialty"
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder={language === 'ar' ? 'تقويم الأسنان' : 'Orthodontics'}
                        required={role === 'doctor'}
                        className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="clinicName" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                      {language === 'ar' ? 'اسم العيادة' : 'Clinic Name'}
                    </label>
                    <div className="relative">
                      <Building2 className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                      <input
                        id="clinicName"
                        type="text"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder={language === 'ar' ? 'عيادة الابتسامة' : 'Smile Care Clinic'}
                        required={role === 'doctor'}
                        className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <CreditCard className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={language === 'ar' ? '+966 50 123 4567' : '+1 (555) 123-4567'}
                        required={role === 'doctor'}
                        className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                      />
                    </div>
                  </div>
                </>
              )}

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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  {t.auth.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {t.auth.creatingAccount}
                  </>
                ) : (
                  (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
                )}
              </button>

              {/* PWA Install Button */}
              <div className="mt-4">
                <PWAInstallButton />
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {t.auth.alreadyHaveAccount}{' '}
                  <Link href="/auth/signin" className="font-medium hover:underline" style={{ color: '#AF4B6C' }}>
                    {t.auth.signIn}
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
