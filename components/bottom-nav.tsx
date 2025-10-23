

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Camera, Clock, FileText, MoreHorizontal, MessageCircle, Users, UserPlus, Shield, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { t, language } = useLanguage();
  const [hasDoctor, setHasDoctor] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    const checkDoctorConnection = async () => {
      const user = session?.user as any;
      if (user?.role === 'patient') {
        try {
          const response = await fetch('/api/patient/connect');
          if (response.ok) {
            const data = await response.json();
            setHasDoctor(data.connected);
          }
        } catch (error) {
          console.error('Error checking doctor connection:', error);
        }
      }
    };

    if (session) {
      checkDoctorConnection();
    }
  }, [session]);

  // Fetch unread message counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const response = await fetch('/api/chat/unread-counts');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.totalUnread || 0);
        }
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    if (session) {
      fetchUnreadCounts();
      // Poll every 5 seconds for new messages
      const interval = setInterval(fetchUnreadCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Admin navigation items
  const adminNavItems: Array<{ href: string; icon: any; label: string; badge?: number }> = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/patients', icon: FileText, label: 'Patients' },
    { href: '/admin/doctors', icon: UserPlus, label: 'Doctors' },
    { href: '/more', icon: MoreHorizontal, label: 'More' },
  ];

  // Doctor navigation items
  const doctorNavItems: Array<{ href: string; icon: any; label: string; badge?: number }> = [
    { href: '/doctor/dashboard', icon: Home, label: t.nav.dashboard },
    { href: '/doctor/patients', icon: Users, label: t.nav.patients },
    { href: '/chat', icon: MessageCircle, label: t.nav.chat, badge: unreadCount > 0 ? unreadCount : undefined },
    { href: '/doctor/invitations', icon: UserPlus, label: t.nav.invitations },
    { href: '/more', icon: MoreHorizontal, label: t.nav.more },
  ];

  // Patient navigation items - always show 6 tabs including chat
  const patientNavItems: Array<{ href: string; icon: any; label: string; badge?: number }> = [
    { href: '/dashboard', icon: Home, label: t.nav.dashboard },
    { href: '/photos', icon: Camera, label: t.nav.photos },
    { href: '/track', icon: Clock, label: t.nav.track },
    { href: '/chat', icon: MessageCircle, label: t.nav.chat, badge: unreadCount > 0 ? unreadCount : undefined },
    { href: '/achievements', icon: Award, label: language === 'ar' ? 'الإنجازات' : 'Achievements' },
    { href: '/more', icon: MoreHorizontal, label: t.nav.more },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : (userRole === 'doctor' ? doctorNavItems : patientNavItems);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full transition-colors"
            >
              <div className="relative">
                <Icon
                  className="w-6 h-6 mb-1"
                  style={{ color: isActive ? '#AF4B6C' : '#6B7280' }}
                />
                {item.badge && (
                  <span 
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
                    style={{ backgroundColor: '#AF4B6C' }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium truncate max-w-[60px]"
                style={{ color: isActive ? '#AF4B6C' : '#6B7280' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

