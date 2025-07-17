'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConnectionManager } from './ConnectionManager';
import { ConnectionManagerConfig } from './types';
import { RouteChangeDetector, RouteChangeHandler } from './RouteChangeDetector';

// Create a React context to provide the ConnectionManager instance
import { createContext, useContext } from 'react';

const ConnectionManagerContext = createContext<ConnectionManager | null>(null);

export const useConnectionManager = () => {
  const context = useContext(ConnectionManagerContext);
  if (!context) {
    throw new Error('useConnectionManager must be used within a ConnectionManagerProvider');
  }
  return context;
};

interface ConnectionManagerProviderProps {
  children: ReactNode | ((props: { connectionManager: ConnectionManager }) => ReactNode);
  config: ConnectionManagerConfig;
}

export function ConnectionManagerProvider({ 
  children, 
  config 
}: ConnectionManagerProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [connectionManager] = useState(() => new ConnectionManager(config));
  const routeDetectorRef = useRef<RouteChangeDetector | null>(null);

  // Initialize the RouteChangeDetector
  useEffect(() => {
    // Create the route change detector with the same debounce time and debug settings as the connection manager
    const routeDetector = new RouteChangeDetector({
      debounceTime: config.debounceTime,
      debug: config.debug
    });

    // Create a handler that forwards route changes to the connection manager
    const handler: RouteChangeHandler = {
      onRouteChange: (newRoute, previousRoute) => {
        connectionManager.handleRouteChange(newRoute);
      }
    };

    // Register the handler
    routeDetector.registerHandler(handler);
    
    // Store the detector in a ref for later use
    routeDetectorRef.current = routeDetector;

    // Clean up on unmount
    return () => {
      routeDetector.unregisterHandler(handler);
    };
  }, [connectionManager, config.debounceTime, config.debug]);

  // Handle route changes from Next.js
  useEffect(() => {
    if (routeDetectorRef.current) {
      routeDetectorRef.current.handleRouteChange(pathname);
    }
  }, [pathname]);

  // Listen for additional navigation events that might not be captured by usePathname
  useEffect(() => {
    // This is a placeholder for future enhancements
    // Next.js doesn't currently expose all navigation events directly
    // but this structure allows for future extensions
    
    // For example, if Next.js adds a navigation event system in the future:
    // router.events.on('routeChangeStart', handleRouteChangeStart);
    // router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      // Clean up any event listeners
    };
  }, [router]);

  return (
    <ConnectionManagerContext.Provider value={connectionManager}>
      {typeof children === 'function' 
        ? children({ connectionManager }) 
        : children}
    </ConnectionManagerContext.Provider>
  );
}