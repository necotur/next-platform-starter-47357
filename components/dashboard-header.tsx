
'use client';

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function DashboardHeader({ title }: { title: string }) {
  return (
    <header className="bg-white border-b border-gray-200 safe-top">
      <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-96 h-32">
            <Image
              src="/logo2h.png"
              alt="Seamless Smile"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </button>
          <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-6 h-6" style={{ color: '#3F0F22' }} />
          </Link>
        </div>
      </div>
    </header>
  );
}
