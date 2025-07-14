"use client";

import { useEffect, useRef, useState } from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useWebSocket } from "@/contexts/WebSocetContext";
import { EncoreBanner } from "./encore-banner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./auth/AuthModal";

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + 'k';
  }
  return num.toString();
}

export function Chat() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { messages, viewers, inputMessage, setInputMessage, sendMessage } = useWebSocket();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 40; // px
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (atBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Handler for unauthenticated users
  const handleInputFocus = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setInputMessage(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log(isAuthenticated, e);
    if (!isAuthenticated) {
      e.preventDefault();
      setShowAuthModal(true);
      return;
    }
    sendMessage(e);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg flex flex-col border border-gray-200 dark:border-gray-700 h-[500px] lg:h-[calc(100vh-64px)]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold">Stream Chat</h2>
        <div className="flex items-center gap-1">
          <UserGroupIcon className="w-5 h-5" color="red"/>
          <span className="text-red-400 text-xs">{formatNumber(viewers)} viewers</span>
        </div>
      </div>
      
      {/* Encore progress banner */}
      <EncoreBanner />
      {/* {encoreInformation?.encoreProgressPercent != null && encoreInformation.encoreProgressPercent > 0 && (
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
      )} */}
      
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm"
      >
        {messages.map((msg, index) => {
          if (msg.messageType === "SYSTEM") {
            return (
              <div
                key={index}
                className="text-xs text-gray-400 italic text-center py-1"
              >
                {msg.content}
              </div>
            );
          }

          let senderClass = "font-semibold text-purple-600 dark:text-purple-400";
          if (msg.messageType === "STREAMER") senderClass = "font-bold text-blue-600 dark:text-blue-400";
          if (msg.messageType === "ADMIN") senderClass = "font-bold text-red-500 dark:text-red-400";

          return (
            <div key={index} className="flex items-start gap-2">
              <span className={`${senderClass} whitespace-nowrap`}>
                {msg.sender}
              </span>
              <span className="break-words">{msg.content}</span>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleFormSubmit} className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <input
          type="text"
          value={inputMessage}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          placeholder={isAuthenticated ? "Send a message" : "Sign in to chat"}
          className="flex-1 px-3 py-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800"
          disabled={!isAuthenticated}
        />
        <button
          type="submit"
          disabled={!isAuthenticated || !inputMessage.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
} 