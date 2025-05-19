"use client";

import ReactPlayer from "react-player";
import { useEffect, useState } from "react";

export function StreamPlayer() {
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initial stream load
    fetch('http://localhost:8082/stream/view/active')
      .then(res => res.json())
      .then(data => {
        const hlsUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
        setStreamUrl(hlsUrl);
        setIsPlaying(true);
      });

    // Subscribe to SSE for stream updates
    const eventSource = new EventSource('http://localhost:8082/stream/view/subscribe');
    eventSource.addEventListener('new-stream', event => {
      const data = JSON.parse(event.data);
      const hlsUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
      console.log('New stream detected:', hlsUrl);
      setStreamUrl(hlsUrl);
      setIsPlaying(true);
    });

    eventSource.onerror = err => console.error('SSE error:', err);

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
      {streamUrl && (
        <ReactPlayer
          url={streamUrl}
          playing={isPlaying}
          width="100%"
          height="100%"
          controls
          playsinline
          config={{
            file: {
              forceHLS: true,
            },
          }}
        />
      )}
    </div>
  );
} 