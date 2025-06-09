"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

interface Streamer {
  id: string;
  username: string;
  title: string;
  timeRemaining: number;
}

interface StreamContextType {
  hlsUrl: string;
  expirationTime: number | null;
  currentStreamer: Streamer | null;
  isPlaying: boolean;
  secondsRemaining: number | null;
  formattedTimeRemaining: string | null;
  timeAdded: number | null;
  setIsPlaying: (isPlaying: boolean) => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: ReactNode }) {
  const [hlsUrl, setHlsUrl] = useState('');
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [formattedTimeRemaining, setFormattedTimeRemaining] = useState<string | null>(null);
  const [timeAdded, setTimeAdded] = useState<number | null>(null);
  const prevExpirationTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial stream load
    fetch('http://localhost:8082/stream/view/active')
      .then(res => res.json())
      .then(data => {
        const streamUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
        setHlsUrl(streamUrl);
        setCurrentStreamer({
          id: data.streamerId,
          username: data.streamerName,
          title: data.title,
          timeRemaining: data.timeRemaining
        });
        setIsPlaying(true);
      });

    // Subscribe to SSE for stream updates
    const eventSource = new EventSource('http://localhost:8082/stream/view/subscribe');
    
    eventSource.addEventListener('new-stream', event => {
      const data = JSON.parse(event.data);
      const streamUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
      console.log('New stream detected:', streamUrl);
      setHlsUrl(streamUrl);
      setIsPlaying(true);
    });

    eventSource.addEventListener('stream-update', event => {
      const data = JSON.parse(event.data);
      setCurrentStreamer({
        id: data.streamerId,
        username: data.streamerName,
        title: data.title,
        timeRemaining: data.timeRemaining
      });
    });

    eventSource.addEventListener('stream-expiration', event => {
      const newExpirationTime = JSON.parse(event.data);
      console.log('Stream expiration time updated (seconds):', newExpirationTime);
      
      // Check if time was added
      if (prevExpirationTimeRef.current && newExpirationTime > prevExpirationTimeRef.current) {
        setTimeAdded(newExpirationTime - prevExpirationTimeRef.current);
        // Reset time added after animation duration
        setTimeout(() => setTimeAdded(null), 2000);
      }
      
      prevExpirationTimeRef.current = newExpirationTime;
      setExpirationTime(newExpirationTime);
    });

    eventSource.onerror = err => console.error('SSE error:', err);

    return () => {
      eventSource.close();
    };
  }, []);

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
    setIsPlaying
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