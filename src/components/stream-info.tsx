"use client";

import { useEffect, useState, useRef } from "react";
import { HandThumbUpIcon, HandThumbDownIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useStreamEvents } from "../hooks/useStreamEvents";

interface Streamer {
  id: string;
  username: string;
  title: string;
  timeRemaining: number;
}

export function StreamInfo() {
  const { formattedTimeRemaining, expirationTime } = useStreamEvents();
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [likeCount, setLikeCount] = useState(0); // Placeholder
  const [dislikeCount, setDislikeCount] = useState(0); // Placeholder
  const [timeAdded, setTimeAdded] = useState<number | null>(null);
  const prevExpirationTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial load
    fetch('http://localhost:8082/stream/view/active')
      .then(res => res.json())
      .then(data => {
        console.log(data);
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

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    // Calculate time added when expiration time changes
    if (expirationTime && prevExpirationTimeRef.current) {
      const addedSeconds = expirationTime - prevExpirationTimeRef.current;
      if (addedSeconds > 0) {
        setTimeAdded(addedSeconds);
        // Reset time added after animation duration
        setTimeout(() => setTimeAdded(null), 2000);
      }
    }
    
    prevExpirationTimeRef.current = expirationTime;
  }, [expirationTime]);

  const handleVote = async (vote: "keep" | "skip") => {
    if (hasVoted) return;
    try {
      const response = await fetch('http://localhost:8082/stream/view/vote', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType: vote }),
      });
      if (response.ok) {
        setHasVoted(true);
        if (vote === "keep") setLikeCount((c) => c + 1);
        if (vote === "skip") setDislikeCount((c) => c + 1);
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  return (
    <div className="w-full">
      {currentStreamer && (
        <>
          {/* Top info row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-lg md:text-xl">I am live!</span>
              <span className="text-gray-500 text-sm md:ml-4">by <span className="font-semibold">Fletchstud</span></span>
            </div>
            <div className="flex items-center gap-5">
              {formattedTimeRemaining && (
                <div className="flex items-center gap-1 relative">
                  <ClockIcon className="w-5 h-5" />
                  <span className="text-gray-500 text-sm">{formattedTimeRemaining}</span>
                  
                  {timeAdded && (
                    <span 
                      className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-green-400 font-medium text-sm animate-fade-up"
                    >
                      +{timeAdded}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <button
                  onClick={() => handleVote("keep")}
                  disabled={hasVoted}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  <HandThumbUpIcon className="w-5 h-5" />
                  <span>{likeCount}</span>
                </button>
                <button
                  onClick={() => handleVote("skip")}
                  disabled={hasVoted}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  <HandThumbDownIcon className="w-5 h-5" />
                  <span>{dislikeCount}</span>
                </button>
              </div>
            </div>
          </div>
          {/* Description box */}
          <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200">
            <p>i went through the steam workshop to find the most interesting maps... this was so much fun</p>
            <p className="mt-2 text-xs text-gray-500">i am live every day here: <span className="text-purple-600">/ohnpixel..more</span></p>
          </div>
        </>
      )}
    </div>
  );
} 