"use client";

import { useEffect, useState } from "react";

export default function StreamManagerPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Stream Manager</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your live streams and update stream information in real-time.
      </p>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Stream Status</h2>
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
            Offline
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          You are not currently streaming. Start a stream from your broadcasting software to begin.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Stream Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stream Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter stream title"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stream Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Enter stream description"
                disabled
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Stream Controls</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Stream controls are available when you are live.
          </p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-md font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            End Stream
          </button>
        </div>
      </div>
    </div>
  );
}