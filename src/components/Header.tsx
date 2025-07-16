"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';

export function Header() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (isLoading) {
    return (
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              WorldStage
            </h1>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              WorldStage
            </h1>
            
            <div className="flex items-center space-x-4">
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      setIsLoginMode(true);
                      setShowAuthModal(true);
                    }}
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md font-medium transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setIsLoginMode(false);
                      setShowAuthModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
              <UserMenu onShowAuthModal={() => setShowAuthModal(true)} />
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={isLoginMode ? 'login' : 'signup'}
      />
    </>
  );
} 