import { useWebSocket, useStream } from "@/contexts/hooks";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

export function EncoreBanner() {
    const { encoreInformation } = useWebSocket();
    const { formattedTimeRemaining } = useStream();
    const [hasShownSuccess, setHasShownSuccess] = useState(false);

    // Effect to detect when we first hit 100% or reset when a new stream starts
    useEffect(() => {
        if (encoreInformation?.encoreProgressPercent === 100 && !hasShownSuccess) {
            setHasShownSuccess(true);
        }
        
        // Reset success state when a new stream starts
        if (encoreInformation?.encoreTotal === 0 && 
            encoreInformation?.encoreNeeded === null && 
            encoreInformation?.encoreProgressPercent === 0) {
            setHasShownSuccess(false);
        }
    }, [encoreInformation, hasShownSuccess]);

    const getProgressGradient = () => {
        const percentage = encoreInformation?.encoreProgressPercent || 0;
        return {
          background: `linear-gradient(to right, 
            rgba(147, 51, 234, 1) 0%, 
            rgba(59, 130, 246, 1) ${percentage}%, 
            rgba(30, 41, 59, 0.7) ${percentage}%, 
            rgba(30, 41, 59, 0.7) 100%)`,
          width: '100%'
        };
    };

    // Don't show anything if there's no encore information or it's a reset state
    if (!encoreInformation?.encoreProgressPercent || 
        (encoreInformation.encoreTotal === 0 && 
         encoreInformation.encoreNeeded === null && 
         encoreInformation.encoreProgressPercent === 0)) return null;

    // Show success message if we've hit 100%
    if (hasShownSuccess) {
        return (
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500">
                <div className="flex justify-between items-center text-white">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-sm">🎉 Encore Success!</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {formattedTimeRemaining && (
                            <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                <span className="text-xs">{formattedTimeRemaining}</span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-xs text-white/80 mt-1">The stream will be extended!</p>
            </div>
        );
    }

    // Show progress banner if we haven't hit 100% yet
    return (
        <div className="px-4 py-2" style={getProgressGradient()}>
            <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-sm">Encore Hype</span>
                    <span className="text-xs bg-purple-500 px-2 rounded-full">Streak 1</span>
                </div>
                <div className="flex items-center gap-2">
                    {formattedTimeRemaining && (
                        <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span className="text-xs">{formattedTimeRemaining}</span>
                        </div>
                    )}
                    <span className="font-bold">{encoreInformation.encoreProgressPercent}%</span>
                </div>
            </div>
            <p className="text-xs text-white/80 mt-1">🔥 Viewers want an encore! - {encoreInformation.encoreNeeded} more needed</p>
        </div>
    );
}