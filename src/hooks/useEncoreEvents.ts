import { useState, useEffect } from 'react';
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

export interface Encore {
  encoreTotal: number;
  encoreNeeded: number | null;
  encorePercent?: number | null;
}

export function useEncoreEvents() {
  const [encoreInformation, setEncoreInformation] = useState<Encore | null>(null);
  const [hasEncored, setHasEncored] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useEffect(() => {
    // Connect to encore WebSocket
    const socket = new SockJS('http://localhost:8082/encore');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe('/topic/encore', (message: IMessage) => {
          const encoreData = JSON.parse(message.body);
          setEncoreInformation(encoreData);
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  const sendEncore = async () => {
    if (hasEncored || !stompClient?.connected) return;
    
    try {
      stompClient.publish({
        destination: '/app/encore',
        body: JSON.stringify({
          userId: crypto.randomUUID() //TODO update to user id
        })
      });
      
      setHasEncored(true);
      setEncoreInformation(prev => {
        if (!prev) return {
          encoreTotal: 1,
          encoreNeeded: null,
          encorePercentage: undefined
        };
        return {
          ...prev,
          encoreTotal: prev.encoreTotal + 1
        };
      });
    } catch (error) {
      console.error("Failed to send encore:", error);
    }
  };

  return {
    encoreInformation,
    hasEncored,
    sendEncore
  };
} 