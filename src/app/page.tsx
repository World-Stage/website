import { StreamPlayer } from "@/components/stream-player";
import { StreamControls } from "@/components/stream-controls";
import { StreamInfo } from "@/components/stream-info";
import { Chat } from "@/components/chat";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <StreamPlayer />
          <StreamControls />
          <div className="mt-8 lg:hidden">
            <Chat />
          </div>
        </div>
        <div className="lg:col-span-1 space-y-8">
          <StreamInfo />
          <div className="hidden lg:block">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
}
