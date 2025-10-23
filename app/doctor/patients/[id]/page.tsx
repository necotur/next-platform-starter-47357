
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MessageCircle, 
  Mail,
  Phone,
  Clock,
  TrendingUp,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Image as ImageIcon
} from 'lucide-react';
import { PhotoDisplay } from '@/components/photo-display';
import { PatientNotes } from '@/components/patient-notes';
import { BottomNav } from '@/components/bottom-nav';
import { calculateComplianceRate, calculateStreak, formatDateWithSolarMonth, formatFullDateWithSolarMonth } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  smile3dPortalUrl?: string;
  connectedAt: string;
  status: string;
}

interface WearTimeLog {
  date: string;
  hoursWorn: number;
}

interface SymptomLog {
  id: string;
  date: string;
  symptomType: string;
  severity: string;
  notes?: string;
}

interface ProgressPhoto {
  id: string;
  alignerNumber: number;
  photoType: string;
  cloudStoragePath: string;
  capturedAt: string;
}

interface Achievement {
  id: string;
  achievement: {
    name: string;
    description: string;
    icon: string;
  };
  unlockedAt: string;
}

interface TreatmentPlan {
  currentAlignerNumber: number;
  totalAligners: number;
  dailyWearTimeGoal: number;
  nextAlignerChangeDate: string;
}

