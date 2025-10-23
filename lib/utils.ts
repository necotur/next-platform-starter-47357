
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  
  return dates;
}

export function calculateStreak(logs: Array<{ date: Date; hoursWorn: number }>, goal: number = 22): number {
  if (!logs || logs.length === 0) return 0;
  
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    if (logDate.getTime() === expectedDate.getTime() && sortedLogs[i].hoursWorn >= goal) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function calculateComplianceRate(logs: Array<{ hoursWorn: number }>, goal: number = 22): number {
  if (!logs || logs.length === 0) return 0;
  
  const compliantDays = logs.filter(log => log.hoursWorn >= goal).length;
  return Math.round((compliantDays / logs.length) * 100);
}

export function getProgressPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

// Solar month names for all supported languages
const solarMonths = {
  ar: [
    'كانُونُ الثَّاني',
    'شُبَاطُ',
    'آذَارُ',
    'نَيْسَانُ',
    'أَيَّارُ',
    'حَزِيرانُ',
    'تَمُّوزُ',
    'آبُ',
    'أَيْلُولُ',
    'تَشْرِيْنُ الأَوَّلُ',
    'تَشْرِيْنُ الثَّاني',
    'كانُونُ الأَوَّلُّ',
  ],
  en: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  tr: [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
  ],
  ku: [
    'Rêb', 'Reş', 'Ada', 'Avr', 'Gul', 'Pûş',
    'Tîr', 'Teb', 'Îlo', 'Cot', 'Ser', 'Ber'
  ]
};

export function formatDateWithSolarMonth(date: Date | string, language: 'ar' | 'en' | 'tr' | 'ku' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const monthIndex = d.getMonth();
  const day = d.getDate();
  const monthName = solarMonths[language][monthIndex];
  
  if (language === 'ar') {
    return `${day} ${monthName}`;
  } else {
    return `${monthName} ${day}`;
  }
}

export function formatFullDateWithSolarMonth(date: Date | string, language: 'ar' | 'en' | 'tr' | 'ku' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const monthIndex = d.getMonth();
  const day = d.getDate();
  const year = d.getFullYear();
  const monthName = solarMonths[language][monthIndex];
  
  if (language === 'ar') {
    return `${day} ${monthName} ${year}`;
  } else {
    return `${monthName} ${day}, ${year}`;
  }
}
