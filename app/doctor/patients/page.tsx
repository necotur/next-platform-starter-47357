

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, MessageCircle, ChevronRight, Search } from 'lucide-react';
import { formatDateWithSolarMonth } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  connectedAt: string;
  status: string;
}

export default function DoctorPatientsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      fetchPatients();
      fetchUnreadCounts();
    }
  }, [status, router, session]);

  // Poll for unread counts every 5 seconds
  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(fetchUnreadCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/doctor/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const response = await fetch('/api/chat/unread-counts');
      if (response.ok) {
        const data = await response.json();
        setUnreadCounts(data.countsMap || {});
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
            My Patients
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
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
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Send invitations to connect with your patients'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/doctor/invitations')}
                className="px-6 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                Send Invitation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient) => {
              const unreadCount = unreadCounts[patient.id] || 0;
              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="relative w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                        style={{ backgroundColor: '#AF4B6C' }}
                      >
                        {patient.fullName?.[0]?.toUpperCase() || 'P'}
                        {unreadCount > 0 && (
                          <span 
                            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-white text-xs font-bold px-1 border-2 border-white"
                            style={{ backgroundColor: '#EF4444' }}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate" style={{ color: '#3F0F22' }}>
                          {patient.fullName || 'Patient'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{patient.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate">
                            Connected {formatDateWithSolarMonth(patient.connectedAt, language)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/chat?userId=${patient.id}`);
                        }}
                        className="relative p-2 rounded-lg hover:bg-gray-100 transition-all flex-shrink-0"
                      >
                        <MessageCircle className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                        {unreadCount > 0 && (
                          <span 
                            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
                            style={{ backgroundColor: '#EF4444' }}
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

