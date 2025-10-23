
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Link2, Search, ArrowLeft, Plus, X, Trash2, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';

interface Connection {
  id: string;
  connectedAt: string;
  status: string;
  doctor: {
    id: string;
    fullName: string;
    email: string;
  };
  patient: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function AdminConnectionsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchConnections();
    }
  }, [status, router, session]);

  useEffect(() => {
    filterConnections();
  }, [connections, searchQuery]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/admin/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsAndPatients = async () => {
    try {
      // Fetch all users
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const doctorsList = data.users?.filter((u: User) => u.role === 'doctor') || [];
        const patientsList = data.users?.filter((u: User) => u.role === 'patient') || [];
        setDoctors(doctorsList);
        setPatients(patientsList);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    fetchDoctorsAndPatients();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDoctorId('');
    setSelectedPatientId('');
  };

  const handleCreateConnection = async () => {
    if (!selectedDoctorId || !selectedPatientId) {
      alert('Please select both doctor and patient');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          patientId: selectedPatientId,
        }),
      });

      if (response.ok) {
        alert('Connection created successfully');
        handleCloseModal();
        fetchConnections();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create connection');
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      alert('Failed to create connection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this doctor-patient pair?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/connections?connectionId=${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Connection deleted successfully');
        fetchConnections();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete connection');
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('Failed to delete connection');
    }
  };

  const filterConnections = () => {
    let filtered = [...connections];
    
    if (searchQuery) {
      filtered = filtered.filter(connection =>
        connection.doctor.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.doctor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredConnections(filtered);
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
              All Connections
            </h1>
            <p className="text-sm text-gray-600">{connections.length} connections</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: '#AF4B6C' }}
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 bg-white focus:ring-2 focus:ring-[#AF4B6C]"
          />
        </div>

        {/* Connections List */}
        <div className="space-y-3">
          {filteredConnections.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-md">
              <Link2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No connections found</p>
            </div>
          ) : (
            filteredConnections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    connection.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {connection.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(connection.connectedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                        Dr. {connection.doctor.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{connection.doctor.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                        {connection.patient.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{connection.patient.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/admin/patients/${connection.patient.id}`)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: '#AF4B6C' }}
                  >
                    View Patient
                  </button>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="py-2 px-4 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#3F0F22' }}>
                Create New Connection
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#AF4B6C]"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.fullName} ({doctor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#AF4B6C]"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} ({patient.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                className="flex-1 py-3 rounded-lg text-white font-medium transition-all"
                style={{ backgroundColor: '#AF4B6C' }}
                disabled={submitting || !selectedDoctorId || !selectedPatientId}
              >
                {submitting ? 'Creating...' : 'Create Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function UserCog(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M6.5 8a3 3 0 0 0 0 6"/><path d="M6.5 20a3 3 0 0 0 0-6"/><path d="M17.5 8a3 3 0 0 1 0 6"/><path d="M17.5 20a3 3 0 0 1 0-6"/><path d="M12 2v6"/><path d="M12 16v6"/></svg>
  );
}

function TrendingUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  );
}
