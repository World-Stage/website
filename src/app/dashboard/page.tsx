"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-6"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Welcome to your creator dashboard. Here you can manage your streams, view analytics, and more.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-500 dark:text-gray-400">Total Views</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-500 dark:text-gray-400">Followers</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-500 dark:text-gray-400">Watch Time</h3>
          <p className="text-2xl font-bold">0 hrs</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-medium text-gray-500 dark:text-gray-400">Revenue</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Streams</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>You haven't streamed yet.</p>
          <p className="mt-2">Start your first stream to see analytics here.</p>
        </div>
      </div>
    </div>
  );
}