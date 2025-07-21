"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axiosClient from "@/lib/api/apiClient";
import { StreamPlayer } from "@/components/stream-player";
import { Chat } from "@/components/chat";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface ActiveStream {
  id: string;
  streamKey: string;
  rtmpUrl: string;
  hlsUrl: string;
  active: boolean;
  status: 'ACTIVE' | 'QUEUED' | 'ENDED';
}

interface UserWithStream {
  id: string;
  username: string;
  email: string;
  streamKey: string;
  activeStream?: ActiveStream;
}

export default function StreamManagerPage() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserWithStream | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get(`/users/${user.id}?returnActiveStream=true`);
        console.log(response)
        setUserData(response.data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load stream information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id, isAuthenticated]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 text-white';
      case 'QUEUED':
        return 'bg-yellow-500 text-white';
      case 'ENDED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (activeStream?: ActiveStream) => {
    if (!activeStream) return 'Offline';
    return activeStream.status.charAt(0) + activeStream.status.slice(1).toLowerCase();
  };

  const handleEndStream = async () => {
    if (!userData?.activeStream?.id) return;

    try {
      await axiosClient.post(`/streams/${userData.activeStream.id}/end`);
      // Refresh user data
      const response = await axiosClient.get(`/users/${user?.id}?returnActiveStream=true`);
      setUserData(response.data);
    } catch (err) {
      console.error('Failed to end stream:', err);
      setError('Failed to end stream');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please log in to access the stream manager.
        </p>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  const activeStream = userData?.activeStream;
  const isStreamActive = activeStream?.status === 'ACTIVE';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Stream Manager</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your live streams and update stream information in real-time.
      </p>

      {/* Stream Status */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Stream Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(activeStream?.status)}`}>
            {getStatusText(activeStream)}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {isStreamActive
            ? "Your stream is currently live!"
            : "You are not currently streaming. Start a stream from your broadcasting software to begin."
          }
        </p>
      </div>

      {/* Stream Key Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Stream Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RTMP Server
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
              <code className="text-sm text-gray-900 dark:text-white font-mono">
                rtmp://localhost:1935/live
              </code>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stream Key
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <code className="text-sm text-gray-900 dark:text-white font-mono">
                  {showStreamKey
                    ? userData?.streamKey
                    : '••••••••••••••••••••••••••••••••'
                  }
                </code>
              </div>
              <button
                onClick={() => {
                  console.log('Toggle clicked, current state:', showStreamKey);
                  setShowStreamKey(!showStreamKey);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                title={showStreamKey ? "Hide stream key" : "Show stream key"}
              >
                {showStreamKey ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Keep your stream key private. Anyone with this key can stream to your channel.
            </p>
          </div>
        </div>
      </div>

      {/* Active Stream Content */}
      {isStreamActive && activeStream && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stream Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Live Stream</h2>
              <StreamPlayer />
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <Chat />
          </div>
        </div>
      )}

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
                disabled={!isStreamActive}
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
                disabled={!isStreamActive}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Stream Controls</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isStreamActive
              ? "Use the controls below to manage your live stream."
              : "Stream controls are available when you are live."
            }
          </p>
          <button
            onClick={handleEndStream}
            disabled={!isStreamActive}
            className={`px-4 py-2 rounded-md font-medium ${isStreamActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
          >
            End Stream
          </button>
        </div>
      </div>
    </div>
  );
}