import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { BaseConnectionController } from "./BaseConnectionController";
import { WebSocketState, Encore, ChatMessage, ConnectionEventType } from "./types";

/**
 * Configuration options for WebSocketConnectionController
 */
export interface WebSocketConnectionControllerOptions {
  url: string;
  maxConnectionAttempts?: number;
  baseReconnectDelay?: number;
  debug?: boolean;
  connectionTimeout?: number;
  heartbeatIncoming?: number;
  heartbeatOutgoing?: number;
  onConnectionEvent?: (eventType: ConnectionEventType, metadata?: any) => void;
}

/**
 * Error types specific to WebSocket connections
 */
export enum WebSocketErrorType {
  CONNECTION_ERROR = 'connection_error',
  SUBSCRIPTION_ERROR = 'subscription_error',
  MESSAGE_SEND_ERROR = 'message_send_error',
  STOMP_ERROR = 'stomp_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * WebSocketConnectionController
 * 
 * Controller for managing STOMP WebSocket connections.
 * Handles connection establishment, termination, and state preservation.
 * Implements reconnection with exponential backoff and error handling.
 */
export class WebSocketConnectionController extends BaseConnectionController {
  public id: string = 'websocket';
  private stompClient: Client | null = null;
  private state: WebSocketState;
  private url: string;
  private subscriptions: { [key: string]: StompSubscription } = {};
  private accessToken: string | null = null;
  private connectionTimeout: number;
  private heartbeatIncoming: number;
  private heartbeatOutgoing: number;
  private connectionTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private onConnectionEvent?: (eventType: ConnectionEventType, metadata?: any) => void;
  private isReconnecting: boolean = false;
  private lastErrorTime: number = 0;
  private errorCount: number = 0;

  /**
   * Creates a new WebSocketConnectionController
   * 
   * @param options Configuration options
   */
  constructor(options: WebSocketConnectionControllerOptions) {
    super({
      maxConnectionAttempts: options.maxConnectionAttempts,
      baseReconnectDelay: options.baseReconnectDelay,
      debug: options.debug
    });

    this.url = options.url;
    this.state = {
      messages: [],
      encoreInformation: null,
      hasEncored: false,
      viewers: 0
    };
    
    // Set connection parameters with defaults
    this.connectionTimeout = options.connectionTimeout ?? 10000; // 10 seconds
    this.heartbeatIncoming = options.heartbeatIncoming ?? 20000; // 20 seconds
    this.heartbeatOutgoing = options.heartbeatOutgoing ?? 20000; // 20 seconds
    this.onConnectionEvent = options.onConnectionEvent;

    this.logDebug('WebSocketConnectionController initialized');
  }

  /**
   * Set the access token for authenticated connections
   * 
   * @param token The access token to use for authentication
   */
  public setAccessToken(token: string | null): void {
    this.accessToken = token;
    this.logDebug(`Access token ${token ? 'set' : 'cleared'}`);

    // If already connected, reconnect with new token
    if (this.isConnected && this.stompClient) {
      this.logDebug('Reconnecting with updated authentication');
      const currentState = this.getState();
      this.disconnect().then(() => {
        this.connect(currentState);
      });
    }
  }

  /**
   * Get current state for preservation
   * 
   * @returns The current WebSocket state
   */
  public getState(): WebSocketState {
    return { ...this.state };
  }

  /**
   * Send an encore to the server
   * 
   * @param userId The ID of the user sending the encore
   * @returns Promise that resolves when the encore is sent
   */
  public async sendEncore(userId: string): Promise<void> {
    if (!this.isConnected || !this.stompClient || this.state.hasEncored) {
      this.logDebug('Cannot send encore: not connected or already encored');
      return;
    }

    try {
      this.stompClient.publish({
        destination: '/app/encore',
        headers: this.accessToken ? {
          'Authorization': `Bearer ${this.accessToken}`
        } : {},
        body: JSON.stringify({
          userId
        })
      });
      
      // Update local state
      this.state.hasEncored = true;
      this.state.encoreInformation = this.state.encoreInformation ? {
        ...this.state.encoreInformation,
        encoreTotal: this.state.encoreInformation.encoreTotal + 1
      } : {
        encoreTotal: 1,
        encoreNeeded: null,
        encoreProgressPercent: null
      };

      this.logDebug('Encore sent successfully');
    } catch (error) {
      this.logDebug('Failed to send encore', error);
      throw error;
    }
  }

