import { useState, useEffect } from 'react';

interface StreamData {
  hlsUrl: string;
  expirationTime: number | null;
}

export function useStreamEvents() {
  const [streamData, setStreamData] = useState<StreamData>({
    hlsUrl: '',
    expirationTime: null
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [formattedTimeRemaining, setFormattedTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    // Initial stream load
    fetch('http://localhost:8082/stream/view/active')
      .then(res => res.json())
      .then(data => {
        const hlsUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
        setStreamData(prev => ({ ...prev, hlsUrl }));
        setIsPlaying(true);
      });

    // Subscribe to SSE for stream updates
    const eventSource = new EventSource('http://localhost:8082/stream/view/subscribe');
    
    eventSource.addEventListener('new-stream', event => {
      const data = JSON.parse(event.data);
      const hlsUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
      console.log('New stream detected:', hlsUrl);
      setStreamData(prev => ({ ...prev, hlsUrl }));
      setIsPlaying(true);
    });

    eventSource.addEventListener('stream-expiration', event => {
      const expirationTime = JSON.parse(event.data);
      console.log('Stream expiration time updated (seconds):', expirationTime);
      setStreamData(prev => ({ ...prev, expirationTime }));
    });

    eventSource.onerror = err => console.error('SSE error:', err);

    return () => {
      eventSource.close();
    };
  }, []);

  // Update seconds remaining calculation
  useEffect(() => {
    if (!streamData.expirationTime) {
      setSecondsRemaining(null);
      setFormattedTimeRemaining(null);
      return;
    }
    
    const calculateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expirationTime = streamData.expirationTime as number;
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
  }, [streamData.expirationTime]);

  return {
    streamUrl: streamData.hlsUrl,
    expirationTime: streamData.expirationTime,
    secondsRemaining,
    formattedTimeRemaining,
    isPlaying,
    setIsPlaying
  };
} 