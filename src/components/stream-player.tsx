"use client";

import ReactPlayer from "react-player";
import { useStreamEvents } from "../hooks/useStreamEvents";
import { CountdownTimer } from "./countdown-timer";
import { useState, useRef, useEffect } from "react";

export function StreamPlayer() {
  const { streamUrl, isPlaying, secondsRemaining } = useStreamEvents();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  // Only show countdown when 5 seconds or less remaining
  const showCountdown = secondsRemaining !== null && secondsRemaining <= 5 && secondsRemaining > 0;

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Custom fullscreen toggle handler
  const handleFullscreen = () => {
    if (!document.fullscreenElement && playerWrapperRef.current) {
      playerWrapperRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={playerWrapperRef}
      className="relative aspect-video w-full bg-black rounded-lg overflow-hidden"
    >
      {streamUrl ? (
        <div className="relative w-full h-full">
          <ReactPlayer
            url={streamUrl}
            playing={isPlaying}
            width="100%"
            height="100%"
            controls={true}
            playsinline
            config={{
              file: {
                forceHLS: true,
                attributes: {
                  // Disable native fullscreen to use our custom one
                  controlsList: "nodownload",
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                }
              },
            }}
          />
          
          {/* Custom controls overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {showCountdown && <CountdownTimer seconds={secondsRemaining} />}
          </div>
          
          {/* Custom fullscreen button */}
          <button
            onClick={handleFullscreen}
            className="absolute bottom-4 right-12 z-40 p-2 bg-black bg-opacity-50 rounded-full text-white"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-2xl">No stream available</div>
        </div>
      )}
    </div>
  );
} 