"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ConnectionManager } from '../lib/connection/ConnectionManager';
import { SSEConnectionController, SSEState, Streamer } from '../lib/connection/SSEConnectionController';

interface StreamContextType {
  hlsUrl: string;
  expirationTime: number | null;
  currentStreamer: Streamer | null;
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
  sseUrl = 'http://localhost:8082/stream/view/subscribe'
}: ConnectionAwareStreamProviderProps) {
  const [hlsUrl, setHlsUrl] = useState('');
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
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
    const sseController = new SSEConnectionController({
      url: sseUrl,
      debug: true,
      onConnectionEvent: (eventType, metadata) => {
        if (eventType === 'connect') {
          setIsConnected(true);
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
      sseController.dispose();
    };
  }, [connectionManager, sseUrl]);

  // Sync state from controller to component state
  useEffect(() => {
    if (!controller) return;

    // Create an interval to sync state from the controller
    const syncInterval = setInterval(() => {
      if (controller.isConnected) {
        const state = controller.getState();
        setHlsUrl(state.hlsUrl);
        setCurrentStreamer(state.currentStreamer);
        
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
      }
    }, 100);

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
    currentStreamer,
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
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
}