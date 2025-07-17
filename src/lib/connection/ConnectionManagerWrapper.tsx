'use client';

import { ReactNode } from 'react';
import { ConnectionManagerProvider } from './ConnectionManagerProvider';
import { ConnectionAwareWebSocketProvider } from '@/contexts/ConnectionAwareWebSocketContext';
import { ConnectionAwareStreamProvider } from '@/contexts/ConnectionAwareStreamContext';
import { ConnectionManagerConfig } from './types';

interface ConnectionManagerWrapperProps {
  children: ReactNode;
}

/**
 * ConnectionManagerWrapper
 * 
 * A wrapper component that initializes the ConnectionManager and provides
 * connection-aware context providers for WebSocket and SSE connections.
 * This component is used in the root layout to manage connections based on routing.
 */
export function ConnectionManagerWrapper({ children }: ConnectionManagerWrapperProps) {
  // Configuration for the ConnectionManager
  // Set active routes to only the root page (/) where streaming content is displayed
  const config: ConnectionManagerConfig = {
    // Only enable connections on the root page
    activeRoutes: ['/'],
    // Set debounce time for connection operations
    debounceTime: 300,
    // Enable debug mode in development environment
    debug: process.env.NODE_ENV === 'development'
  };

  // WebSocket URL - use environment variable if available or fallback to default
  const webSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8082/ws';
  
  // SSE URL - use environment variable if available or fallback to default
  const sseUrl = process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:8082/stream/view/subscribe';

  return (
    <ConnectionManagerProvider config={config}>
      {({ connectionManager }) => (
        <ConnectionAwareWebSocketProvider 
          connectionManager={connectionManager}
          webSocketUrl={webSocketUrl}
        >
          <ConnectionAwareStreamProvider
            connectionManager={connectionManager}
            sseUrl={sseUrl}
          >
            {children}
          </ConnectionAwareStreamProvider>
        </ConnectionAwareWebSocketProvider>
      )}
    </ConnectionManagerProvider>
  );
}