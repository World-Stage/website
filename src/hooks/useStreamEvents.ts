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

  return {
    streamUrl: streamData.hlsUrl,
    expirationTime: streamData.expirationTime,
    isPlaying,
    setIsPlaying
  };
} 