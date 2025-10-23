
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserCog, 
  Shield, 
  TrendingUp, 
  Image, 
  FileText,
  Link2
} from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { BottomNav } from '@/components/bottom-nav';

interface Stats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAdmins: number;
  totalConnections: number;
  totalPhotos: number;
  totalNotes: number;
}

interface RecentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface RecentConnection {
  id: string;
  connectedAt: string;
  doctor: {
    fullName: string;
    email: string;
  };
  patient: {
    fullName: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentConnections, setRecentConnections] = useState<RecentConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchAdminStats();
    }
  }, [status, router, session]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setRecentConnections(data.recentConnections);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
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

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-top">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ color: '#AF4B6C' }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                System overview and management
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Total Users</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalUsers || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Patients</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalPatients || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Doctors</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalDoctors || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Admins</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalAdmins || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Connections</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalConnections || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Photos</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalPhotos || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium text-gray-600">Doctor Notes</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {stats?.totalNotes || 0}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                Manage Users
              </span>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/patients')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                View Patients
              </span>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/doctors')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <UserCog className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                View Doctors
              </span>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/connections')}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Link2 className="w-8 h-8" style={{ color: '#AF4B6C' }} />
              <span className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                View Connections
              </span>
            </div>
          </button>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            Recent Users
          </h3>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No users yet</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium" style={{ color: '#3F0F22' }}>
                      {user.fullName}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Connections */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            Recent Connections
          </h3>
          <div className="space-y-3">
            {recentConnections.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No connections yet</p>
            ) : (
              recentConnections.map((connection) => (
                <div key={connection.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: '#3F0F22' }}>
                      Dr. {connection.doctor.fullName}
                    </p>
                    <Link2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {connection.patient.fullName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(connection.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
