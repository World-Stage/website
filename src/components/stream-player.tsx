"use client";

import ReactPlayer from "react-player";
import { useStreamEvents } from "../hooks/useStreamEvents";

export function StreamPlayer() {
  const { streamUrl, isPlaying } = useStreamEvents();

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
      {streamUrl ? (
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
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-2xl">No stream available</div>
        </div>
      )}
    </div>
  );
} 