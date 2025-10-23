

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  Globe, 
  LogOut, 
  Bell,
  Shield,
  FileText,
  Info,
  ChevronRight,
  Lock,
  TestTube2,
  Hash,
  Building2,
  Box
} from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { useLanguage } from '@/contexts/language-context';
import { PWAInstallButton } from '@/components/pwa-install-button';

export default function MorePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    try {
      // Unregister FCM token before signing out
      console.log('[Sign Out] Unregistering FCM token...');
      await fetch('/api/fcm/unregister', {
        method: 'POST',
      });
      console.log('[Sign Out] FCM token unregistered successfully');
    } catch (error) {
      console.error('[Sign Out] Error unregistering FCM token:', error);
    }

    try {
      // Unsubscribe from web push notifications
      console.log('[Sign Out] Unsubscribing from web push...');
      
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          console.log('[Sign Out] Found web push subscription, unsubscribing...');
          
          // Unsubscribe from push
          await subscription.unsubscribe();
          console.log('[Sign Out] Unsubscribed from push manager');
          
          // Delete from server
          await fetch('/api/web-push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          console.log('[Sign Out] Web push subscription deleted from server');
        }
      }
    } catch (error) {
      console.error('[Sign Out] Error unsubscribing from web push:', error);
    }
    
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
            {t.more.title}
          </h1>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#3F0F22' }}>
                {session?.user?.name || (language === 'ar' ? 'ضيف' : language === 'tr' ? 'Misafir' : language === 'ku' ? 'Mêvan' : 'Guest')}
              </h2>
              <p className="text-sm text-gray-600">{session?.user?.email}</p>
              {userRole && (
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {userRole === 'patient' 
                    ? t.auth.patient
                    : userRole === 'doctor' 
                    ? t.auth.doctor
                    : 'Admin'
                  }
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/settings/profile')}
            className="w-full py-3 px-4 rounded-lg border-2 font-medium flex items-center justify-between transition-all hover:bg-gray-50"
            style={{ borderColor: '#AF4B6C', color: '#AF4B6C' }}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" />
              <span>{language === 'ar' ? 'عرض الملف الشخصي' : language === 'tr' ? 'Profili Görüntüle' : language === 'ku' ? 'Profîlê Bibîne' : 'View Profile'}</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              {t.more.settings}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {/* Language Toggle */}
            <button
              onClick={() => router.push('/settings/language')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {t.settings.language}
                </span>
              </div>
              <span className="text-gray-600">
                {language === 'en' ? 'English' : language === 'ar' ? 'العربية' : language === 'tr' ? 'Türkçe' : 'Kurdî'}
              </span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => router.push('/settings/notifications')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {t.settings.notifications}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Change Password */}
            <button
              onClick={() => router.push('/settings/change-password')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {t.settings.changePassword}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Treatment Tools Section - Available for all users */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'أدوات العلاج' : language === 'tr' ? 'Tedavi Araçları' : language === 'ku' ? 'Amûrên Dermanê' : 'Treatment Tools'}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {/* 3D Treatment Plans */}
            <button
              onClick={() => router.push('/3d-plans')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <div className="text-left">
                  <div className="font-medium" style={{ color: '#3F0F22' }}>
                    {language === 'ar' ? 'خطط العلاج ثلاثية الأبعاد' : language === 'tr' ? '3D Tedavi Planları' : language === 'ku' ? 'Planên Dermanê ya 3D' : '3D Treatment Plans'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'ar' ? 'عرض النماذج ثلاثية الأبعاد لخطة العلاج' : language === 'tr' ? '3D diş modellerini görüntüleyin' : language === 'ku' ? 'Modelên diranan ên 3D bibînin' : 'View 3D dental models'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Doctor-specific section */}
        {(userRole === 'doctor' || userRole === 'admin') && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
                {language === 'ar' ? 'أدوات الطبيب' : language === 'tr' ? 'Doktor Araçları' : language === 'ku' ? 'Amûrên Doktorî' : 'Doctor Tools'}
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {/* Edit Doctor Details */}
              <button
                onClick={() => router.push('/settings/doctor-details')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                  <span className="font-medium" style={{ color: '#3F0F22' }}>
                    {language === 'ar' ? 'تعديل تفاصيل الطبيب' : language === 'tr' ? 'Doktor Bilgilerini Düzenle' : language === 'ku' ? 'Hûrgihanên Doktor Biguhêre' : 'Edit Doctor Details'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Generate Invitation Code */}
              {userRole === 'doctor' && (
                <button
                  onClick={() => router.push('/doctor/generate-code')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                    <span className="font-medium" style={{ color: '#3F0F22' }}>
                      {language === 'ar' ? 'إنشاء رمز دعوة' : language === 'tr' ? 'Davet Kodu Oluştur' : language === 'ku' ? 'Koda Vexwendinê Çêke' : 'Generate Invitation Code'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Admin-specific section */}
        {userRole === 'admin' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
                Admin
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                  <span className="font-medium" style={{ color: '#3F0F22' }}>
                    Admin Dashboard
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              {t.more.about}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            <button
              onClick={() => router.push('/about')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {language === 'ar' ? 'حول التطبيق' : language === 'tr' ? 'Uygulama Hakkında' : language === 'ku' ? 'Derbarê Sepanê' : 'About App'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/privacy-policy')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {language === 'ar' ? 'سياسة الخصوصية' : language === 'tr' ? 'Gizlilik Politikası' : language === 'ku' ? 'Siyaseta Veşartinê' : 'Privacy Policy'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/terms-and-conditions')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {language === 'ar' ? 'الشروط والأحكام' : language === 'tr' ? 'Şartlar ve Koşullar' : language === 'ku' ? 'Mercên û Şert' : 'Terms & Conditions'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push('/test-notifications')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <TestTube2 className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="font-medium" style={{ color: '#3F0F22' }}>
                  {language === 'ar' ? 'اختبار الإشعارات' : language === 'tr' ? 'Push Bildirimlerini Test Et' : language === 'ku' ? 'Agahdariyên Push Biceribîne' : 'Test Push Notifications'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* PWA Install Button */}
        <div className="px-4">
          <PWAInstallButton />
        </div>

        {/* App Version */}
        <div className="text-center text-sm text-gray-500">
          <p>{language === 'ar' ? 'الإصدار' : language === 'tr' ? 'Versiyon' : language === 'ku' ? 'Versiyon' : 'Version'} 1.0.0</p>
          <p className="mt-1">
            {language === 'ar' ? 'صُنع بـ' : language === 'tr' ? 'İle yapıldı' : language === 'ku' ? 'Bi' : 'Made with'} ❤️ {language === 'ar' ? 'بواسطة سيمليس' : language === 'tr' ? 'Seamless tarafından' : language === 'ku' ? 'ji aliyê Seamless' : 'by Seamless'}
          </p>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg"
          style={{ 
            backgroundColor: '#AF4B6C',
            color: 'white'
          }}
        >
          <LogOut className="w-5 h-5" />
          {t.settings.logout}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}


