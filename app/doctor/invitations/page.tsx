

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, User, Calendar, Search, KeyRound } from 'lucide-react';
import { formatDateWithSolarMonth } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';
import { OneTimeLoginModal } from '@/components/one-time-login-modal';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  connectedAt: string;
  status: string;
}

export default function DoctorInvitationsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [oneTimeLoginModal, setOneTimeLoginModal] = useState<{ isOpen: boolean; patient: Patient | null }>({
    isOpen: false,
    patient: null,
  });
  const [selectedPatientForReset, setSelectedPatientForReset] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'doctor') {
        router.push('/dashboard');
      } else {
        fetchPatients();
      }
    }
  }, [status, session, router]);

  // Check if we came from a reset PIN flow
  useEffect(() => {
    const resetPinPatientId = searchParams?.get('resetPin');
    if (resetPinPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === resetPinPatientId);
      if (patient) {
        setOneTimeLoginModal({ isOpen: true, patient });
      }
    }
  }, [searchParams, patients]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/doctor/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setOneTimeLoginModal({ isOpen: true, patient });
  };

  const filteredPatients = patients.filter(patient => 
    patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

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
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'دعوة المرضى' : 'Invite Patients'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'ar' ? 'إنشاء رمز تسجيل دخول لمرة واحدة' : 'Generate one-time login for your patients'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div 
          className="bg-gradient-to-br rounded-2xl p-6 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, #3F0F22 0%, #5a1630 100%)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {language === 'ar' ? 'دعوة بواسطة رمز PIN' : 'Invite by Reset PIN'}
              </h3>
              <p className="text-white/90 text-sm">
                {language === 'ar' 
                  ? 'حدد مريضًا أدناه لإنشاء رمز تسجيل دخول آمن لمرة واحدة'
                  : 'Select a patient below to generate a secure one-time login code'
                }
              </p>
            </div>
            <KeyRound className="w-10 h-10 text-white/80" />
          </div>
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <p className="text-white/80 text-xs">
              {language === 'ar'
                ? '💡 يمكن استخدام رمز PIN هذا لتسجيل دخول لمرة واحدة ويمكن مشاركته عبر الرسائل القصيرة أو الواتساب أو البريد الإلكتروني'
                : '💡 This PIN can be used for one-time login and can be shared via SMS, WhatsApp, or email'
              }
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث عن المرضى...' : 'Search patients...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-md text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#3F0F22' }}>
              {searchQuery 
                ? (language === 'ar' ? 'لم يتم العثور على مرضى' : 'No patients found')
                : (language === 'ar' ? 'لا يوجد مرضى بعد' : 'No patients yet')
              }
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? (language === 'ar' ? 'جرب مصطلح بحث مختلف' : 'Try a different search term')
                : (language === 'ar' ? 'سيظهر المرضى المتصلون هنا' : 'Connected patients will appear here')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: '#AF4B6C' }}
                    >
                      {patient.fullName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate" style={{ color: '#3F0F22' }}>
                        {patient.fullName || 'Patient'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{patient.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">
                          {language === 'ar' ? 'متصل' : 'Connected'} {formatDateWithSolarMonth(patient.connectedAt, language)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* One-Time Login Modal */}
      {oneTimeLoginModal.patient && (
        <OneTimeLoginModal
          isOpen={oneTimeLoginModal.isOpen}
          onClose={() => setOneTimeLoginModal({ isOpen: false, patient: null })}
          patientId={oneTimeLoginModal.patient.id}
          patientName={oneTimeLoginModal.patient.fullName || 'Patient'}
          patientEmail={oneTimeLoginModal.patient.email}
        />
      )}

      <BottomNav />
    </div>
  );
}

