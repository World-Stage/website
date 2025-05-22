"use client";

import ReactPlayer from "react-player";
import { useStreamEvents } from "../hooks/useStreamEvents";
import { CountdownTimer } from "./countdown-timer";

export function StreamPlayer() {
  const { streamUrl, isPlaying, secondsRemaining } = useStreamEvents();

  // Only show countdown when 5 seconds or less remaining
  const showCountdown = secondsRemaining !== null && secondsRemaining <= 5 && secondsRemaining > 0;

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
      {streamUrl ? (
        <>
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
          {showCountdown && <CountdownTimer seconds={secondsRemaining} />}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-2xl">No stream available</div>
        </div>
      )}
    </div>
  );
} 