// Component to display patient photos
function PatientPhoto({ photo }: { photo: ProgressPhoto }) {
  return (
    <div className="space-y-2">
      <PhotoDisplay 
        cloudStoragePath={photo.cloudStoragePath}
        alt={`Aligner ${photo.alignerNumber} - ${photo.photoType}`}
        className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
      />
      <div className="text-center">
        <p className="text-xs font-medium" style={{ color: '#3F0F22' }}>
          Aligner {photo.alignerNumber}
        </p>
        <p className="text-xs text-gray-500">{photo.photoType}</p>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const patientId = params?.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Patient data
  const [wearTimeLogs, setWearTimeLogs] = useState<WearTimeLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [treatmentPlan3D, setTreatmentPlan3D] = useState<any>(null);
  
  // UI state
  const [expandedSection, setExpandedSection] = useState<string | null>('wearTime');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      fetchPatientDetails();
    }
  }, [status, router, session, patientId]);

  const fetchPatientDetails = async () => {
    try {
      // Fetch patient info
      const patientsResponse = await fetch('/api/doctor/patients');
      if (patientsResponse.ok) {
        const patients = await patientsResponse.json();
        const currentPatient = patients.find((p: any) => p.id === patientId);
        if (currentPatient) {
          setPatient(currentPatient);
        }
      }

      // Fetch unread messages count
      const messagesResponse = await fetch(`/api/chat?userId=${patientId}`);
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        const unread = data.messages?.filter((m: any) => 
          m.senderId === patientId && !m.isRead
        ).length || 0;
        setUnreadCount(unread);
      }

      // Fetch all patient data
      const dataResponse = await fetch(`/api/doctor/patients/${patientId}/data`);
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setWearTimeLogs(data.wearTimeLogs || []);
        setSymptomLogs(data.symptomLogs || []);
        setProgressPhotos(data.progressPhotos || []);
        setAchievements(data.achievements || []);
        setTreatmentPlan(data.treatmentPlan);
      }

      // Fetch 3D treatment plans
      const plans3DResponse = await fetch(`/api/3d-plans/list?patientId=${patientId}`);
      if (plans3DResponse.ok) {
        const plansData = await plans3DResponse.json();
        if (plansData.plans && plansData.plans.length > 0) {
          // Get the most recent plan
          setTreatmentPlan3D(plansData.plans[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
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

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
            Patient not found
          </h3>
          <button
            onClick={() => router.push('/doctor/patients')}
            className="mt-4 px-6 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#AF4B6C' }}
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const goal = treatmentPlan?.dailyWearTimeGoal || 22;
  const complianceRate = calculateComplianceRate(wearTimeLogs.map(l => ({ date: new Date(l.date), hoursWorn: l.hoursWorn })), goal);
  const currentStreak = calculateStreak(wearTimeLogs.map(l => ({ date: new Date(l.date), hoursWorn: l.hoursWorn })), goal);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
            Patient Details
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {patient.fullName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                {patient.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Connected {formatDateWithSolarMonth(patient.connectedAt, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-gray-400" />
              <span>{patient.email}</span>
            </div>
            {patient.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Compliance</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {complianceRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Streak</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {currentStreak}
            </div>
            <p className="text-xs text-gray-500 mt-1">consecutive days</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push(`/chat?userId=${patient.id}`)}
            className="relative bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <MessageCircle className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                Send Message
              </span>
              {unreadCount > 0 && (
                <span 
                  className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: '#AF4B6C' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => toggleSection('photos')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                Progress Photos
              </span>
              <span className="text-xs text-gray-500">
                {progressPhotos.length} photos
              </span>
            </div>
          </button>
        </div>

        {/* 3D Treatment Viewer */}
        {(treatmentPlan3D || patient?.smile3dPortalUrl) && (
          <div className="bg-white rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'عرض خطة العلاج ثلاثية الأبعاد' : '3D Treatment Viewer'}
            </h3>
            
            {/* Internal 3D Viewer */}
            {treatmentPlan3D && (
              <button
                onClick={() => router.push(`/3d-plans/viewer?planId=${treatmentPlan3D.id}`)}
                className="w-full block p-4 rounded-lg hover:bg-opacity-80 transition-all mb-3"
                style={{ backgroundColor: '#FFF5F8' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#AF4B6C' }}
                    >
                      <svg 
                        className="w-6 h-6 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" 
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold" style={{ color: '#3F0F22' }}>
                        {language === 'ar' ? 'عرض النموذج ثلاثي الأبعاد' : 'View 3D Model'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'مرفوع بتاريخ' : 'Uploaded'} {new Date(treatmentPlan3D.createdAt).toLocaleDateString()}
                      </p>
                      {treatmentPlan3D.doctorName && (
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'بواسطة' : 'By'} {treatmentPlan3D.doctorName}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg 
                    className="w-5 h-5" 
                    style={{ color: '#AF4B6C' }} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </button>
            )}
            
            {/* External Portal Link (if available) */}
            {patient?.smile3dPortalUrl && (
              <>
                {treatmentPlan3D && (
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">
                        {language === 'ar' ? 'أو' : 'OR'}
                      </span>
                    </div>
                  </div>
                )}
                <a
                  href={patient.smile3dPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg hover:bg-opacity-80 transition-all"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-400"
                      >
                        <svg 
                          className="w-6 h-6 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-700">
                          {language === 'ar' ? 'البوابة الخارجية' : 'External Portal'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {patient.smile3dPortalUrl}
                        </p>
                      </div>
                    </div>
                    <svg 
                      className="w-5 h-5 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </a>
              </>
            )}
            
            {treatmentPlan3D && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                {language === 'ar' ? 'يمكن للمسؤول رفع خطط علاج جديدة' : 'Admins can upload new treatment plans'}
              </p>
            )}
          </div>
        )}

        {/* Treatment Plan */}
        {treatmentPlan && (
          <div className="bg-white rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
              Treatment Plan
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Current Aligner</span>
                <span className="font-semibold" style={{ color: '#3F0F22' }}>
                  {treatmentPlan.currentAlignerNumber} / {treatmentPlan.totalAligners}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Daily Goal</span>
                <span className="font-semibold" style={{ color: '#3F0F22' }}>
                  {treatmentPlan.dailyWearTimeGoal}h
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Next Change</span>
                <span className="font-semibold" style={{ color: '#3F0F22' }}>
                  {formatFullDateWithSolarMonth(treatmentPlan.nextAlignerChangeDate, language)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wear Time Logs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('wearTime')}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
                Wear Time Logs ({wearTimeLogs.length})
              </h3>
            </div>
            {expandedSection === 'wearTime' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'wearTime' && (
            <div className="p-5 pt-0 space-y-2 max-h-96 overflow-y-auto">
              {wearTimeLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No wear time logs yet</p>
              ) : (
                wearTimeLogs.slice(0, 10).map((log, index) => {
                  const percentage = Math.min((log.hoursWorn / goal) * 100, 100);
                  return (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                          {formatDateWithSolarMonth(log.date, language)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {log.hoursWorn.toFixed(1)}h / {goal}h
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="rounded-full h-2 transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: percentage >= 90 ? '#AF4B6C' : '#DBDBDB'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Symptom Logs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('symptoms')}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
                Symptom Logs ({symptomLogs.length})
              </h3>
            </div>
            {expandedSection === 'symptoms' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'symptoms' && (
            <div className="p-5 pt-0 space-y-3 max-h-96 overflow-y-auto">
              {symptomLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No symptom logs yet</p>
              ) : (
                symptomLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium" style={{ color: '#3F0F22' }}>
                        {log.symptomType}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        log.severity === 'severe' ? 'bg-red-100 text-red-700' :
                        log.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {log.severity}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-gray-600 mb-2">{log.notes}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDateWithSolarMonth(log.date, language)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Progress Photos */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('photos')}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
                Progress Photos ({progressPhotos.length})
              </h3>
            </div>
            {expandedSection === 'photos' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'photos' && (
            <div className="p-5 pt-0">
              {progressPhotos.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No progress photos yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {progressPhotos.map((photo) => (
                    <PatientPhoto key={photo.id} photo={photo} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('achievements')}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
                Achievements ({achievements.length})
              </h3>
            </div>
            {expandedSection === 'achievements' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === 'achievements' && (
            <div className="p-5 pt-0">
              {achievements.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No achievements unlocked yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((userAchievement) => (
                    <div
                      key={userAchievement.id}
                      className="p-4 rounded-lg border-2 shadow-sm"
                      style={{
                        borderColor: '#AF4B6C',
                        backgroundColor: '#FFF5F8',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">
                          {userAchievement.achievement.icon}
                        </div>
                        <h4 className="font-semibold text-sm mb-1" style={{ color: '#3F0F22' }}>
                          {userAchievement.achievement.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {userAchievement.achievement.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateWithSolarMonth(userAchievement.unlockedAt, language)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        <PatientNotes patientId={patientId} canEdit={true} />
      </main>

      <BottomNav />
    </div>
  );
}

