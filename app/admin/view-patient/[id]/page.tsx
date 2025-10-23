
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
import { calculateComplianceRate, calculateStreak, formatDateWithSolarMonth, formatFullDateWithSolarMonth } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  smile3dPortalUrl?: string;
  createdAt: string;
  role: string;
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

export default function AdminViewPatientDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const patientId = params?.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Patient data
  const [wearTimeLogs, setWearTimeLogs] = useState<WearTimeLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  
  // UI state
  const [expandedSection, setExpandedSection] = useState<string | null>('wearTime');
  const [editingPortalUrl, setEditingPortalUrl] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchPatientDetails();
    }
  }, [status, router, session, patientId]);

  const fetchPatientDetails = async () => {
    try {
      // Fetch patient info
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        const currentPatient = data.users.find((u: any) => u.id === patientId && u.role === 'patient');
        if (currentPatient) {
          setPatient(currentPatient);
          setPortalUrl(currentPatient.smile3dPortalUrl || '');
        }
      }

      // Fetch all patient data through doctor API (admins have access to all data)
      const dataResponse = await fetch(`/api/doctor/patients/${patientId}/data`);
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setWearTimeLogs(data.wearTimeLogs || []);
        setSymptomLogs(data.symptomLogs || []);
        setProgressPhotos(data.progressPhotos || []);
        setAchievements(data.achievements || []);
        setTreatmentPlan(data.treatmentPlan);
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
            onClick={() => router.push('/admin/patients')}
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

  const handleSavePortalUrl = async () => {
    try {
      const response = await fetch(`/api/admin/users/${patientId}/portal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portalUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setPatient({ ...patient!, smile3dPortalUrl: data.portalUrl });
        setEditingPortalUrl(false);
      } else {
        alert(language === 'ar' ? 'فشل حفظ رابط البوابة' : 'Failed to save portal URL');
      }
    } catch (error) {
      console.error('Failed to save portal URL:', error);
      alert(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
              Patient Details
            </h1>
            <p className="text-xs text-gray-500">Admin View</p>
          </div>
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
                  Joined {formatDateWithSolarMonth(patient.createdAt, language)}
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
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <MessageCircle className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                Send Message
              </span>
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

        {/* Seamless Smile 3D Portal - Admin can edit */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {language === 'ar' ? 'بوابة Seamless Smile 3D' : 'Seamless Smile 3D Portal'}
          </h3>
          
          {editingPortalUrl ? (
            <div className="space-y-3">
              <input
                type="url"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder={language === 'ar' 
                  ? 'أدخل رابط البوابة (مثال: https://example.com/portal/123)' 
                  : 'Enter portal URL (e.g., https://example.com/portal/123)'
                }
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-100 transition-all"
                style={{ 
                  borderColor: '#DBDBDB',
                  color: '#3F0F22'
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSavePortalUrl}
                  className="flex-1 py-2 rounded-lg text-white font-medium transition-all"
                  style={{ backgroundColor: '#AF4B6C' }}
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingPortalUrl(false);
                    setPortalUrl(patient?.smile3dPortalUrl || '');
                  }}
                  className="flex-1 py-2 rounded-lg font-medium transition-all"
                  style={{ 
                    backgroundColor: '#DBDBDB',
                    color: '#3F0F22'
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : patient?.smile3dPortalUrl ? (
            <div className="space-y-3">
              <a
                href={patient.smile3dPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg hover:bg-opacity-80 transition-all"
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#3F0F22' }}>
                        {language === 'ar' ? 'عرض البوابة 3D' : 'View 3D Portal'}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {patient.smile3dPortalUrl}
                      </p>
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
              </a>
              <button
                onClick={() => setEditingPortalUrl(true)}
                className="w-full py-2 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: '#DBDBDB',
                  color: '#3F0F22'
                }}
              >
                {language === 'ar' ? 'تعديل رابط البوابة' : 'Edit Portal URL'}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">
                {language === 'ar' 
                  ? 'لم يتم تعيين رابط البوابة لهذا المريض' 
                  : 'No portal URL set for this patient'
                }
              </p>
              <button
                onClick={() => setEditingPortalUrl(true)}
                className="px-6 py-2 rounded-lg text-white font-medium transition-all"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {language === 'ar' ? 'إضافة رابط البوابة' : 'Add Portal URL'}
              </button>
            </div>
          )}
        </div>

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
        <PatientNotes patientId={patientId} canEdit={false} />
      </main>

      <BottomNav />
    </div>
  );
}
