"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  seconds: number;
}

export function CountdownTimer({ seconds }: CountdownTimerProps) {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);
  const previousSeconds = useRef(seconds);
  const progressRef = useRef<SVGCircleElement>(null);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const endPercentageRef = useRef(0);
  
  // Calculate the circumference of the circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Update the animation frame on seconds change
  useEffect(() => {
    // Set the display value immediately for the text
    setDisplaySeconds(seconds);
    
    // Calculate start and target percentages
    const startPercentage = (previousSeconds.current / 5) * 100;
    const endPercentage = (seconds / 5) * 100;
    
    endPercentageRef.current = Math.min(100, Math.max(0, endPercentage));
    
    // Store the start time when we begin the animation
    startTimeRef.current = performance.now();
    
    // Cancel any existing animation
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    // Start smooth animation
    const animateProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      // Calculate elapsed time (animation duration: 300ms)
      const elapsed = timestamp - startTimeRef.current;
      const duration = 300; // ms
      const progress = Math.min(elapsed / duration, 1);
      
      // Calculate the current percentage based on animation progress
      const currentPercentage = startPercentage + progress * (endPercentageRef.current - startPercentage);
      
      // Apply the stroke-dashoffset
      if (progressRef.current) {
        const strokeDashoffset = circumference * (1 - currentPercentage / 100);
        progressRef.current.style.strokeDashoffset = strokeDashoffset.toString();
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animateProgress);
      }
    };
    
    // Start the animation
    frameRef.current = requestAnimationFrame(animateProgress);
    
    // Update previous seconds for next animation
    previousSeconds.current = seconds;
    
    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [seconds, circumference]);
  
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center justify-center w-16 h-16 pointer-events-none">
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="black" 
          fillOpacity="0.5" 
          stroke="#666" 
          strokeWidth="4"
        />
        
        {/* Progress circle */}
        <circle 
          ref={progressRef}
          cx="50" 
          cy="50" 
          r={radius}
          fill="transparent" 
          stroke="white" 
          strokeWidth="4"
          strokeDasharray={circumference} 
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        
        {/* Countdown number */}
        <text 
          x="50" 
          y="50" 
          fill="white" 
          fontSize="32" 
          fontWeight="bold" 
          textAnchor="middle"
          dominantBaseline="central"
        >
          {displaySeconds}
        </text>
      </svg>
    </div>
  );
} 