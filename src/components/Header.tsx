'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MobileMenuButton } from './Sidebar';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <MobileMenuButton onClick={onMobileMenuOpen} />
          <div className="hidden sm:flex items-center gap-2 bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-2 w-80">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search QR codes..."
              className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />
          </button>
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-300 max-w-[150px] truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
