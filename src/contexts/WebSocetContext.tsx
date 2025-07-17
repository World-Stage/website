import { createContext, useState, useEffect, useContext } from 'react';
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';
import { useConnectionManager } from '../lib/connection/ConnectionManagerProvider';

interface WebSocketContextType {
    encoreInformation: Encore | null;
    hasEncored: boolean;
    sendEncore: () => void;
    messages: ChatMessage[];
    viewers: number;
    inputMessage: string;
    setInputMessage: (message: string) => void;
    sendMessage: (e: React.FormEvent) => void;
}


export interface Encore {
    encoreTotal: number;
    encoreNeeded: number | null;
    encoreProgressPercent?: number | null;
  }

  interface ChatMessage {
    sender: string;
    content: string;
    messageType: "AUDIENCE" | "STREAMER" | "ADMIN" | "SYSTEM";
  }
  
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [encoreInformation, setEncoreInformation] = useState<Encore | null>(null);
    const [hasEncored, setHasEncored] = useState(false);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [viewers, setViewers] = useState<number>(0);
    const [inputMessage, setInputMessage] = useState("");
    const pathname = usePathname();
    
    // Get the connection manager to check if connections should be active
    let connectionManager;
    try {
      connectionManager = useConnectionManager();
    } catch (error) {
      // ConnectionManager not available, connections will always be active
      console.log('ConnectionManager not available, connections will always be active');
    }

    // Function to create and connect WebSocket
    const createWebSocketConnection = (includeAuth = false) => {
      // Check if connections should be active based on the current route
      if (connectionManager && !connectionManager.shouldBeActive(pathname)) {
        console.log('Connections not active for route:', pathname);
        return;
      }
      
      // Disconnect existing client if any
      if (stompClient) {
        stompClient.deactivate();
      }

      const socket = new SockJS('http://localhost:8082/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: includeAuth && user ? {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        } : {},
        onConnect: () => {
          console.log('WebSocket connected', includeAuth ? 'with auth' : 'anonymously');
          
          client.subscribe('/encore', (message: IMessage) => {
            const encoreData = JSON.parse(message.body);
            
            // Reset encore state when a new stream starts
            if (encoreData.encoreTotal === 0 && 
                encoreData.encoreNeeded === null && 
                encoreData.encoreProgressPercent === 0) {
              setHasEncored(false);
            }
            
            setEncoreInformation(encoreData);
          });

          client.subscribe('/chat/messages', (message: IMessage) => {
            const newMessage = JSON.parse(message.body) as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
          });
          client.subscribe('/chat/viewers', (message: IMessage) => {
            const count = JSON.parse(message.body) as number;
            setViewers(count);
          });
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
        },
        onStompError: (frame) => {
          console.error('WebSocket STOMP error:', frame);
        }
      });

      client.activate();
      setStompClient(client);
    };

    // Fetch viewer count when on the root page
    useEffect(() => {
      // Only fetch viewer count if connections should be active
      if (connectionManager && !connectionManager.shouldBeActive(pathname)) {
        return;
      }
      
      // Delay viewer count fetch slightly
      setTimeout(() => {
        fetch('http://localhost:8082/stream/view/count')
          .then(res => res.json())
          .then(data => {
            setViewers(data.viewerCount);
          })
          .catch(error => {
            console.error('Failed to fetch viewer count:', error);
          });
      }, 300); // tweak this if needed
    }, [pathname]);
    
    // Handle connection based on route and auth state
    useEffect(() => {
      // Check if connections should be active based on the current route
      const shouldConnect = !connectionManager || connectionManager.shouldBeActive(pathname);
      
      if (shouldConnect) {
        // Connect with auth if authenticated, otherwise connect anonymously
        createWebSocketConnection(isAuthenticated && !!user);
      } else {
        // Disconnect if not on an active route
        if (stompClient) {
          console.log('Disconnecting WebSocket due to inactive route');
          stompClient.deactivate();
          setStompClient(null);
        }
      }
      
      // Clean up on unmount or route change
      return () => {
        if (stompClient) {
          stompClient.deactivate();
        }
      };
    }, [pathname, isAuthenticated, user]);
    
    // Log connection state changes for debugging
    useEffect(() => {
      if (stompClient) {
        console.log('WebSocket client state:', stompClient.connected ? 'connected' : 'disconnected');
      }
    }, [stompClient]);
  
    const sendEncore = async () => {
      if (hasEncored || !stompClient?.connected || !user) return;
      
      try {
        const accessToken = localStorage.getItem('accessToken');
        stompClient.publish({
          destination: '/app/encore',
          headers: accessToken ? {
            'Authorization': `Bearer ${accessToken}`
          } : {},
          body: JSON.stringify({
            userId: user.id
          })
        });
        
        setHasEncored(true);
        setEncoreInformation(prev => {
          if (!prev) return {
            encoreTotal: 1,
            encoreNeeded: null,
            encoreProgressPercent: null
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

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !stompClient?.connected || !user) return;
        
        const accessToken = localStorage.getItem('accessToken');
        const message: ChatMessage = {
          sender: user.username,
          content: inputMessage.trim(),
          messageType: "AUDIENCE"
        };
        stompClient.publish({
          destination: '/app/send',
          headers: accessToken ? {
            'Authorization': `Bearer ${accessToken}`
          } : {},
          body: JSON.stringify(message)
        });
    
        setInputMessage('');
      };


    const value = {
        encoreInformation,
        hasEncored,
        sendEncore,
        messages,
        sendMessage,
        viewers,
        inputMessage,
        setInputMessage
    }

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
