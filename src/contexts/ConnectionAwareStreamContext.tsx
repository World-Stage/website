"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ConnectionManager } from '../lib/connection/ConnectionManager';
import { SSEConnectionController, SSEState, Stream } from '../lib/connection/SSEConnectionController';
import { getSSEUrl } from '../lib/config/env';

interface StreamContextType {
  hlsUrl: string;
  expirationTime: number | null;
  stream: Stream | null;
  isPlaying: boolean;
  secondsRemaining: number | null;
  formattedTimeRemaining: string | null;
  timeAdded: number | null;
  streamId: string;
  setIsPlaying: (isPlaying: boolean) => void;
  isConnected: boolean;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

interface ConnectionAwareStreamProviderProps {
  children: ReactNode;
  connectionManager: ConnectionManager;
  sseUrl?: string;
}

export function ConnectionAwareStreamProvider({
  children,
  connectionManager,
  sseUrl = getSSEUrl()
}: ConnectionAwareStreamProviderProps) {
  const [hlsUrl, setHlsUrl] = useState('');
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [formattedTimeRemaining, setFormattedTimeRemaining] = useState<string | null>(null);
  const [timeAdded, setTimeAdded] = useState<number | null>(null);
  const [streamId, setStreamId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [controller, setController] = useState<SSEConnectionController | null>(null);
  const [prevExpirationTime, setPrevExpirationTime] = useState<number | null>(null);

  // Initialize the SSEConnectionController
  useEffect(() => {
    console.log('[ConnectionAwareStreamProvider] Initializing SSEConnectionController');
    
    const sseController = new SSEConnectionController({
      url: sseUrl,
      debug: true,
      onConnectionEvent: (eventType, metadata) => {
        console.log(`[ConnectionAwareStreamProvider] Connection event: ${eventType}`, metadata);
        if (eventType === 'connect') {
          setIsConnected(true);
          
          // If this is the initial data fetch event, sync state immediately
          if (metadata?.initialDataFetched) {
            console.log('[ConnectionAwareStreamProvider] Initial data fetched, syncing state immediately');
            const state = sseController.getState();
            setHlsUrl(state.hlsUrl);
            setStream(state.stream);
            setExpirationTime(state.expirationTime);
            setStreamId(state.streamId);
            if (state.hlsUrl) {
              setIsPlaying(true);
            }
            console.log('[ConnectionAwareStreamProvider] Initial state synced:', state);
          } else {
            // Regular connection event, sync after a small delay
            setTimeout(() => {
              const state = sseController.getState();
              setHlsUrl(state.hlsUrl);
              setStream(state.stream);
              setExpirationTime(state.expirationTime);
              setStreamId(state.streamId);
              if (state.hlsUrl) {
                setIsPlaying(true);
              }
              console.log('[ConnectionAwareStreamProvider] State synced after connection:', state);
            }, 100);
          }
        } else if (eventType === 'disconnect') {
          setIsConnected(false);
        }
      }
    });

    // Register the controller with the ConnectionManager
    connectionManager.registerController(sseController);
    setController(sseController);

    // Cleanup on unmount
    return () => {
      console.log('[ConnectionAwareStreamProvider] Disposing SSEConnectionController');
      sseController.dispose();
    };
  }, [connectionManager, sseUrl]);

  // Sync state from controller to component state
  useEffect(() => {
    if (!controller) return;

    // Function to sync state from controller
    const syncState = () => {
      const state = controller.getState();
      setHlsUrl(state.hlsUrl);
      setStream(state.stream);
      
      // Check if expiration time was added
      if (state.expirationTime && prevExpirationTime && state.expirationTime > prevExpirationTime) {
        setTimeAdded(state.expirationTime - prevExpirationTime);
        // Reset time added after animation duration
        setTimeout(() => setTimeAdded(null), 2000);
      }
      
      setPrevExpirationTime(state.expirationTime);
      setExpirationTime(state.expirationTime);
      setStreamId(state.streamId);
      
      // If we have a valid HLS URL, set isPlaying to true
      if (state.hlsUrl) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    };

    // Sync immediately if connected
    if (controller.isConnected) {
      syncState();
    }

    // Create an interval to sync state from the controller
    const syncInterval = setInterval(() => {
      if (controller.isConnected) {
        syncState();
      }
    }, 50); // Reduced interval for more responsive updates

    return () => {
      clearInterval(syncInterval);
    };
  }, [controller, prevExpirationTime]);

  // Update seconds remaining calculation
  useEffect(() => {
    if (!expirationTime) {
      setSecondsRemaining(null);
      setFormattedTimeRemaining(null);
      return;
    }
    
    const calculateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const remaining = expirationTime - now;
      
      if (remaining <= 0) {
        setSecondsRemaining(0);
        setFormattedTimeRemaining(null);
        return;
      }
      
      setSecondsRemaining(remaining);
      
      // Format time for display
      if (remaining >= 3600) {
        // Format as hours:minutes:seconds
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        setFormattedTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        // Format as minutes:seconds
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setFormattedTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    // Calculate immediately
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [expirationTime]);

  const value = {
    hlsUrl,
    expirationTime,
    stream,
    isPlaying,
    secondsRemaining,
    formattedTimeRemaining,
    timeAdded,
    streamId,
    setIsPlaying,
    isConnected
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useStream must be used within a ConnectionAwareStreamProvider');
  }
  return context;
}