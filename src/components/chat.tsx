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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat</h2>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {msg.sender}:
            </span>
            <span className="ml-2">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
} 