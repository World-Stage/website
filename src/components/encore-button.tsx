"use client";

import { useWebSocket } from "@/contexts/hooks";
import { ProtectedFeature } from "@/components/auth/ProtectedFeature";

export function EncoreButton() {
  const { hasEncored, sendEncore } = useWebSocket();

  return (
    <ProtectedFeature
      fallback={
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to vote for encore
          </p>
        </div>
      }
    >
      <button
        onClick={sendEncore}
        disabled={hasEncored}
        className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
          hasEncored
            ? 'bg-green-600 text-white cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {hasEncored ? '🎉 Encore Voted!' : '🔥 Vote for Encore'}
      </button>
    </ProtectedFeature>
  );
} 