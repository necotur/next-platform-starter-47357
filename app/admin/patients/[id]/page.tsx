
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, Key } from 'lucide-react';
import { PatientNotes } from '@/components/patient-notes';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';
import { OneTimeLoginModal } from '@/components/one-time-login-modal';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export default function AdminPatientDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const patientId = params?.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [oneTimeLoginModal, setOneTimeLoginModal] = useState(false);

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
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const currentPatient = data.users.find((u: any) => u.id === patientId && u.role === 'patient');
        if (currentPatient) {
          setPatient(currentPatient);
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
                  Joined {new Date(patient.createdAt).toLocaleDateString()}
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push(`/admin/view-patient/${patient.id}`)}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <User className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                View Full Details
              </span>
            </div>
          </button>

          <button
            onClick={() => router.push(`/chat?userId=${patient.id}`)}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Mail className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                Send Message
              </span>
            </div>
          </button>
        </div>

        {/* One-Time Login */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            {t.invitations.oneTimeLogin}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t.invitations.generateOneTime} for {patient.fullName}
          </p>
          <button
            onClick={() => setOneTimeLoginModal(true)}
            className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#AF4B6C' }}
          >
            <Key className="w-5 h-5" />
            {t.invitations.generateOneTime}
          </button>
        </div>

        {/* Clinical Notes */}
        <PatientNotes patientId={patientId} canEdit={true} />
      </main>

      <BottomNav />
      
      {/* One-Time Login Modal */}
      {patient && (
        <OneTimeLoginModal
          isOpen={oneTimeLoginModal}
          onClose={() => setOneTimeLoginModal(false)}
          patientId={patient.id}
          patientName={patient.fullName}
          patientEmail={patient.email}
          apiPath="admin"
        />
      )}
    </div>
  );
}
