"use client";

import { StreamPlayer } from "@/components/stream-player";
import { StreamInfo } from "@/components/stream-info";
import { Chat } from "@/components/chat";
import { Header } from "@/components/Header";
import { ProtectedFeature } from "@/components/auth/ProtectedFeature";
import { StreamProvider } from "@/contexts/StreamContext";
import { WebSocketProvider } from "@/contexts/WebSocetContext";

export default function Home() {
  return (
    <StreamProvider>
      <WebSocketProvider>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content: video + info */}
            <div className="flex-1 min-w-0">
              <div className="w-full">
                <StreamPlayer />
              </div>
              <div className="mt-4">
                <StreamInfo />
              </div>
            </div>
            {/* Chat sidebar */}
            <div className="w-full lg:w-[350px] flex-shrink-0">
              <div className="lg:sticky lg:top-8 h-[500px] lg:h-[calc(100vh-64px)]">
                <Chat />
              </div>
            </div>
          </div>
        </div>
      </WebSocketProvider>
    </StreamProvider>
  );
}
