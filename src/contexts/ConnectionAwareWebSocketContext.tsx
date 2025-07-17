import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ConnectionManager } from '../lib/connection/ConnectionManager';
import { WebSocketConnectionController } from '../lib/connection/WebSocketConnectionController';
import { ChatMessage, Encore } from '../lib/connection/types';

interface WebSocketContextType {
    encoreInformation: Encore | null;
    hasEncored: boolean;
    sendEncore: () => void;
    messages: ChatMessage[];
    viewers: number;
    inputMessage: string;
    setInputMessage: (message: string) => void;
    sendMessage: (e: React.FormEvent) => void;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface ConnectionAwareWebSocketProviderProps {
    children: ReactNode;
    connectionManager: ConnectionManager;
    webSocketUrl?: string;
}

export function ConnectionAwareWebSocketProvider({
    children,
    connectionManager,
    webSocketUrl = 'http://localhost:8082/ws'
}: ConnectionAwareWebSocketProviderProps) {
    const { user, isAuthenticated } = useAuth();
    const [encoreInformation, setEncoreInformation] = useState<Encore | null>(null);
    const [hasEncored, setHasEncored] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [viewers, setViewers] = useState<number>(0);
    const [inputMessage, setInputMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [controller, setController] = useState<WebSocketConnectionController | null>(null);

    // Initialize the WebSocketConnectionController
    useEffect(() => {
        console.log('[ConnectionAwareWebSocketProvider] Initializing WebSocketConnectionController');
        
        const wsController = new WebSocketConnectionController({
            url: webSocketUrl,
            debug: true,
            onConnectionEvent: (eventType, metadata) => {
                console.log(`[ConnectionAwareWebSocketProvider] Connection event: ${eventType}`);
                if (eventType === 'connect') {
                    setIsConnected(true);
                } else if (eventType === 'disconnect') {
                    setIsConnected(false);
                }
            }
        });

        // Register the controller with the ConnectionManager
        connectionManager.registerController(wsController);
        setController(wsController);

        // Cleanup on unmount
        return () => {
            console.log('[ConnectionAwareWebSocketProvider] Disposing WebSocketConnectionController');
            wsController.dispose();
        };
    }, [connectionManager, webSocketUrl]);

    // Update authentication token when user auth state changes
    useEffect(() => {
        if (!controller) return;

        const accessToken = isAuthenticated ? localStorage.getItem('accessToken') : null;
        controller.setAccessToken(accessToken);
    }, [isAuthenticated, controller, user]);

    // Sync state from controller to component state
    useEffect(() => {
        if (!controller) return;

        // Create an interval to sync state from the controller
        const syncInterval = setInterval(() => {
            if (controller.isConnected) {
                const state = controller.getState();
                setEncoreInformation(state.encoreInformation);
                setHasEncored(state.hasEncored);
                setMessages(state.messages);
                setViewers(state.viewers);
            }
        }, 100);

        return () => {
            clearInterval(syncInterval);
        };
    }, [controller]);

    // Send encore function
    const sendEncore = async () => {
        if (hasEncored || !controller?.isConnected || !user) return;

        try {
            await controller.sendEncore(user.id);
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

    // Send message function
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !controller?.isConnected || !user) return;

        const message: ChatMessage = {
            sender: user.username,
            content: inputMessage.trim(),
            messageType: "AUDIENCE"
        };

        controller.sendChatMessage(message)
            .then(() => {
                setInputMessage('');
            })
            .catch(error => {
                console.error("Failed to send message:", error);
            });
    };

    const value = {
        encoreInformation,
        hasEncored,
        sendEncore,
        messages,
        sendMessage,
        viewers,
        inputMessage,
        setInputMessage,
        isConnected
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a ConnectionAwareWebSocketProvider');
    }
    return context;
}