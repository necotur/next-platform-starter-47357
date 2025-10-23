
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Check, X, UserCheck } from 'lucide-react';
import Link from 'next/link';

function ConnectContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams?.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; doctor?: any } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/connect' + (inviteCode ? `?code=${inviteCode}` : ''));
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role === 'doctor') {
        router.push('/doctor/dashboard');
      }
    }
  }, [status, session, router, inviteCode]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/patient/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: 'Successfully connected to your doctor!',
          doctor: data.doctor,
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to connect. Please check the code and try again.',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block rounded-lg p-3 mb-4" style={{ backgroundColor: '#3F0F22' }}>
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#3F0F22' }}>
            Connect with Your Doctor
          </h1>
          <p className="text-gray-600">
            Enter the invitation code provided by your orthodontist
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {result ? (
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
                style={{ backgroundColor: result.success ? '#10B98120' : '#EF444420' }}
              >
                {result.success ? (
                  <Check className="w-8 h-8" style={{ color: '#10B981' }} />
                ) : (
                  <X className="w-8 h-8" style={{ color: '#EF4444' }} />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: result.success ? '#10B981' : '#EF4444' }}>
                {result.success ? 'Connection Successful!' : 'Connection Failed'}
              </h3>
              <p className="text-gray-600 mb-4">{result.message}</p>
              
              {result.success && result.doctor && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Connected to</p>
                  <p className="font-semibold" style={{ color: '#3F0F22' }}>
                    Dr. {result.doctor.fullName}
                  </p>
                  {result.doctor.specialty && (
                    <p className="text-sm text-gray-600">{result.doctor.specialty}</p>
                  )}
                  {result.doctor.clinicName && (
                    <p className="text-sm text-gray-600">{result.doctor.clinicName}</p>
                  )}
                </div>
              )}
              
              {result.success ? (
                <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
              ) : (
                <button
                  onClick={() => setResult(null)}
                  className="mt-4 px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#AF4B6C' }}
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  Invitation Code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="SS-XXXX-XXXX"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 font-mono text-center text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the code provided by your doctor
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Now'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-sm font-medium hover:underline" style={{ color: '#AF4B6C' }}>
              Skip for now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    }>
      <ConnectContent />
    </Suspense>
  );
}
