"use client";

import { useState, useRef, useEffect } from 'react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownThemeToggle } from '@/components/theme-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserMenuProps {
  onShowAuthModal: () => void;
}

export function UserMenu({ onShowAuthModal }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <UserCircleIcon className="w-6 h-6" />
        {user && <span className="hidden sm:block font-medium">{user.username}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          {/* User Profile Section (if signed in) */}
          {user && (
            <>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Menu Items */}
          <div className="py-1">

            {/* Theme Toggle */}
            <DropdownThemeToggle />

            {/* Separator */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            {/* Home Link - Only shown when not on home page */}
            {!isHomePage && (
              <Link
                href="/"
                className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HomeIcon className="w-5 h-5 mr-3" />
                <span>Go Back Home</span>
              </Link>
            )}

            {/* Dashboard Link - Only shown when authenticated */}
            {user && (
              <>
                {!isHomePage && <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>}
                <Link
                  href="/dashboard"
                  className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ChartBarIcon className="w-5 h-5 mr-3" />
                  <span>Creator Dashboard</span>
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              </>
            )}

            {/* Auth Action */}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onShowAuthModal();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 