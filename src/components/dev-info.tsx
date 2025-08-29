'use client';

import { useState } from 'react';
import { getConfig } from '@/lib/config/env';

/**
 * Development information component
 * Shows current environment configuration in development mode
 * Hidden in production builds
 */
export function DevInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const config = getConfig();

  // Only show in development
  if (config.environment === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-gray-700 transition-colors"
        title="Environment Info"
      >
        ENV: {config.environment.toUpperCase()}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-gray-900 text-white p-4 rounded-lg shadow-lg min-w-80 text-xs font-mono">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Environment Configuration</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Environment:</span>
              <span className="ml-2 text-green-400">{config.environment}</span>
            </div>
            
            <div>
              <span className="text-gray-400">API Base:</span>
              <span className="ml-2 text-blue-400 break-all">{config.api.baseUrl}</span>
            </div>
            
            <div>
              <span className="text-gray-400">WebSocket:</span>
              <span className="ml-2 text-purple-400 break-all">{config.websocket.url}</span>
            </div>
            
            <div>
              <span className="text-gray-400">SSE:</span>
              <span className="ml-2 text-yellow-400 break-all">{config.sse.url}</span>
            </div>
            
            <div>
              <span className="text-gray-400">RTMP:</span>
              <span className="ml-2 text-red-400 break-all">{config.rtmp.url}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700 text-gray-400">
            <p>Use <code>npm run env:prod</code> to switch to production URLs</p>
          </div>
        </div>
      )}
    </div>
  );
}