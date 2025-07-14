"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useState } from 'react';

interface ProtectedFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
  showAuthPrompt?: boolean;
}

export function ProtectedFeature({ 
  children, 
  fallback,
  showAuthPrompt = true 
}: ProtectedFeatureProps) {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAuthPrompt) {
    return (
      <>
        <div 
          className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          onClick={() => setShowAuthModal(true)}
        >
          <div className="text-center">
            <div className="text-sm font-medium mb-1">Login Required</div>
            <div className="text-xs">Click to sign in</div>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return null;
} 