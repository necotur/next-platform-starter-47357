

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Stethoscope, Phone, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function DoctorDetailsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState({
    clinicName: '',
    specialty: '',
    phoneNumber: '',
    licenseNumber: ''
  });

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && (userRole === 'doctor' || userRole === 'admin')) {
      fetchDoctorDetails();
    }
  }, [status, userRole]);

  const fetchDoctorDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/details');
      if (res.ok) {
        const data = await res.json();
        setDoctorData({
          clinicName: data.clinicName || '',
          specialty: data.specialty || '',
          phoneNumber: data.phoneNumber || '',
          licenseNumber: data.licenseNumber || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/doctor/details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctorData),
      });

      if (res.ok) {
        alert(language === 'ar' ? 'تم حفظ التفاصيل بنجاح' : 'Details saved successfully');
        router.push('/more');
      } else {
        const error = await res.json();
        alert(error.error || (language === 'ar' ? 'فشل في حفظ التفاصيل' : 'Failed to save details'));
      }
    } catch (error) {
      console.error('Failed to save doctor details:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  if (userRole !== 'doctor' && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <p>{language === 'ar' ? 'غير مصرح' : 'Unauthorized'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'تفاصيل الطبيب' : 'Doctor Details'}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Clinic Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              <Building2 className="w-4 h-4" style={{ color: '#AF4B6C' }} />
              {language === 'ar' ? 'اسم العيادة' : 'Clinic Name'}
            </label>
            <input
              type="text"
              value={doctorData.clinicName}
              onChange={(e) => setDoctorData({ ...doctorData, clinicName: e.target.value })}
              placeholder={language === 'ar' ? 'أدخل اسم العيادة' : 'Enter clinic name'}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ 
                borderColor: '#DBDBDB',
                ['--tw-ring-color' as any]: '#AF4B6C'
              }}
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              <Stethoscope className="w-4 h-4" style={{ color: '#AF4B6C' }} />
              {language === 'ar' ? 'التخصص' : 'Specialty'}
            </label>
            <input
              type="text"
              value={doctorData.specialty}
              onChange={(e) => setDoctorData({ ...doctorData, specialty: e.target.value })}
              placeholder={language === 'ar' ? 'أدخل التخصص' : 'Enter specialty'}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ 
                borderColor: '#DBDBDB',
                ['--tw-ring-color' as any]: '#AF4B6C'
              }}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              <Phone className="w-4 h-4" style={{ color: '#AF4B6C' }} />
              {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
            </label>
            <input
              type="tel"
              value={doctorData.phoneNumber}
              onChange={(e) => setDoctorData({ ...doctorData, phoneNumber: e.target.value })}
              placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ 
                borderColor: '#DBDBDB',
                ['--tw-ring-color' as any]: '#AF4B6C'
              }}
            />
          </div>

          {/* License Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
              <FileText className="w-4 h-4" style={{ color: '#AF4B6C' }} />
              {language === 'ar' ? 'رقم الترخيص' : 'License Number'}
            </label>
            <input
              type="text"
              value={doctorData.licenseNumber}
              onChange={(e) => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
              placeholder={language === 'ar' ? 'أدخل رقم الترخيص' : 'Enter license number'}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ 
                borderColor: '#DBDBDB',
                ['--tw-ring-color' as any]: '#AF4B6C'
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: '#AF4B6C',
              color: 'white'
            }}
          >
            {saving ? (
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


