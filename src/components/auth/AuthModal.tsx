"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  // Update the mode when initialMode prop changes
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  if (!isOpen) return null;

  const handleAuthSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          {isLogin ? (
            <LoginForm 
              onSwitchToSignup={() => setIsLogin(false)} 
              onAuthSuccess={handleAuthSuccess}
            />
          ) : (
            <SignupForm 
              onSwitchToLogin={() => setIsLogin(true)} 
              onAuthSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
} 