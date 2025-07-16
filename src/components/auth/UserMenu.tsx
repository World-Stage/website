"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  TagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';

interface UserMenuProps {
  onShowAuthModal: () => void;
}

export function UserMenu({ onShowAuthModal }: UserMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
            {/* Language Option */}
            <button className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <GlobeAltIcon className="w-5 h-5 mr-3" />
              <span>Language</span>
              <ArrowRightIcon className="w-4 h-4 ml-auto" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                {theme === 'dark' ? (
                  <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                )}
              </div>
              <span>Dark Theme</span>
            </button>

            {/* Opt-out Preferences */}
            <button className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <InformationCircleIcon className="w-5 h-5 mr-3" />
              <span>Opt-out Preferences</span>
            </button>

            {/* Labeled Content */}
            <button className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <TagIcon className="w-5 h-5 mr-3" />
              <span>Labeled Content</span>
              <ArrowRightIcon className="w-4 h-4 ml-auto" />
            </button>

            {/* Separator */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

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