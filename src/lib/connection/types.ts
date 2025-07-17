/**
 * Types for the connection management system
 */

/**
 * Configuration for the ConnectionManager
 */
export interface ConnectionManagerConfig {
  // Routes where connections should be active (exact or pattern)
  activeRoutes: string[];
  // Optional debounce time for connection operations (ms)
  debounceTime?: number;
  // Whether to enable debug logging
  debug?: boolean;
}

/**
 * State maintained by the ConnectionManager
 */
export interface ConnectionManagerState {
  isActive: boolean;
  currentRoute: string;
  previousRoute: string | null;
  connectionHistory: ConnectionHistoryEntry[];
}

/**
 * Entry in the connection history log
 */
export interface ConnectionHistoryEntry {
  route: string;
  action: 'connect' | 'disconnect';
  timestamp: number;
}

/**
 * Interface that all connection controllers must implement
 */
export interface ConnectionController {
  // Unique identifier for this controller
  id: string;
  
  // Current connection state
  isConnected: boolean;
  
  // Connect with optional state restoration
  connect(previousState?: any): Promise<void>;
  
  // Disconnect with optional state preservation
  disconnect(): Promise<any>;
  
  // Get current state for preservation
  getState(): any;
  
  // Handle connection errors
  handleError(error: Error): void;
}

/**
 * Types of connection events
 */
export type ConnectionEventType = 'connect' | 'disconnect' | 'error' | 'reconnect';

/**
 * Connection event data structure
 */
export interface ConnectionEvent {
  type: ConnectionEventType;
  controllerId: string;
  timestamp: number;
  route: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for encore information
 */
export interface Encore {
  encoreTotal: number;
  encoreNeeded: number | null;
  encoreProgressPercent?: number | null;
}

/**
 * Interface for chat messages
 */
export interface ChatMessage {
  sender: string;
  content: string;
  messageType: "AUDIENCE" | "STREAMER" | "ADMIN" | "SYSTEM";
}

/**
 * Interface for WebSocket state that will be preserved during disconnection
 */
export interface WebSocketState {
  messages: ChatMessage[];
  encoreInformation: Encore | null;
  hasEncored: boolean;
  viewers: number;
}