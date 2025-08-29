"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axiosClient from "@/lib/api/apiClient";
import { StreamPlayer } from "@/components/stream-player";
import { Chat } from "@/components/chat";
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { getRTMPUrl } from "@/lib/config/env";

interface ActiveStream {
  id: string;
  streamKey: string;
  rtmpUrl: string;
  hlsUrl: string;
  active: boolean;
  status: 'ACTIVE' | 'QUEUED' | 'ENDED';
}

interface StreamMetadata {
  title: string;
  description: string;
}

interface UserWithStream {
  id: string;
  username: string;
  email: string;
  streamKey: string;
  streamMetadata?: StreamMetadata;
  activeStream?: ActiveStream;
}

export default function StreamManagerPage() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserWithStream | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);

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
        // Set initial values for stream metadata
        setStreamTitle(response.data.streamMetadata?.title || '');
        setStreamDescription(response.data.streamMetadata?.description || '');
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        toast.error('Failed to load stream information');
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

  const getStatusDescription = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return "Your stream is currently live!";
      case 'QUEUED':
        return "Your stream is currently queued and will be live shortly.";
      case 'ENDED':
        return "You are not currently streaming. Start a stream from your broadcasting software to begin.";
      default:
        return "You are not currently streaming. Start a stream from your broadcasting software to begin.";
    }
  }

  const handleEndStream = async () => {
    if (!userData?.activeStream?.id) return;

    try {
      await axiosClient.delete(`/streams/${userData.activeStream.id}/unpublish`);
      // Refresh user data
      toast.success('Stream ended successfully');
    } catch (err) {
      console.error('Failed to end stream:', err);
      toast.error('Failed to end stream');
    }
  };

  const handleRegenerateStreamKey = async () => {
    if (!user?.id) return;

    setIsRegeneratingKey(true);
    try {
      const response = await axiosClient.post(`/users/${user.id}/regenerateStreamKey`);
      // Refresh user data to get the new stream key
      setUserData(response.data);
      // Show the new key after regeneration
      setShowStreamKey(true);
      toast.success('Stream key regenerated successfully');
    } catch (err) {
      console.error('Failed to regenerate stream key:', err);
      toast.error('Failed to regenerate stream key');
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!user?.id) return;

    setIsUpdatingMetadata(true);
    try {
      await axiosClient.patch(`/users/${user.id}/streamMetadata`, {
        title: streamTitle,
        description: streamDescription
      });

      // Update local userData to reflect the changes
      setUserData(prev => prev ? {
        ...prev,
        streamMetadata: {
          title: streamTitle,
          description: streamDescription
        }
      } : null);

      toast.success('Stream metadata updated successfully');
    } catch (err) {
      console.error('Failed to update stream metadata:', err);
      toast.error('Failed to update stream metadata');
    } finally {
      setIsUpdatingMetadata(false);
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
          {getStatusDescription(activeStream?.status)
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
                {getRTMPUrl()}
              </code>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Stream Key
              </label>
              <button
                onClick={handleRegenerateStreamKey}
                disabled={isRegeneratingKey || isStreamActive}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={isStreamActive ? "Cannot regenerate key while streaming" : "Generate new stream key"}
              >
                <ArrowPathIcon className={`w-3 h-3 ${isRegeneratingKey ? 'animate-spin' : ''}`} />
                <span>{isRegeneratingKey ? 'Generating...' : 'Regenerate'}</span>
              </button>
            </div>
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
            <div className="flex items-start justify-between mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Keep your stream key private. Anyone with this key can stream to your channel.
              </p>
              {isStreamActive && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">
                  Cannot regenerate while streaming
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*  TODO Bring Back later
      Active Stream Content
      {isStreamActive && activeStream && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Live Stream</h2>
              <StreamPlayer />
            </div>
          </div>


          <div className="lg:col-span-1">
            <Chat />
          </div>
        </div>
      )} 
      */}

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
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter stream title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stream Description
              </label>
              <textarea
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter stream description"
              ></textarea>
            </div>
            <button
              onClick={handleUpdateMetadata}
              disabled={isUpdatingMetadata}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdatingMetadata ? 'Updating...' : 'Update Stream Info'}
            </button>
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