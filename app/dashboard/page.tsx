
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Camera,
  CheckCircle2,
  Award,
  Flame,
  Users
} from 'lucide-react';
import { formatDate, getDaysBetween, calculateStreak } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface TreatmentPlan {
  currentAlignerNumber: number;
  totalAligners: number;
  nextAlignerChangeDate: string;
  alignerChangeInterval: number;
  dailyWearTimeGoal: number;
}

interface WearTimeLog {
  date: string;
  hoursWorn: number;
}

interface DoctorInfo {
  fullName: string;
  specialty?: string;
  clinicName?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [todayLog, setTodayLog] = useState<WearTimeLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<WearTimeLog[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      
      // Redirect admins to admin dashboard
      if (userRole === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      // Redirect doctors to their dashboard
      if (userRole === 'doctor') {
        router.push('/doctor/dashboard');
        return;
      }
      fetchData();
    }
  }, [status, router, session]);

  const fetchData = async () => {
    try {
      const [planRes, logsRes, connectRes] = await Promise.all([
        fetch('/api/treatment-plan'),
        fetch('/api/wear-time?days=7'),
        fetch('/api/patient/connect'),
      ]);

      if (planRes.ok) {
        const plan = await planRes.json();
        if (!plan.id) {
          router.push('/onboarding');
          return;
        }
        setTreatmentPlan(plan);
      }

      if (logsRes.ok) {
        const logs = await logsRes.json();
        setRecentLogs(logs || []);
        
        const today = new Date().toISOString().split('T')[0];
        const todayData = logs?.find((log: WearTimeLog) => 
          new Date(log.date).toISOString().split('T')[0] === today
        );
        setTodayLog(todayData || null);
        
        const streak = calculateStreak(logs || [], treatmentPlan?.dailyWearTimeGoal || 22);
        setCurrentStreak(streak);
      }

      if (connectRes.ok) {
        const connectData = await connectRes.json();
        if (connectData.connected && connectData.doctor) {
          setDoctorInfo(connectData.doctor);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const daysUntilChange = treatmentPlan 
    ? getDaysBetween(new Date(), new Date(treatmentPlan.nextAlignerChangeDate))
    : 0;

  const progressPercentage = treatmentPlan
    ? Math.round((treatmentPlan.currentAlignerNumber / treatmentPlan.totalAligners) * 100)
    : 0;

  const todayProgress = todayLog 
    ? Math.min((todayLog.hoursWorn / (treatmentPlan?.dailyWearTimeGoal || 22)) * 100, 100)
    : 0;

  // Calculate days until treatment completion
  const daysToFinish = treatmentPlan
    ? (treatmentPlan.totalAligners - treatmentPlan.currentAlignerNumber) * treatmentPlan.alignerChangeInterval
    : 0;

  // Calculate estimated end date
  const estimatedEndDate = treatmentPlan
    ? new Date(new Date().getTime() + daysToFinish * 24 * 60 * 60 * 1000)
    : null;

  // Format date with Arabic month names
  const formatDateWithArabicMonths = (date: Date) => {
    const monthNames = [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <DashboardHeader title={t.nav.dashboard} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Message */}
        <div className="animate-fade-in">
          <h2 className="text-xl font-semibold mb-1" style={{ color: '#3F0F22' }}>
            {t.common.welcomeBack}, {session?.user?.name?.split(' ')?.[0] || 'there'}! 👋
          </h2>
          <p className="text-gray-600">{t.common.keepUpWork}</p>
        </div>

        {/* Connected Doctor Info */}
        {doctorInfo && (
          <div className="bg-white rounded-xl p-4 shadow-md border-l-4" style={{ borderColor: '#AF4B6C' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ backgroundColor: '#FFF5F8' }}>
                <Users className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'طبيبك' : 'Your Doctor'}
                </p>
                <p className="font-semibold text-lg" style={{ color: '#3F0F22' }}>
                  {doctorInfo.fullName}
                </p>
                {doctorInfo.specialty && (
                  <p className="text-sm text-gray-500">{doctorInfo.specialty}</p>
                )}
                {doctorInfo.clinicName && (
                  <p className="text-xs text-gray-400">{doctorInfo.clinicName}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Aligner Change Card */}
        <div 
          className="bg-gradient-to-br rounded-2xl p-6 shadow-lg animate-slide-in-up"
          style={{ 
            background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">{t.common.nextAlignerChange}</p>
              <h3 className="text-3xl font-bold text-white">{daysUntilChange} {t.common.days}</h3>
            </div>
            <Calendar className="w-10 h-10 text-white/80" />
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>{t.photos.aligner} {treatmentPlan?.currentAlignerNumber} {t.common.of} {treatmentPlan?.totalAligners}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Treatment Completion Countdown Card */}
        <div 
          className="bg-gradient-to-br rounded-2xl p-6 shadow-lg animate-slide-in-up"
          style={{ 
            background: 'linear-gradient(135deg, #AF4B6C 0%, #8f3d58 100%)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">{t.countdown.daysToFinish}</p>
              {daysToFinish > 0 ? (
                <h3 className="text-3xl font-bold text-white">{daysToFinish} {t.common.days}</h3>
              ) : (
                <h3 className="text-2xl font-bold text-white">{t.countdown.treatmentComplete}</h3>
              )}
            </div>
            <TrendingUp className="w-10 h-10 text-white/80" />
          </div>
          {estimatedEndDate && daysToFinish > 0 && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex justify-between text-white text-sm">
                <span>{t.countdown.estimatedEnd}</span>
                <span>
                  {language === 'ar' 
                    ? formatDateWithArabicMonths(estimatedEndDate)
                    : estimatedEndDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'ku' ? 'ku-TR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  }
                </span>
              </div>
            </div>
          )}
          {daysToFinish === 0 && (
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-white text-sm">🎉 {t.countdown.congratulations} 🎉</p>
              <p className="text-white/80 text-xs mt-1">{t.countdown.completionMessage}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today's Wear Time */}
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFF5F8' }}>
                <Clock className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              </div>
              <span className="text-sm font-medium text-gray-600">{t.common.today}</span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                {todayLog?.hoursWorn?.toFixed(1) || '0.0'}{t.common.hourShort}
              </span>
              <span className="text-gray-500 text-sm ml-1">/ {treatmentPlan?.dailyWearTimeGoal || 22}{t.common.hourShort}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="rounded-full h-1.5 transition-all duration-500"
                style={{ 
                  width: `${todayProgress}%`,
                  backgroundColor: '#AF4B6C'
                }}
              />
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFF5F8' }}>
                <Flame className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              </div>
              <span className="text-sm font-medium text-gray-600">{t.common.streak}</span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                {currentStreak}
              </span>
              <span className="text-gray-500 text-sm ml-1">{t.common.days}</span>
            </div>
            <p className="text-xs text-gray-500">
              {currentStreak > 0 ? t.common.keepItGoing : t.common.startStreak}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#3F0F22' }}>
            {t.common.quickActions}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/photos')}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <Camera className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                {t.dashboard.takePhoto}
              </span>
            </button>

            <button
              onClick={() => router.push('/track')}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                {t.dashboard.logWearTime}
              </span>
            </button>

            <button
              onClick={() => router.push('/log')}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <TrendingUp className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                {t.dashboard.logSymptom}
              </span>
            </button>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {t.common.thisWeekProgress}
          </h3>
          <div className="flex justify-between items-end h-32">
            {[6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              const dateStr = date.toISOString().split('T')[0];
              
              const log = recentLogs?.find(l => 
                new Date(l.date).toISOString().split('T')[0] === dateStr
              );
              
              const height = log 
                ? Math.min((log.hoursWorn / (treatmentPlan?.dailyWearTimeGoal || 22)) * 100, 100)
                : 0;
              
              // Get full weekday name from translations
              const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
              const dayNames = [
                t.days.sunday,
                t.days.monday,
                t.days.tuesday,
                t.days.wednesday,
                t.days.thursday,
                t.days.friday,
                t.days.saturday,
              ];
              const dayName = dayNames[dayIndex];
              
              return (
                <div key={daysAgo} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full px-1">
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${height}px`,
                        backgroundColor: height >= 90 ? '#AF4B6C' : '#DBDBDB',
                        minHeight: height > 0 ? '8px' : '0px',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
