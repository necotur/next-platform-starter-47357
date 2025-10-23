
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserCog, Search, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';

interface Doctor {
  id: string;
  email: string;
  fullName: string;
  specialty?: string;
  clinicName?: string;
  createdAt: string;
  _count: {
    doctorPatients: number;
  };
}

export default function AdminDoctorsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchDoctors();
    }
  }, [status, router, session]);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/admin/users?role=doctor');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];
    
    if (searchQuery) {
      filtered = filtered.filter(doctor =>
        doctor.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDoctors(filtered);
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
              All Doctors
            </h1>
            <p className="text-sm text-gray-600">{doctors.length} doctors</p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 bg-white focus:ring-2 focus:ring-[#AF4B6C]"
          />
        </div>

        {/* Doctors List */}
        <div className="space-y-3">
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-md">
              <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No doctors found</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-xl p-4 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" style={{ color: '#3F0F22' }}>
                      Dr. {doctor.fullName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{doctor.email}</p>
                    
                    {doctor.specialty && (
                      <p className="text-sm text-gray-500 mb-1">Specialty: {doctor.specialty}</p>
                    )}
                    {doctor.clinicName && (
                      <p className="text-sm text-gray-500 mb-1">Clinic: {doctor.clinicName}</p>
                    )}
                    
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{doctor._count.doctorPatients} patients</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(doctor.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
