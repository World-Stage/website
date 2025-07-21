"use client";

import ReactPlayer from "react-player";
import { CountdownTimer } from "./countdown-timer";
import { useState, useRef, useEffect } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import { useStream } from "@/contexts/hooks";

export function StreamPlayer() {
  const { hlsUrl, secondsRemaining, streamId } = useStream();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Show/hide controls based on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(false);
  };

  // Volume controls
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={playerWrapperRef}
      className="relative aspect-video w-full bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {hlsUrl ? (
        <div className="relative w-full h-full">
          <ReactPlayer
            key={streamId} // Use the unique stream ID
            ref={playerRef}
            url={hlsUrl}
            playing={true}
            volume={isMuted ? 0 : volume}
            width="100%"
            height="100%"
            controls={false}
            playsinline
            muted={false}
            config={{
              file: {
                forceHLS: true,
                attributes: {
                  controlsList: "nodownload",
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                },
                // Enhanced HLS configuration for better ABR control
                hlsOptions: {
                  // Enable automatic quality switching (both up and down)
                  autoStartLoad: true,
                  // Start with lowest quality and work up (-1 = auto)
                  startLevel: -1,
                  // Enable bandwidth estimation
                  enableWorker: true,
                  
                  // Quality switching thresholds
                  abrEwmaDefaultEstimate: 500000, // 500kbps default estimate
                  abrBandWidthFactor: 0.95,      // Conservative bandwidth usage
                  abrBandWidthUpFactor: 0.7,     // More conservative for upward switching
                  
                  // Buffer configuration
                  maxBufferLength: 30,           // Max buffer in seconds
                  maxMaxBufferLength: 600,       // Absolute max buffer
                  
                  // Upward switching behavior
                  abrMaxWithRealBitrate: true,   // Use real bitrate for decisions
                  abrEwmaFastLive: 3.0,          // Fast adaptation for live content
                  abrEwmaSlowLive: 9.0,          // Slow adaptation for stability
                  
                  // Quality switching frequency
                  abrEwmaFast: 3.0,              // Fast adaptation
                  abrEwmaSlow: 9.0,              // Slow adaptation for stability
                }
              },
            }}
          />
          
          {/* Custom controls overlay */}
          <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            {/* Top bar (empty now since countdown moved outside) */}
            <div className="pointer-events-none"></div>
            
            {/* Bottom controls bar */}
            <div className="bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Volume control */}
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={handleMuteToggle} 
                      className="text-white focus:outline-none"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <SpeakerXMarkIcon className="w-5 h-5" />
                      ) : (
                        <SpeakerWaveIcon className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step="any"
                      value={volume}
                      className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>
                
                {/* Fullscreen button */}
                <button
                  onClick={handleFullscreen}
                  className="text-white p-1 focus:outline-none"
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
            </div>
          </div>
          
          {/* Stream ending countdown overlay */}
          {showCountdown && (
            <div className="absolute top-4 right-4 z-10">
              <CountdownTimer seconds={secondsRemaining} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-2xl">No stream available</div>
        </div>
      )}
    </div>
  );
} 