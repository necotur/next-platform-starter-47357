
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Shield, Stethoscope, Heart, Crown, Loader2, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  specialty?: string | null;
  clinicName?: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // @ts-ignore
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setUpdatingUserId(userId);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update user role');

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      setError('Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-5 h-5" style={{ color: '#AF4B6C' }} />;
      case 'doctor':
        return <Stethoscope className="w-5 h-5" style={{ color: '#AF4B6C' }} />;
      case 'patient':
        return <Heart className="w-5 h-5" style={{ color: '#AF4B6C' }} />;
      default:
        return <Users className="w-5 h-5" style={{ color: '#AF4B6C' }} />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#3F0F22';
      case 'doctor':
        return '#AF4B6C';
      case 'patient':
        return '#DBDBDB';
      default:
        return '#DBDBDB';
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#AF4B6C' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12">
              <Image src="/logo1v.png" alt="Logo" fill className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
              {language === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
            </h1>
          </div>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'إدارة المستخدمين وتغيير الأدوار'
              : 'Manage users and change roles'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF5F8' }}>
                <Users className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#3F0F22' }}>{users.length}</p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF5F8' }}>
                <Heart className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                  {users.filter(u => u.role === 'patient').length}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'المرضى' : 'Patients'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF5F8' }}>
                <Stethoscope className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                  {users.filter(u => u.role === 'doctor').length}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'الأطباء' : 'Doctors'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF5F8' }}>
                <Crown className="w-6 h-6" style={{ color: '#AF4B6C' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#3F0F22' }}>
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'المسؤولون' : 'Admins'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث عن مستخدم...' : 'Search users...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#FFF5F8' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#3F0F22' }}>
                    {language === 'ar' ? 'المستخدم' : 'User'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#3F0F22' }}>
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#3F0F22' }}>
                    {language === 'ar' ? 'الدور الحالي' : 'Current Role'}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#3F0F22' }}>
                    {language === 'ar' ? 'تغيير الدور إلى' : 'Change Role To'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF5F8' }}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#3F0F22' }}>
                            {user.fullName || 'N/A'}
                          </p>
                          {user.specialty && (
                            <p className="text-xs text-gray-500">{user.specialty}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.clinicName && (
                        <p className="text-xs text-gray-500">{user.clinicName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                      >
                        {getRoleIcon(user.role)}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.role !== 'patient' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'patient')}
                            disabled={updatingUserId === user.id}
                            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:border-opacity-70 transition-all disabled:opacity-50"
                            style={{ color: '#3F0F22' }}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              language === 'ar' ? 'مريض' : 'Patient'
                            )}
                          </button>
                        )}
                        {user.role !== 'doctor' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'doctor')}
                            disabled={updatingUserId === user.id}
                            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:border-opacity-70 transition-all disabled:opacity-50"
                            style={{ color: '#3F0F22' }}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              language === 'ar' ? 'طبيب' : 'Doctor'
                            )}
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'admin')}
                            disabled={updatingUserId === user.id}
                            className="px-3 py-1 text-sm rounded-lg text-white transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#AF4B6C' }}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              language === 'ar' ? 'مسؤول' : 'Admin'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                {language === 'ar' ? 'لم يتم العثور على مستخدمين' : 'No users found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
