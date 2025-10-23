

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { useLanguage } from '@/contexts/language-context';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  TrendingUp,
  UserPlus,
  Activity,
  Clock
} from 'lucide-react';

interface DoctorStats {
  totalPatients: number;
  activePatients: number;
  unreadMessages: number;
  recentActivity: number;
}

export default function DoctorDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<DoctorStats>({
    totalPatients: 0,
    activePatients: 0,
    unreadMessages: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      // Redirect patients to their dashboard
      if (userRole === 'patient') {
        router.push('/dashboard');
        return;
      }
      fetchStats();
    }
  }, [status, router, session]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/doctor/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <DashboardHeader title={t.doctorDashboard.title} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <div className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-1" style={{ color: '#3F0F22' }}>
            {t.doctorDashboard.welcome}, {t.doctorDashboard.doctor} {session?.user?.name?.split(' ')?.[0] || 'Doctor'}! 👨‍⚕️
          </h2>
          <p className="text-gray-600">{t.doctorDashboard.managePatients}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Patients */}
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFF5F8' }}>
                <Users className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              </div>
              <span className="text-sm font-medium text-gray-600">{t.doctorDashboard.patients}</span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                {stats.totalPatients}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {stats.activePatients} {t.doctorDashboard.active}
            </p>
          </div>

          {/* Unread Messages */}
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFF5F8' }}>
                <MessageCircle className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              </div>
              <span className="text-sm font-medium text-gray-600">{t.doctorDashboard.messages}</span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                {stats.unreadMessages}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {t.doctorDashboard.unreadMessages}
            </p>
          </div>
        </div>

        {/* Invitation Card */}
        <div 
          className="bg-gradient-to-br rounded-2xl p-6 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">{t.doctorDashboard.connectWithPatients}</p>
              <h3 className="text-2xl font-bold text-white">{t.doctorDashboard.sendInvitations}</h3>
            </div>
            <UserPlus className="w-10 h-10 text-white/80" />
          </div>
          <p className="text-white/90 text-sm mb-4">
            {language === 'ar' 
              ? 'إنشاء رمز PIN لمرة واحدة لدعوة المرضى بشكل آمن'
              : 'Generate one-time PIN codes to invite patients securely'
            }
          </p>
          <button
            onClick={() => router.push('/doctor/invitations')}
            className="w-full py-3 rounded-lg bg-white font-medium transition-all hover:bg-gray-50"
            style={{ color: '#AF4B6C' }}
          >
            {language === 'ar' ? 'دعوة بواسطة رمز PIN' : 'Invite by Reset PIN'}
          </button>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#3F0F22' }}>
            {t.doctorDashboard.quickActions}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/doctor/patients')}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <Users className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                {t.doctorDashboard.myPatients}
              </span>
            </button>

            <button
              onClick={() => router.push('/chat')}
              className="relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <MessageCircle className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                {t.doctorDashboard.messages}
              </span>
              {stats.unreadMessages > 0 && (
                <span 
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: '#AF4B6C' }}
                >
                  {stats.unreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push('/more')}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <Activity className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                {t.doctorDashboard.settings}
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {t.doctorDashboard.recentActivity}
          </h3>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">{t.doctorDashboard.noRecentActivity}</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
