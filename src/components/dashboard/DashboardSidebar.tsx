"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  VideoCameraIcon, 
  FilmIcon, 
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number | boolean;
}

interface DashboardSidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
}

export function DashboardSidebar({ 
  isMobileSidebarOpen, 
  setIsMobileSidebarOpen 
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isLive, setIsLive] = useState(false);
  
  // This would be replaced with actual stream status from context in a real implementation
  useEffect(() => {
    // Simulate checking if user is currently streaming
    const checkStreamStatus = async () => {
      // In a real implementation, this would fetch from an API or context
      setIsLive(false);
    };
    
    checkStreamStatus();
    
    // Set up polling or SSE connection in real implementation
    const interval = setInterval(checkStreamStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const navigationItems: NavigationItem[] = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      href: '/dashboard',
    },
    {
      id: 'stream-manager',
      label: 'Stream Manager',
      icon: VideoCameraIcon,
      href: '/dashboard/stream',
      badge: isLive,
    },
    {
      id: 'content-library',
      label: 'Content Library',
      icon: FilmIcon,
      href: '/dashboard/content',
    },
    {
      id: 'monetization',
      label: 'Monetization',
      icon: CurrencyDollarIcon,
      href: '/dashboard/monetization',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) { // lg breakpoint
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Creator Dashboard</h2>
      <nav className="space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={closeMobileSidebar}
            className={`flex items-center px-3 py-3 rounded-md transition-colors group ${
              isActive(item.href)
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon 
              className={`w-5 h-5 mr-3 ${
                isActive(item.href)
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
              }`} 
            />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={`
                ${typeof item.badge === 'boolean' && item.badge 
                  ? 'bg-red-500 text-white px-2 py-0.5 text-xs rounded-full flex items-center'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs rounded-full'
                }
              `}>
                {typeof item.badge === 'boolean' ? 'LIVE' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}