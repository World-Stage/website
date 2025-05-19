"use client";

import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

interface ChatMessage {
  sender: string;
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8082/chat');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe('/topic/messages', (message: IMessage) => {
          const newMessage = JSON.parse(message.body) as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 40; // px
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (atBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !stompClient?.connected) return;

    const message: ChatMessage = {
      sender: 'Viewer', // TODO: Replace with actual username
      content: inputMessage.trim()
    };

    stompClient.publish({
      destination: '/app/send',
      body: JSON.stringify(message)
    });

    setInputMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg flex flex-col border border-gray-200 dark:border-gray-700 h-[500px] lg:h-[calc(100vh-64px)]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold">Stream Chat</h2>
      </div>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm"
      >
        {messages.map((msg, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
              {msg.sender}
            </span>
            <span className="break-words">{msg.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Send a message"
          className="flex-1 px-3 py-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
} 