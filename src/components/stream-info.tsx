"use client";

import { useEffect, useState } from "react";

interface Streamer {
  id: string;
  username: string;
  title: string;
  timeRemaining: number;
}

interface QueueItem {
  id: string;
  username: string;
  position: number;
}

interface QueueResponseItem {
  streamerId: string;
  streamerName: string;
}

export function StreamInfo() {
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    // Initial load
    fetch('http://localhost:8082/stream/view/active')
      .then(res => res.json())
      .then(data => {
        setCurrentStreamer({
          id: data.streamerId,
          username: data.streamerName,
          title: data.title,
          timeRemaining: data.timeRemaining
        });
      });

    // Subscribe to SSE for updates
    const eventSource = new EventSource('http://localhost:8082/stream/view/subscribe');
    
    eventSource.addEventListener('stream-update', event => {
      const data = JSON.parse(event.data);
      setCurrentStreamer({
        id: data.streamerId,
        username: data.streamerName,
        title: data.title,
        timeRemaining: data.timeRemaining
      });
    });

    eventSource.addEventListener('queue-update', event => {
      const data = JSON.parse(event.data);
      setQueue(data.queue.map((item: QueueResponseItem, index: number) => ({
        id: item.streamerId,
        username: item.streamerName,
        position: index + 1
      })));
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      {currentStreamer && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Now Streaming</h2>
          <div className="space-y-2">
            <p className="font-medium">{currentStreamer.username}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentStreamer.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Time remaining: {currentStreamer.timeRemaining}s
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Up Next</h3>
        <div className="space-y-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <span>{item.username}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{item.position}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 