
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { 
  Clock, 
  Plus,
  Minus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Edit2,
  X
} from 'lucide-react';
import { getWeekDates, calculateComplianceRate, calculateStreak } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface WearTimeLog {
  id: string;
  date: string;
  hoursWorn: number;
}

export default function TrackPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [logs, setLogs] = useState<WearTimeLog[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  const [todayHours, setTodayHours] = useState(24); // Start at 24 hours
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editHours, setEditHours] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [logsRes, planRes] = await Promise.all([
        fetch('/api/wear-time?days=30'),
        fetch('/api/treatment-plan'),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData || []);
        
        const today = new Date().toISOString().split('T')[0];
        const todayLog = logsData?.find((log: WearTimeLog) => 
          new Date(log.date).toISOString().split('T')[0] === today
        );
        // If there's a log for today, use it; otherwise start at 24
        setTodayHours(todayLog?.hoursWorn ?? 24);
      }

      if (planRes.ok) {
        setTreatmentPlan(await planRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const adjustHours = (amount: number) => {
    const newHours = Math.max(0, Math.min(24, todayHours + amount));
    setTodayHours(newHours);
  };

  const adjustMinutes = (minutes: number) => {
    const hours = minutes / 60;
    adjustHours(hours);
  };

  const getWeekdayName = (date: Date) => {
    const day = date.getDay();
    const weekdays = [
      t.wearTime.sunday,
      t.wearTime.monday,
      t.wearTime.tuesday,
      t.wearTime.wednesday,
      t.wearTime.thursday,
      t.wearTime.friday,
      t.wearTime.saturday,
    ];
    return weekdays[day];
  };

  const getMonthName = (date: Date) => {
    const month = date.getMonth();
    const months = [
      t.months.january,
      t.months.february,
      t.months.march,
      t.months.april,
      t.months.may,
      t.months.june,
      t.months.july,
      t.months.august,
      t.months.september,
      t.months.october,
      t.months.november,
      t.months.december,
    ];
    return months[month];
  };

  const formatDateWithMonth = (date: Date) => {
    if (language === 'ar') {
      return `${getMonthName(date)} ${date.getDate()}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatHours = (hours: number) => {
    const hoursPart = Math.floor(hours);
    const minutesPart = Math.round((hours - hoursPart) * 60);
    
    if (language === 'ar') {
      if (minutesPart === 0) {
        return `${hoursPart} ${t.wearTime.hourUnit}`;
      }
      return `${hoursPart} ${t.wearTime.hourUnit} ${minutesPart} ${t.wearTime.minuteUnit}`;
    } else {
      if (minutesPart === 0) {
        return `${hoursPart}${t.wearTime.hourUnit}`;
      }
      return `${hoursPart}${t.wearTime.hourUnit} ${minutesPart}${t.wearTime.minuteUnit}`;
    }
  };

  const saveLog = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/wear-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          hoursWorn: todayHours,
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to save log:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditingDay = (dateStr: string, currentHours: number) => {
    // Don't allow editing today via the edit button
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      return;
    }
    setEditingDate(dateStr);
    // Start from 24 hours if no log exists (currentHours is 0), otherwise use the current value
    setEditHours(currentHours === 0 ? 24 : currentHours);
  };

  const cancelEditing = () => {
    setEditingDate(null);
    setEditHours(0);
  };

  const saveEditedDay = async () => {
    if (!editingDate) return;
    
    setSaving(true);
    try {
      // Create a date object and ensure it's at midnight local time
      const dateObj = new Date(editingDate + 'T12:00:00');
      
      const response = await fetch('/api/wear-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateObj.toISOString(),
          hoursWorn: editHours,
        }),
      });

      if (response.ok) {
        await fetchData();
        cancelEditing();
      } else {
        console.error('Failed to save:', await response.text());
      }
    } catch (error) {
      console.error('Failed to save edited day:', error);
    } finally {
      setSaving(false);
    }
  };

  const adjustEditHours = (amount: number) => {
    const newHours = Math.max(0, Math.min(24, editHours + amount));
    setEditHours(newHours);
  };

  const adjustEditMinutes = (minutes: number) => {
    const hours = minutes / 60;
    adjustEditHours(hours);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  const goal = treatmentPlan?.dailyWearTimeGoal || 22;
  const todayProgress = Math.min((todayHours / goal) * 100, 100);
  
  const weekLogs = logs?.filter(log => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  }) || [];
  
  const complianceRate = calculateComplianceRate(weekLogs, goal);
  const currentStreak = calculateStreak(logs?.map(l => ({ ...l, date: new Date(l.date) })) || [], goal);
  
  const weekDates = getWeekDates();

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <DashboardHeader title={t.wearTime.title} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Today's Tracker */}
        <div className="bg-gradient-to-br rounded-2xl p-6 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t.wearTime.todayProgress}</h2>
          </div>

          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-white mb-2">
              {formatHours(todayHours)}
            </div>
            <div className="text-white/80">{t.wearTime.hoursWorn}</div>
            <div className="text-white/60 text-sm mt-1">
              {t.wearTime.adjustNote}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>{t.wearTime.goal}: {goal}{t.wearTime.hourUnit}</span>
              <span>{todayProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>

          {/* Adjustment Controls */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm text-center mb-2">
              {t.wearTime.addTime}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => adjustHours(1)}
                className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
              >
                +1 {language === 'ar' ? t.wearTime.hourUnit : 'h'}
              </button>
              <button
                onClick={() => adjustMinutes(30)}
                className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
              >
                +30 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
              </button>
              <button
                onClick={() => adjustMinutes(10)}
                className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
              >
                +10 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
              </button>
            </div>
            <div className="text-white/80 text-sm text-center mb-2">
              {t.wearTime.subtractTime}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => adjustHours(-1)}
                className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
              >
                -1 {language === 'ar' ? t.wearTime.hourUnit : 'h'}
              </button>
              <button
                onClick={() => adjustMinutes(-30)}
                className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
              >
                -30 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
              </button>
              <button
                onClick={() => adjustMinutes(-10)}
                className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
              >
                -10 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
              </button>
            </div>
          </div>

          <button
            onClick={saveLog}
            disabled={saving}
            className="w-full mt-6 py-3 rounded-lg bg-white text-center font-medium transition-all hover:shadow-lg disabled:opacity-50"
            style={{ color: '#3F0F22' }}
          >
            {saving ? t.wearTime.saving : t.wearTime.saveToday}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">{t.wearTime.compliance}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {complianceRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">{t.wearTime.lastDays}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">{t.wearTime.streak}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {currentStreak}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t.wearTime.consecutiveDays}</p>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {t.wearTime.weeklyOverview}
          </h3>
          
          <div className="space-y-3">
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const log = logs?.find(l => 
                new Date(l.date).toISOString().split('T')[0] === dateStr
              );
              
              const hours = log?.hoursWorn || 0;
              const percentage = Math.min((hours / goal) * 100, 100);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isEditing = editingDate === dateStr;
              
              const dayName = getWeekdayName(date);
              const dateFormat = formatDateWithMonth(date);
              
              if (isEditing) {
                return (
                  <div key={index} className="border-2 rounded-lg p-4 space-y-3" style={{ borderColor: '#AF4B6C' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium" style={{ color: '#AF4B6C' }}>
                        {t.wearTime.editDay}: {dayName}, {dateFormat}
                      </span>
                      <button
                        onClick={cancelEditing}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="text-4xl font-bold" style={{ color: '#3F0F22' }}>
                        {formatHours(editHours)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">{t.wearTime.addTime}</div>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => adjustEditHours(1)}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            +1 {language === 'ar' ? t.wearTime.hourUnit : 'h'}
                          </button>
                          <button
                            onClick={() => adjustEditMinutes(30)}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            +30 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
                          </button>
                          <button
                            onClick={() => adjustEditMinutes(10)}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            +10 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-600">{t.wearTime.subtractTime}</div>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => adjustEditHours(-1)}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            -1 {language === 'ar' ? t.wearTime.hourUnit : 'h'}
                          </button>
                          <button
                            onClick={() => adjustEditMinutes(-30)}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            -30 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
                          </button>
                          <button
                            onClick={() => adjustEditMinutes(-10)}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            -10 {language === 'ar' ? t.wearTime.minuteUnit : 'm'}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={saveEditedDay}
                      disabled={saving}
                      className="w-full py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#AF4B6C' }}
                    >
                      {saving ? t.wearTime.saving : t.wearTime.updateHours}
                    </button>
                  </div>
                );
              }
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm items-center">
                    <span className="font-medium" style={{ color: isToday ? '#AF4B6C' : '#3F0F22' }}>
                      {dayName}, {dateFormat}
                      {isToday && ` (${t.common.today})`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {formatHours(hours)} / {goal}{t.wearTime.hourUnit}
                      </span>
                      {!isToday && (
                        <button
                          onClick={() => startEditingDay(dateStr, hours)}
                          className="p-1 hover:bg-gray-100 rounded transition-all"
                          title={t.wearTime.clickToEdit}
                        >
                          <Edit2 className="w-4 h-4" style={{ color: '#AF4B6C' }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="rounded-full h-2 transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: percentage >= 90 ? '#AF4B6C' : '#DBDBDB'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips Card */}
        <div 
          className="rounded-xl p-4"
          style={{ backgroundColor: '#FFF5F8' }}
        >
          <h4 className="font-semibold mb-2" style={{ color: '#3F0F22' }}>
            💡 {t.wearTime.wearTimeTips}
          </h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• {t.wearTime.tip1.replace('{goal}', goal.toString())}</li>
            <li>• {t.wearTime.tip2}</li>
            <li>• {t.wearTime.tip3}</li>
            <li>• {t.wearTime.tip4}</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
