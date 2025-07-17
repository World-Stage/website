"use client";

import { useEffect, useState } from "react";

export default function MonetizationPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Monetization</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your revenue streams and monetization settings.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Revenue Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
              <span className="text-2xl font-bold">$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Donations</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Subscriptions</span>
              <span>$0.00</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <span className="text-gray-600 dark:text-gray-400">Next Payout</span>
              <div className="text-sm mt-1">No pending payouts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Monetization Status</h2>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md mb-4">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-400 mr-2 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Not Eligible Yet</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Complete the eligibility requirements to enable monetization features.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">Reach 100 followers</span>
              <span className="ml-auto">0/100</span>
            </div>
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">Stream for 10+ hours</span>
              <span className="ml-auto">0/10</span>
            </div>
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">Complete account verification</span>
              <span className="ml-auto">Not Started</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Monetization Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Monetization settings will be available once you meet the eligibility requirements.
        </p>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium opacity-50 cursor-not-allowed"
          disabled
        >
          Set Up Monetization
        </button>
      </div>
    </div>
  );
}