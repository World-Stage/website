import { useWebSocket } from "@/contexts/WebSocetContext";
import { useStream } from "@/contexts/StreamContext";
import { ClockIcon } from "@heroicons/react/24/outline";

export function EncoreBanner() {
    const { encoreInformation } = useWebSocket();
    const { formattedTimeRemaining } = useStream();

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

    return (
        <>
              {/* Encore progress banner */}
            {encoreInformation?.encoreProgressPercent != null && encoreInformation.encoreProgressPercent > 0 && (
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
            )}
        </>

    )
}