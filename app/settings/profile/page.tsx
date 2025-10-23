
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, AtSign, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (response.ok) {
        const userData = await response.json();
        setFullName(userData.fullName || '');
        setUsername(userData.username || '');
        setEmail(userData.email || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error(language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required');
      return;
    }

    if (!username.trim()) {
      toast.error(language === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, username }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
        
        // Refresh the page to update the session
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.error || (language === 'ar' ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء تحديث الملف الشخصي' : 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'إعدادات الملف الشخصي' : 'Profile Settings'}
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ borderColor: '#E5E7EB' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' ? 'يمكنك تغيير اسم المستخدم الخاص بك' : 'You can change your username'}
            </p>
          </div>

          {email && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            style={{ backgroundColor: '#AF4B6C' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