  /**
   * Send a chat message to the server
   * 
   * @param message The message to send
   * @returns Promise that resolves when the message is sent
   */
  public async sendChatMessage(message: ChatMessage): Promise<void> {
    if (!this.isConnected || !this.stompClient) {
      this.logDebug('Cannot send message: not connected');
      return;
    }

    try {
      this.stompClient.publish({
        destination: '/app/send',
        headers: this.accessToken ? {
          'Authorization': `Bearer ${this.accessToken}`
        } : {},
        body: JSON.stringify(message)
      });

      this.logDebug('Chat message sent successfully');
    } catch (error) {
      this.logDebug('Failed to send chat message', error);
      throw error;
    }
  }

  /**
   * Perform the actual connection logic
   * 
   * @param previousState Optional state from previous connection to restore
   */
  protected async performConnect(previousState?: WebSocketState): Promise<void> {
    // Restore previous state if available
    if (previousState) {
      this.state = { ...previousState };
      this.logDebug('Restored previous state', this.state);
    }

    // Clear any existing timers
    this.clearTimers();

    return new Promise((resolve, reject) => {
      try {
        // Create STOMP client
        const socket = new SockJS(this.url);
        this.stompClient = new Client({
          webSocketFactory: () => socket,
          connectHeaders: this.accessToken ? {
            'Authorization': `Bearer ${this.accessToken}`
          } : {},
          onConnect: () => {
            this.handleSuccessfulConnection();
            resolve();
          },
          onDisconnect: () => {
            this.handleDisconnection();
          },
          onStompError: (frame) => {
            const error = new Error(`STOMP error: ${frame.headers.message}`);
            this.logDebug('STOMP error', frame);
            this.handleConnectionError(error, WebSocketErrorType.STOMP_ERROR, { frame });
            reject(error);
          },
          // Add heartbeat configuration for connection health monitoring
          heartbeatIncoming: this.heartbeatIncoming,
          heartbeatOutgoing: this.heartbeatOutgoing,
          // Add reconnect delay to prevent immediate reconnection attempts by the STOMP client
          reconnectDelay: 0, // We'll handle reconnection ourselves
        });

        // Set connection timeout
        this.connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            const error = new Error('Connection timeout');
            this.handleConnectionError(error, WebSocketErrorType.TIMEOUT_ERROR);
            reject(error);
          }
        }, this.connectionTimeout);

        // Activate the client
        this.stompClient.activate();
      } catch (error) {
        this.handleConnectionError(error as Error, WebSocketErrorType.CONNECTION_ERROR);
        reject(error);
      }
    });
  }
  
  /**
   * Handle successful connection
   */
  private handleSuccessfulConnection(): void {
    // Clear connection timeout
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    // Reset error counters on successful connection
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.isReconnecting = false;
    
    this.logDebug('WebSocket connected successfully');
    
    // Setup subscriptions
    this.setupSubscriptions();
    
    // Fetch initial viewer count
    this.fetchViewerCount();
    
    // Notify about connection event
    if (this.onConnectionEvent) {
      this.onConnectionEvent('connect', { timestamp: Date.now() });
    }
  }
  
  /**
   * Handle disconnection event
   */
  private handleDisconnection(): void {
    this.logDebug('WebSocket disconnected');
    
    // Only attempt reconnection if we were previously connected
    // and this isn't part of an intentional disconnect operation
    if (this.isConnected && !this.isReconnecting) {
      this.isConnected = false;
      
      // Notify about disconnection event
      if (this.onConnectionEvent) {
        this.onConnectionEvent('disconnect', { unexpected: true, timestamp: Date.now() });
      }
      
      // Attempt reconnection with exponential backoff
      this.attemptReconnection();
    }
  }
  
  /**
   * Handle connection errors
   * 
   * @param error The error that occurred
   * @param errorType The type of error
   * @param metadata Additional metadata about the error
   */
  private handleConnectionError(error: Error, errorType: WebSocketErrorType, metadata?: any): void {
    this.logDebug(`WebSocket error: ${errorType}`, { error, metadata });
    
    // Increment error counter
    this.errorCount++;
    this.lastErrorTime = Date.now();
    
    // Notify about error event
    if (this.onConnectionEvent) {
      this.onConnectionEvent('error', { 
        error: error.message, 
        errorType, 
        timestamp: this.lastErrorTime,
        metadata
      });
    }
    
    // Clear any existing timers
    this.clearTimers();
  }

  /**
   * Perform the actual disconnection logic
   */
  protected async performDisconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Clear any pending timers first to prevent reconnection attempts during disconnect
      this.clearTimers();
      
      if (!this.stompClient) {
        this.logDebug('No active client to disconnect');
        resolve();
        return;
      }

      // Clean up subscriptions
      this.cleanupSubscriptions();

      // Disconnect the client
      try {
        this.stompClient.deactivate();
      } catch (error) {
        this.logDebug('Error during client deactivation', error);
        // Continue with cleanup even if deactivation fails
      }
      
      // Clear client reference
      this.stompClient = null;
      
      // Reset reconnection flags
      this.isReconnecting = false;
      
      // Notify about disconnection event if handler exists
      if (this.onConnectionEvent) {
        this.onConnectionEvent('disconnect', { 
          unexpected: false, 
          timestamp: Date.now(),
          clean: true
        });
      }
      
      this.logDebug('WebSocket disconnected successfully');
      resolve();
    });
  }

  /**
   * Set up WebSocket subscriptions
   */
  private setupSubscriptions(): void {
    if (!this.stompClient || !this.stompClient.connected) {
      this.logDebug('Cannot setup subscriptions: client not connected');
      return;
    }

    // Subscribe to encore updates
    this.subscriptions['encore'] = this.stompClient.subscribe('/encore', (message: IMessage) => {
      try {
        const encoreData = JSON.parse(message.body);
        
        // Reset encore state when a new stream starts
        if (encoreData.encoreTotal === 0 && 
            encoreData.encoreNeeded === null && 
            encoreData.encoreProgressPercent === 0) {
          this.state.hasEncored = false;
        }
        
        this.state.encoreInformation = encoreData;
        this.logDebug('Received encore update', encoreData);
      } catch (error) {
        this.logDebug('Failed to process encore message', error);
      }
    });

    // Subscribe to chat messages
    this.subscriptions['chat'] = this.stompClient.subscribe('/chat/messages', (message: IMessage) => {
      try {
        const newMessage = JSON.parse(message.body) as ChatMessage;
        this.state.messages = [...this.state.messages, newMessage];
        
        // Limit message history to prevent memory issues
        if (this.state.messages.length > 100) {
          this.state.messages = this.state.messages.slice(-100);
        }
        
        this.logDebug('Received chat message', newMessage);
      } catch (error) {
        this.logDebug('Failed to process chat message', error);
      }
    });

    // Subscribe to viewer count updates
    this.subscriptions['viewers'] = this.stompClient.subscribe('/chat/viewers', (message: IMessage) => {
      try {
        const count = JSON.parse(message.body) as number;
        this.state.viewers = count;
        this.logDebug('Received viewer count update', count);
      } catch (error) {
        this.logDebug('Failed to process viewer count message', error);
      }
    });

    this.logDebug('Subscriptions set up successfully');
  }

  /**
   * Clean up WebSocket subscriptions
   */
  private cleanupSubscriptions(): void {
    // Call each unsubscribe function
    Object.keys(this.subscriptions).forEach(key => {
      try {
        const subscription = this.subscriptions[key];
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        this.logDebug('Error during unsubscribe', error);
      }
    });

    // Clear subscriptions
    this.subscriptions = {};
    this.logDebug('Subscriptions cleaned up');
  }

  /**
   * Fetch the current viewer count
   */
  private async fetchViewerCount(): Promise<void> {
    try {
      // Extract base URL from WebSocket URL
      const baseUrl = this.url.split('/ws')[0];
      const response = await fetch(`${baseUrl}/stream/view/count`);
      const data = await response.json();
      this.state.viewers = data.viewerCount;
      this.logDebug('Fetched viewer count', data.viewerCount);
    } catch (error) {
      this.logDebug('Failed to fetch viewer count', error);
    }
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(): void {
    // Don't attempt reconnection if we're already reconnecting
    if (this.isReconnecting) {
      this.logDebug('Already attempting to reconnect, skipping');
      return;
    }
    
    this.isReconnecting = true;
    
    // Calculate delay based on connection attempts
    const delay = this.calculateBackoffDelay();
    
    this.logDebug(`Attempting reconnection in ${delay}ms (attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);
    
    // Notify about reconnection attempt
    if (this.onConnectionEvent) {
      this.onConnectionEvent('reconnect', { 
        attempt: this.connectionAttempts + 1, 
        maxAttempts: this.maxConnectionAttempts,
        delay,
        timestamp: Date.now()
      });
    }
    
    // Schedule reconnection attempt
    this.reconnectTimer = setTimeout(() => {
      // Save current state for restoration
      const currentState = this.getState();
      
      // Attempt to connect
      this.connect(currentState).catch(error => {
        this.logDebug('Reconnection attempt failed', error);
        // handleError is called by connect() on failure
      });
    }, delay);
  }
  
  /**
   * Clear all timers to prevent memory leaks
   */
  private clearTimers(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Override the base handleError method to provide more specific error handling
   * 
   * @param error The error that occurred
   */
  public override handleError(error: Error): void {
    // Call the base implementation
    super.handleError(error);
    
    // Determine error type if not already known
    let errorType = WebSocketErrorType.UNKNOWN_ERROR;
    
    if (error.message.includes('timeout')) {
      errorType = WebSocketErrorType.TIMEOUT_ERROR;
    } else if (error.message.includes('network') || error.name === 'NetworkError') {
      errorType = WebSocketErrorType.NETWORK_ERROR;
    }
    
    // Handle the error with the determined type
    this.handleConnectionError(error, errorType);
    
    // If we've reached the maximum number of connection attempts, stop trying
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      this.logDebug('Maximum connection attempts reached, giving up');
      
      // Notify about final failure
      if (this.onConnectionEvent) {
        this.onConnectionEvent('error', { 
          error: 'Maximum connection attempts reached', 
          errorType: WebSocketErrorType.CONNECTION_ERROR,
          final: true,
          timestamp: Date.now()
        });
      }
      
      return;
    }
    
    // Otherwise, attempt reconnection
    this.attemptReconnection();
  }
  
  /**
   * Clean up resources when the controller is no longer needed
   * This should be called when the controller is being disposed of
   */
  public dispose(): void {
    this.logDebug('Disposing WebSocketConnectionController');
    
    // Disconnect if connected
    if (this.isConnected) {
      this.disconnect().catch(error => {
        this.logDebug('Error during disconnect while disposing', error);
      });
    }
    
    // Clear all timers
    this.clearTimers();
    
    // Clear subscriptions
    this.cleanupSubscriptions();
    
    // Clear state to help garbage collection
    this.stompClient = null;
    this.subscriptions = {};
    this.state = {
      messages: [],
      encoreInformation: null,
      hasEncored: false,
      viewers: 0
    };
  }
}