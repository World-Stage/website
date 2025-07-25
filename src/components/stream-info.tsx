"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import { useStream } from "@/contexts/hooks";
import { EncoreButton } from "./encore-button";

export function StreamInfo() {
  const {
    stream,
    formattedTimeRemaining,
    timeAdded
  } = useStream();

  return (
    <div className="w-full">
      {stream && (
        <>
          {/* Top info row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-lg md:text-xl">{stream.title}</span>
              <span className="text-gray-500 text-sm md:ml-4">by <span className="font-semibold">{stream.user.username}</span></span>
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
                <EncoreButton />
              </div>
            </div>
          </div>
          {/* Description box */}
          <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200">
            <p>{stream.description || stream.title}</p>
            <p className="mt-2 text-xs text-gray-500">Stream by <span className="text-purple-600">{stream.user.username}</span></p>
          </div>
        </>
      )}
    </div>
  );
} 