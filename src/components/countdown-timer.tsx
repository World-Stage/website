"use client";

interface CountdownTimerProps {
  seconds: number;
}

export function CountdownTimer({ seconds }: CountdownTimerProps) {
  // Calculate the percentage for the circle
  const normalizedPercentage = (seconds / 5) * 100;
  const percentage = Math.min(100, Math.max(0, normalizedPercentage));
  
  // Calculate stroke-dasharray and stroke-dashoffset for the circle
  const circumference = 2 * Math.PI * 40; // 40 is the radius
  const strokeDashoffset = circumference * (1 - percentage / 100);
  
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center justify-center w-16 h-16">
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="black" 
          fillOpacity="0.5" 
          stroke="#666" 
          strokeWidth="4"
        />
        
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="transparent" 
          stroke="white" 
          strokeWidth="4"
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset}
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
          {seconds}
        </text>
      </svg>
    </div>
  );
} 